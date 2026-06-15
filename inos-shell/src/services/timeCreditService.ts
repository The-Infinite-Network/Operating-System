import type { EarningMethod, TransactionType } from "../types/timeCredits";

export const HOURS_PER_YEAR = 8_760;
export const JOIN_GRANT_TT = 8_760;
export const MICRO_INCREMENT = 0.000001;
export const T0 = 1;

export function calculateLifeHours(age: number) {
  return Math.max(0, Math.round(age * HOURS_PER_YEAR));
}

export function formatTT(value: number) {
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNTV(value: number) {
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: 6,
  }).format(value);
}

export function formatLifeHours(value: number) {
  return `${Intl.NumberFormat("en-US").format(value)} hrs`;
}

export function txTypeColor(type: TransactionType) {
  switch (type) {
    case "earn":
      return "#00ff9d";
    case "spend":
      return "#f97316";
    case "swap":
      return "#00f0ff";
    case "grant":
      return "#c9a227";
    default:
      return "#888888";
  }
}

export function txTypeSign(type: TransactionType) {
  switch (type) {
    case "earn":
    case "grant":
      return "+";
    case "spend":
      return "-";
    case "swap":
      return "+/-";
    default:
      return "";
  }
}

export function earningMethodLabel(method: EarningMethod) {
  const labels: Record<EarningMethod, string> = {
    guild_work: "Guild Work",
    wall_task: "Wall Task",
    volunteer: "Volunteer",
    time_swap: "Time Swap",
    asset_living: "Living Asset",
    asset_transport: "Transport Asset",
    asset_food: "Food Asset",
    loan_repay: "Loan Repay",
    anniversary_grant: "Anniversary Grant",
    join_grant: "Join Grant",
  };

  return labels[method] || method;
}
