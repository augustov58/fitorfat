import { useMemo } from 'react';
import { startOfWeek, endOfWeek, subDays, format, parseISO, differenceInDays, isWithinInterval } from 'date-fns';
import type { User, CheckinWithUser, UserStats, TimeRange } from '../types';

const WEEKLY_GOAL = 4;

export type WorkoutFilter = 'all' | 'Strength' | 'Cardio' | 'Running' | 'Yoga';

export function useStats(users: User[], checkins: CheckinWithUser[], timeRange: TimeRange, workoutFilter: WorkoutFilter = 'all') {
  // Filter checkins by workout type if filter is set
  const filteredCheckins = useMemo(() => {
    if (workoutFilter === 'all') return checkins;
    return checkins.filter(c => c.workout_type === workoutFilter);
  }, [checkins, workoutFilter]);
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Calculate date range
    let startDate: Date;
    switch (timeRange) {
      case '7d':
        startDate = subDays(today, 7);
        break;
      case '30d':
        startDate = subDays(today, 30);
        break;
      case '90d':
        startDate = subDays(today, 90);
        break;
      case '1y':
        startDate = subDays(today, 365);
        break;
    }

    // Current week for weekly goal
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    // Calculate stats for each user
    const userStats: UserStats[] = users.map(user => {
      const userCheckins = filteredCheckins
        .filter(c => c.user_id === user.id)
        .sort((a, b) => b.date.localeCompare(a.date)); // newest first

      // Total in range
      const checkinsInRange = userCheckins.filter(c => {
        const date = parseISO(c.date);
        return date >= startDate && date <= today;
      });

      // This week's checkins
      const thisWeekCheckins = userCheckins.filter(c => {
        const date = parseISO(c.date);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Get unique dates sorted descending
      const uniqueDates = [...new Set(userCheckins.map(c => c.date))].sort((a, b) => b.localeCompare(a));
      
      // Current streak (from today backwards)
      let checkDate = todayStr;
      for (const date of uniqueDates) {
        if (date === checkDate || differenceInDays(parseISO(checkDate), parseISO(date)) <= 1) {
          currentStreak++;
          checkDate = date;
        } else if (date < checkDate) {
          break;
        }
      }
      
      // Longest streak
      if (uniqueDates.length > 0) {
        tempStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const diff = differenceInDays(parseISO(uniqueDates[i - 1]), parseISO(uniqueDates[i]));
          if (diff <= 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      return {
        user,
        totalCheckins: checkinsInRange.length,
        currentStreak,
        longestStreak,
        thisWeek: thisWeekCheckins.length,
        weeklyGoal: WEEKLY_GOAL,
        goalMet: thisWeekCheckins.length >= WEEKLY_GOAL
      };
    });

    // Sort by total checkins descending
    userStats.sort((a, b) => b.totalCheckins - a.totalCheckins);

    return userStats;
  }, [users, filteredCheckins, timeRange]);

  // Chart data for comparison (cumulative line chart)
  const chartData = useMemo(() => {
    const today = new Date();
    
    let days: number;
    let labelFormat: string;
    let step: number; // How many days per data point
    
    switch (timeRange) {
      case '7d':
        days = 7;
        labelFormat = 'EEE';
        step = 1;
        break;
      case '30d':
        days = 30;
        labelFormat = 'MMM d';
        step = 1;
        break;
      case '90d':
        days = 90;
        labelFormat = 'MMM d';
        step = 7; // Weekly points
        break;
      case '1y':
        days = 365;
        labelFormat = 'MMM';
        step = 14; // Bi-weekly points
        break;
    }

    // Get all checkins in range per user
    const startDate = subDays(today, days);
    const userCheckinDates: Record<string, Set<string>> = {};
    
    users.forEach(u => {
      userCheckinDates[u.name] = new Set();
    });
    
    filteredCheckins.forEach(c => {
      const date = parseISO(c.date);
      if (date <= today && date >= startDate && c.user) {
        userCheckinDates[c.user.name]?.add(c.date);
      }
    });

    // Build cumulative data points
    const dataPoints: Array<Record<string, string | number>> = [];
    
    for (let i = days; i >= 0; i -= step) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const point: Record<string, string | number> = {
        label: format(date, labelFormat),
        date: dateStr
      };
      
      // Count cumulative checkins up to this date for each user
      users.forEach(u => {
        let count = 0;
        userCheckinDates[u.name]?.forEach(checkinDate => {
          if (checkinDate <= dateStr) {
            count++;
          }
        });
        point[u.name] = count;
      });
      
      dataPoints.push(point);
    }

    return dataPoints;
  }, [users, filteredCheckins, timeRange]);

  return { stats, chartData };
}
