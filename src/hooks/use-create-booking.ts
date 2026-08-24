"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiResult, CreateBookingInput, CreateBookingResult } from "@/types/database";

async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as ApiResult<CreateBookingResult>;
  if (!body.ok) throw new Error(body.error.message);
  return body.data;
}

export function useCreateBooking() {
  return useMutation({ mutationFn: createBooking });
}
