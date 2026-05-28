import { EarningMethod, TransactionType } from '../types/timeCredits';

export const JOIN_GRANT_TT = 8_760;
export const HOURS_PER_YEAR = 8_760;
export const T0 = 0.000001;
export const MICRO_INCREMENT = 0.000000001;

// Canon formula: NTV = (T1 + 0.000000001) × C
export function calculateNTV(T1: number, C: number): number {
  return (T1 + MICRO_INCREMENT) * C;
}

export function calculateLifeHours(age: number): number {
  return age * HOURS_PER_YEAR;
}

// Project NTV after N transactions with average coins per transaction
export function projectNTVGrowth(
  startingValue: number,
  transactionCount: number,
  avgCoinsPerTx: number
): number {
  let v = startingValue;
  for (let i = 0; i < transactionCount; i++) {
    v = (v + MICRO_INCREMENT) * avgCoinsPerTx;
  }
  return v;
}

export function formatTT(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatNTV(ntv: number): string {
  return ntv.toFixed(9);
}

export function formatLifeHours(hours: number): string {
  return hours.toLocaleString('en-US');
}

export function earningMethodLabel(method: EarningMethod | string): string {
  const map: Record<string, string> = {
    guild_work: 'Guild Work',
    wall_task: 'Wall Task',
    volunteer: 'Volunteer',
    time_swap: 'Time Swap',
    asset_living: 'Asset · Living',
    asset_transport: 'Asset · Transport',
    asset_food: 'Asset · Food',
    loan_repay: 'Loan Repay',
    anniversary_grant: 'Anniversary',
    join_grant: 'Join Grant',
  };
  return map[method] ?? method;
}

export function txTypeColor(type: TransactionType): string {
  switch (type) {
    case 'earn':  return '#00ff9d';
    case 'spend': return '#f97316';
    case 'swap':  return '#00f0ff';
    case 'grant': return '#c9a227';
  }
}

export function txTypeSign(type: TransactionType): string {
  switch (type) {
    case 'earn':
    case 'grant': return '+';
    case 'spend': return '−';
    case 'swap':  return '⇄';
  }
}

export function assetRateLabel(type: string): string {
  switch (type) {
    case 'living_space': return '1 TT / hr';
    case 'transport':    return '0.25 TT / hr';
    case 'food':         return 'TBD';
    case 'clothing':     return 'TBD';
    default:             return 'Custom';
  }
}
