import { Armchair, BatteryCharging, Snowflake, Tv, Wifi, type LucideIcon } from "lucide-react";
import type { VehicleAmenity } from "@/types/database";

/** Icon + short Romanian label per real vehicle amenity key (Fleet
 * Builder-editable — a card only ever shows what's actually configured on
 * that vehicle, no fixed marketing list). "toilet" has no dedicated icon in
 * the set already used elsewhere in the app, so it borrows a neutral one. */
export const AMENITY_ICONS: Record<VehicleAmenity["key"], LucideIcon> = {
  wifi: Wifi,
  ac: Snowflake,
  usb_charging: BatteryCharging,
  toilet: Armchair,
  reclining_seats: Armchair,
  entertainment_system: Tv,
};

export const AMENITY_LABELS: Record<VehicleAmenity["key"], string> = {
  wifi: "Wi-Fi gratuit",
  ac: "Aer condiționat",
  usb_charging: "Prize de încărcare",
  toilet: "Toaletă la bord",
  reclining_seats: "Scaune rabatabile",
  entertainment_system: "Sistem media",
};
