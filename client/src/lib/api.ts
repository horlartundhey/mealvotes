export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'Something went wrong', body.code);
  return body as T;
}

export interface Member {
  id: string;
  displayName: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Household {
  id: string;
  name: string;
  me: Member;
  members: Member[];
  inviteUrl?: string;
}

export interface InvitePreview {
  valid: true;
  household: { id: string; name: string };
  memberCount: number;
  me: Member | null;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: import('./theme').Category;
  prepMinutes: number;
  estimatedCost: number;
  image: { url: string; credit?: string; creditUrl?: string; source?: string } | null;
  isCustom: boolean;
  isActive: boolean;
}

export interface NewMeal {
  name: string;
  category: import('./theme').Category;
  prepMinutes: number;
  estimatedCost: number;
  description?: string;
  imageUrl?: string;
}

export interface Breakdown {
  mealId: string;
  voters: string[];
}

export interface Today {
  date: string;
  serverTime: string;
  isToday: boolean;
  round: {
    id: string;
    roundNumber: number;
    status: 'OPEN' | 'CALCULATING' | 'COMPLETED' | 'NO_MAJORITY' | 'NO_VOTES' | 'EXPIRED';
    isOpen: boolean;
    opensAt: string;
    closesAt: string;
    options: { letter: string; meal: Meal }[];
    members: { id: string; displayName: string; hasVoted: boolean }[];
    votedCount: number;
    eligibleCount: number;
    myVoteMealId: string | null;
  };
  result: null | {
    winner: Meal;
    selectionMethod: 'MAJORITY' | 'FALLBACK';
    winningVotes: number;
    eligibleCount: number;
    daysSinceEaten: number | null;
    breakdown: Breakdown[];
  };
  previousRounds: { roundNumber: number; status: string; options: Meal[]; breakdown: Breakdown[] }[];
  canStartAnotherRound: boolean;
  libraryShortfall: boolean;
}

export interface Stats {
  streak: number;
  bestStreak: number;
  votesCast: number;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpPerLevel: number;
  decidedMeals: number;
  badges: { id: string; name: string; emoji: string; description: string; earned: boolean }[];
}

export interface HistoryDay {
  date: string;
  meal: Meal;
  selectionMethod: 'MAJORITY' | 'FALLBACK';
  winningVotes: number;
}

export const api = {
  createHousehold: (name: string, ownerName: string) =>
    request<{ id: string; name: string; inviteUrl: string; me: Member }>('/households', {
      method: 'POST',
      body: JSON.stringify({ name, ownerName }),
    }),
  getHousehold: (id: string) => request<Household>(`/households/${id}`),
  rotateInvite: (id: string) => request<{ inviteUrl: string }>(`/households/${id}/invite`, { method: 'POST' }),
  removeMember: (id: string, memberId: string) =>
    request<void>(`/households/${id}/members/${memberId}`, { method: 'DELETE' }),
  getInvite: (token: string) => request<InvitePreview>(`/invites/${token}`),
  join: (token: string, displayName: string) =>
    request<{ participant: Member; householdId: string }>(`/invites/${token}/join`, {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    }),
  getMeals: (householdId: string) => request<{ meals: Meal[] }>(`/households/${householdId}/meals`),
  addMeal: (householdId: string, meal: NewMeal) =>
    request<Meal>(`/households/${householdId}/meals`, { method: 'POST', body: JSON.stringify(meal) }),
  setMealActive: (householdId: string, mealId: string, isActive: boolean) =>
    request<{ id: string; isActive: boolean }>(`/households/${householdId}/meals/${mealId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  getToday: (householdId: string) => request<Today>(`/households/${householdId}/today`),
  vote: (householdId: string, roundId: string, mealId: string) =>
    request<Today>(`/households/${householdId}/rounds/${roundId}/vote`, { method: 'PUT', body: JSON.stringify({ mealId }) }),
  startAnotherRound: (householdId: string) => request<Today>(`/households/${householdId}/rounds`, { method: 'POST' }),
  getHistory: (householdId: string, month: string) =>
    request<{ month: string; days: HistoryDay[] }>(`/households/${householdId}/history?month=${month}`),
  getStats: (householdId: string) => request<Stats>(`/households/${householdId}/stats`),
};
