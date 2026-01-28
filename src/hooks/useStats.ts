import { useMemo } from 'react';
import { startOfWeek, endOfWeek, subDays, format, parseISO, differenceInDays, isWithinInterval } from 'date-fns';
import type { User, CheckinWithUser, UserStats, TimeRange } from '../types';

const WEEKLY_GOAL = 4;

export function useStats(users: User[], checkins: CheckinWithUser[], timeRange: TimeRange) {
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
      const userCheckins = checkins
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
  }, [users, checkins, timeRange]);

  // Chart data for comparison
  const chartData = useMemo(() => {
    const today = new Date();
    
    let days: number;
    let labelFormat: string;
    let groupBy: 'day' | 'week' | 'month';
    
    switch (timeRange) {
      case '7d':
        days = 7;
        labelFormat = 'EEE';
        groupBy = 'day';
        break;
      case '30d':
        days = 30;
        labelFormat = 'MMM d';
        groupBy = 'day';
        break;
      case '90d':
        days = 90;
        labelFormat = 'MMM d';
        groupBy = 'week';
        break;
      case '1y':
        days = 365;
        labelFormat = 'MMM';
        groupBy = 'month';
        break;
    }

    const dataPoints: Record<string, Record<string, string | number>> = {};
    
    // Initialize data points
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      let key: string;
      
      if (groupBy === 'day') {
        key = format(date, 'yyyy-MM-dd');
      } else if (groupBy === 'week') {
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        key = format(date, 'yyyy-MM');
      }
      
      if (!dataPoints[key]) {
        dataPoints[key] = { label: format(date, labelFormat) };
        users.forEach(u => {
          dataPoints[key][u.name] = 0;
        });
      }
    }

    // Count checkins
    checkins.forEach(c => {
      const date = parseISO(c.date);
      if (date > today || date < subDays(today, days)) return;
      
      let key: string;
      if (groupBy === 'day') {
        key = c.date;
      } else if (groupBy === 'week') {
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        key = format(date, 'yyyy-MM');
      }
      
      if (dataPoints[key] && c.user) {
        const current = dataPoints[key][c.user.name];
        dataPoints[key][c.user.name] = (typeof current === 'number' ? current : 0) + 1;
      }
    });

    return Object.values(dataPoints);
  }, [users, checkins, timeRange]);

  return { stats, chartData };
}
