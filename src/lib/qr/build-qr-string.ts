/**
 * Client-safe reconstruction of the scannable QR string from a ticket's
 * already-issued `qr_payload` (canonical JSON) + `hmac_signature`. This is
 * NOT signing — the signature was computed server-side in
 * `src/lib/crypto/ticket-hmac.ts` at issuance, using a secret this bundle
 * never sees. Rebuilding the display string from public ticket fields is
 * safe: `${base64url(payload)}.${signature}` carries no secret, and a
 * conductor's scanner re-derives the same HMAC to verify it — this function
 * only has to match that encoding byte-for-byte.
 */
function base64url(input: string): string {
  // btoa is Latin1-only; this is the standard UTF-8-safe workaround.
  const base64 = btoa(unescape(encodeURIComponent(input)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildQrString(qrPayloadJson: string, hmacSignature: string): string {
  return `${base64url(qrPayloadJson)}.${hmacSignature}`;
}
