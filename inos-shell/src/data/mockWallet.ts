import { TimeWalletState } from '../types/timeCredits';
import { T0, calculateLifeHours } from '../services/timeCreditService';

const MEMBER_AGE = 38;

export const mockWallet: TimeWalletState = {
  memberId: 'LDR-0001',
  displayName: 'Larry David Ross',
  joinDate: '2026-05-03',
  age: MEMBER_AGE,
  epoch: 'Epoch 0 → 1',

  spendableBalance: 8_760,
  lifeHours: calculateLifeHours(MEMBER_AGE), // 332,880

  timeScore: 0,
  scoreBreakdown: { skills: 0, deeds: 0, achievements: 0 },

  currentNTV: T0,
  totalTransactions: 0,
  icBalance: 0,

  transactions: [
    {
      id: 'TX-E0-0001',
      type: 'grant',
      status: 'confirmed',
      amount: 8_760,
      method: 'join_grant',
      description: 'Founding Grant — One year of time gifted on network entry',
      timestamp: '2026-05-03T00:00:00Z',
      ntvAtTime: T0,
    },
  ],

  assets: [],
  guilds: [],
  skills: [],
};
