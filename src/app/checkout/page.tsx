"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Ticket, User } from "lucide-react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useBookingStore } from "@/store/booking-store";
import { useCreateBooking } from "@/hooks/use-create-booking";
import type { CreateBookingResult, FareClass } from "@/types/database";

interface PassengerFormRow {
  seatLockId: string;
  seatNumber: string;
  fullName: string;
  fareClass: FareClass;
  priceAmount: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const sessionId = useBookingStore((s) => s.sessionId);
  const reset = useBookingStore((s) => s.reset);

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [rows, setRows] = useState<PassengerFormRow[]>(
    selectedSeats.map((s) => ({
      seatLockId: s.seatLockId,
      seatNumber: s.seatNumber,
      fullName: "",
      fareClass: s.fareClass,
      priceAmount: s.priceAmount,
    }))
  );

  const createBooking = useCreateBooking();
  const [result, setResult] = useState<CreateBookingResult | null>(null);

  const total = rows.reduce((sum, r) => sum + r.priceAmount, 0);
  const canSubmit = contactEmail.trim().length > 3 && rows.every((r) => r.fullName.trim().length > 1);

  function updateName(seatLockId: string, fullName: string) {
    setRows((prev) => prev.map((r) => (r.seatLockId === seatLockId ? { ...r, fullName } : r)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createBooking.mutate(
      {
        contactEmail,
        contactPhone: contactPhone || undefined,
        sessionId,
        paymentProvider: "demo",
        passengers: rows.map((r) => ({
          seatLockId: r.seatLockId as never,
          fullName: r.fullName,
          fareClass: r.fareClass,
        })),
      },
      {
        onSuccess: (data) => {
          setResult(data);
          reset();
        },
      }
    );
  }

  if (result) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-positive-muted text-positive">
            <CheckCircle2 className="size-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-semibold text-ink">Booking confirmed</h1>
          <p className="mt-1 text-sm text-ink-secondary">{result.booking.booking_number}</p>

          <div className="mt-6 flex flex-col gap-3">
            {result.tickets.map((t) => (
              <Card key={t.id} className="flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <Ticket className="size-4 text-accent" strokeWidth={1.75} />
                  <div>
                    <div className="text-sm font-medium text-ink">{t.passenger_full_name}</div>
                    <div className="font-mono text-xs text-ink-tertiary">{t.ticket_number}</div>
                  </div>
                </div>
                <div className="text-sm tabular-nums text-ink-secondary">
                  {t.price_amount.toFixed(0)} {t.currency}
                </div>
              </Card>
            ))}
          </div>

          <Button variant="secondary" size="md" className="mt-8" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </main>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-lg px-6 py-16 text-center">
          <p className="text-sm text-ink-secondary">No seats selected yet.</p>
          <Button variant="secondary" size="md" className="mt-4" onClick={() => router.push("/")}>
            Start a search
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-lg px-6 py-8">
        <h1 className="mb-6 text-lg font-semibold text-ink">Passenger details</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.seatLockId} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-sunken text-xs font-medium text-ink-secondary">
                  {row.seatNumber}
                </span>
                <Input
                  icon={<User className="size-4" strokeWidth={1.5} />}
                  placeholder="Full name, as on ID"
                  value={row.fullName}
                  onChange={(e) => updateName(row.seatLockId, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <Input type="email" placeholder="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
            <Input type="tel" placeholder="Contact phone (optional)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>

          {createBooking.isError && (
            <div className="rounded-md border border-danger/30 bg-danger/[0.06] px-3 py-2 text-sm text-danger">
              {createBooking.error instanceof Error ? createBooking.error.message : "Checkout failed — please try again."}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-md text-ink-secondary">Total</div>
            <div className="text-xl font-semibold tabular-nums text-ink">
              {total.toFixed(0)} <span className="text-sm font-normal text-ink-tertiary">RON</span>
            </div>
          </div>

          <Button type="submit" variant="accent" size="lg" disabled={!canSubmit || createBooking.isPending}>
            {createBooking.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm and pay
          </Button>
        </form>
      </main>
    </div>
  );
}
