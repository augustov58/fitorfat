export interface Group {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  group_id: string;
  name: string;
  initials: string;
  color: string;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  duration_minutes: number | null;
  workout_type: string | null;
  notes: string | null;
  created_at: string;
}

export interface CheckinWithUser extends Checkin {
  user: User;
}

export interface UserStats {
  user: User;
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
  weeklyGoal: number;
  goalMet: boolean;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y';

export const WORKOUT_TYPES = [
  'Strength',
  'Cardio',
  'HIIT',
  'Yoga',
  'CrossFit',
  'Swimming',
  'Running',
  'Cycling',
  'Sports',
  'Other'
] as const;

export type WorkoutType = typeof WORKOUT_TYPES[number];

// Nice color palette for users
export const USER_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#e11d48', // rose
] as const;
