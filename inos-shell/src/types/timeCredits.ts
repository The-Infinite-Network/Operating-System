export type EarningMethod =
  | 'guild_work'
  | 'wall_task'
  | 'volunteer'
  | 'time_swap'
  | 'asset_living'
  | 'asset_transport'
  | 'asset_food'
  | 'loan_repay'
  | 'anniversary_grant'
  | 'join_grant';

export type SpendingCategory =
  | 'guild_service'
  | 'living_space'
  | 'transport'
  | 'food'
  | 'guild_dues'
  | 'skill_tree'
  | 'time_swap'
  | 'governance'
  | 'crypto_conversion';

export type TransactionType = 'earn' | 'spend' | 'swap' | 'grant';

export type TransactionStatus = 'confirmed' | 'pending' | 'disputed';

export type AssetType = 'living_space' | 'transport' | 'food' | 'clothing' | 'other';

export interface TimeTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  method?: EarningMethod;
  category?: SpendingCategory;
  counterparty?: string;
  description: string;
  timestamp: string;
  ntvAtTime: number;
  cValue?: number;
  poleRef?: string;
}

export interface AssetRegistration {
  id: string;
  name: string;
  type: AssetType;
  earningRateTT: number;
  activeHours: number;
  totalEarned: number;
  status: 'active' | 'inactive' | 'pending_verification';
}

export interface GuildMembership {
  guildId: string;
  guildName: string;
  rank: string;
  joinDate: string;
  duesPct: number;
  status: 'active' | 'pending' | 'inactive';
}

export interface SkillBadge {
  id: string;
  name: string;
  tier: number;
  nftTokenId?: string;
  earnedAt: string;
}

export interface ScoreBreakdown {
  skills: number;
  deeds: number;
  achievements: number;
}

export interface TimeWalletState {
  memberId: string;
  displayName: string;
  joinDate: string;
  age: number;
  epoch: string;
  spendableBalance: number;
  lifeHours: number;
  timeScore: number;
  scoreBreakdown: ScoreBreakdown;
  currentNTV: number;
  totalTransactions: number;
  icBalance: number;
  transactions: TimeTransaction[];
  assets: AssetRegistration[];
  guilds: GuildMembership[];
  skills: SkillBadge[];
}
