import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  TicketQrPayloadV1,
  SignedTicketQr,
  TicketVerificationResult,
} from "@/types/database";

/**
 * Offline-verifiable ticket signing.
 *
 * A conductor's device provisions the active HMAC secret(s) at app install /
 * sync time (never over an insecure channel, never bundled in the passenger
 * app). It can then verify a scanned QR entirely offline: recompute
 * HMAC-SHA256(payloadJson, secret[keyVersion]) and constant-time-compare
 * against the signature embedded in the QR string. No network round-trip,
 * no DB lookup required to prove the ticket is authentic — only to check
 * whether it has *already* been checked in (a separate, online concern
 * handled by `POST /api/tickets/[ticketId]/verify`).
 *
 * Key rotation: TICKET_HMAC_SECRET is the current signing key
 * (TICKET_HMAC_KEY_VERSION). TICKET_HMAC_SECRET_PREVIOUS lets tickets issued
 * under the previous key still verify during a rotation window.
 */

interface KeyRing {
  [version: number]: string;
}

function loadKeyRing(): { keyRing: KeyRing; currentVersion: number } {
  const currentVersion = Number(process.env.TICKET_HMAC_KEY_VERSION ?? "1");
  const currentSecret = process.env.TICKET_HMAC_SECRET;
  if (!currentSecret) {
    throw new Error("TICKET_HMAC_SECRET is not configured");
  }

  const keyRing: KeyRing = { [currentVersion]: currentSecret };

  const previousSecret = process.env.TICKET_HMAC_SECRET_PREVIOUS;
  if (previousSecret) {
    keyRing[currentVersion - 1] = previousSecret;
  }

  return { keyRing, currentVersion };
}

/**
 * Canonical JSON serialization — explicit key order so the same payload
 * object always produces byte-identical JSON, on server and on the offline
 * verifier. Do not use `JSON.stringify(payload)` directly elsewhere; object
 * key order in JS is insertion order but is easy to accidentally break via
 * spread/destructure, so we pin it here.
 */
function serializePayload(payload: TicketQrPayloadV1): string {
  const ordered: TicketQrPayloadV1 = {
    v: payload.v,
    ticketNumber: payload.ticketNumber,
    ticketId: payload.ticketId,
    tripId: payload.tripId,
    seatId: payload.seatId,
    seatNumber: payload.seatNumber,
    originRouteStopId: payload.originRouteStopId,
    destinationRouteStopId: payload.destinationRouteStopId,
    fareClass: payload.fareClass,
    issuedAt: payload.issuedAt,
    keyVersion: payload.keyVersion,
  };
  return JSON.stringify(ordered);
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

export function signTicketPayload(payload: Omit<TicketQrPayloadV1, "keyVersion">): SignedTicketQr {
  const { keyRing, currentVersion } = loadKeyRing();
  const fullPayload: TicketQrPayloadV1 = { ...payload, keyVersion: currentVersion };
  const payloadJson = serializePayload(fullPayload);
  const signature = createHmac("sha256", keyRing[currentVersion]!).update(payloadJson).digest("hex");
  const qrString = `${base64url(payloadJson)}.${signature}`;

  return { payload: fullPayload, payloadJson, signature, qrString };
}

/**
 * Verifies a scanned QR string. Pure function, no I/O — safe to run on a
 * conductor device with the key ring bundled locally, or on the server as a
 * secondary check inside `/api/tickets/[ticketId]/verify`.
 */
export function verifyTicketQr(qrString: string, keyRing: KeyRing): TicketVerificationResult {
  const dotIndex = qrString.lastIndexOf(".");
  if (dotIndex === -1) {
    return { valid: false, reason: "malformed" };
  }

  const encodedPayload = qrString.slice(0, dotIndex);
  const providedSignature = qrString.slice(dotIndex + 1);

  let payload: TicketQrPayloadV1;
  let payloadJson: string;
  try {
    payloadJson = base64urlDecode(encodedPayload);
    payload = JSON.parse(payloadJson) as TicketQrPayloadV1;
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const secret = keyRing[payload.keyVersion];
  if (!secret) {
    return { valid: false, reason: "unknown_key_version" };
  }

  // Re-derive canonical JSON from the parsed fields rather than trusting
  // payloadJson verbatim, so key-order tampering can't smuggle a different
  // byte sequence past a naive comparison.
  const canonicalJson = serializePayload(payload);
  const expectedSignature = createHmac("sha256", secret).update(canonicalJson).digest("hex");

  const provided = Buffer.from(providedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { valid: false, reason: "bad_signature" };
  }

  return { valid: true, payload };
}

/** Convenience wrapper that loads the server-side key ring from env. */
export function verifyTicketQrOnServer(qrString: string): TicketVerificationResult {
  const { keyRing } = loadKeyRing();
  return verifyTicketQr(qrString, keyRing);
}
