import { useState, useEffect, useCallback } from 'react';
import { supabase, generateGroupCode, getInitials } from '../lib/supabase';
import { USER_COLORS } from '../types';
import type { Group, User, Checkin, CheckinWithUser } from '../types';

export function useGroup(groupId: string | null) {
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [checkins, setCheckins] = useState<CheckinWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch group data
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const fetchGroup = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch group
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at');

        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Fetch checkins with user data
        const { data: checkinsData, error: checkinsError } = await supabase
          .from('checkins')
          .select(`
            *,
            user:users(*)
          `)
          .in('user_id', (usersData || []).map(u => u.id))
          .order('date', { ascending: false });

        if (checkinsError) throw checkinsError;
        setCheckins(checkinsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `group_id=eq.${groupId}` }, 
        () => fetchGroup())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, 
        () => fetchGroup())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // Create a new group
  const createGroup = useCallback(async (name: string): Promise<Group | null> => {
    const code = generateGroupCode();
    
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, code })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    return data;
  }, []);

  // Join a group by code
  const joinGroup = useCallback(async (code: string): Promise<Group | null> => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      setError('Invalid group code');
      return null;
    }

    return data;
  }, []);

  // Add a user to the group
  const addUser = useCallback(async (name: string): Promise<User | null> => {
    if (!groupId) return null;

    const initials = getInitials(name);
    const colorIndex = users.length % USER_COLORS.length;
    const color = USER_COLORS[colorIndex];

    const { data, error } = await supabase
      .from('users')
      .insert({
        group_id: groupId,
        name,
        initials,
        color
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setUsers(prev => [...prev, data]);
    return data;
  }, [groupId, users.length]);

  // Add a checkin
  const addCheckin = useCallback(async (
    userId: string,
    date: string,
    durationMinutes?: number,
    workoutType?: string,
    notes?: string
  ): Promise<Checkin | null> => {
    // Check if checkin already exists for this user/date
    const existing = checkins.find(c => c.user_id === userId && c.date === date);
    if (existing) {
      setError('Already checked in for this date');
      return null;
    }

    const { data, error } = await supabase
      .from('checkins')
      .insert({
        user_id: userId,
        date,
        duration_minutes: durationMinutes || null,
        workout_type: workoutType || null,
        notes: notes || null
      })
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setCheckins(prev => [data, ...prev]);
    return data;
  }, [checkins]);

  // Delete a checkin
  const deleteCheckin = useCallback(async (checkinId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('checkins')
      .delete()
      .eq('id', checkinId);

    if (error) {
      setError(error.message);
      return false;
    }

    setCheckins(prev => prev.filter(c => c.id !== checkinId));
    return true;
  }, []);

  // Delete a user (and their checkins via CASCADE)
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      setError(error.message);
      return false;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    setCheckins(prev => prev.filter(c => c.user_id !== userId));
    return true;
  }, []);

  return {
    group,
    users,
    checkins,
    loading,
    error,
    createGroup,
    joinGroup,
    addUser,
    addCheckin,
    deleteCheckin,
    deleteUser,
    clearError: () => setError(null)
  };
}
