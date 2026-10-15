export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function hoursLabel(hours: number) {
  const rounded = Math.round(hours * 2) / 2;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ${rounded === 1 ? "hour" : "hours"}`;
}

export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Requested";
    case "ACCEPTED":
      return "Accepted";
    case "DECLINED":
      return "Declined";
    case "CANCELLED":
      return "Cancelled";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}
