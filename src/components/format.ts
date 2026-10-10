import { Smartphone, Laptop, Cable, Package, Battery } from "lucide-react";
export const categoryIcons = {
  Phones: Smartphone,
  Computers: Laptop,
  "Cables & chargers": Cable,
  "Small electronics": Package,
  Batteries: Battery,
};
export const number = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
export const displayDate = (date: string) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }) + " IST"
    : "To be proposed";
export const istTimestamp = (value: FormDataEntryValue | null) =>
  `${String(value)}+05:30`;
