import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, ChevronLeft, ChevronRight, Flame, 
  Trophy, Target, Trash2, X, Loader2, LogOut, Copy, Check
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useGroup } from '../hooks/useGroup';
import { useStats } from '../hooks/useStats';
import { WORKOUT_TYPES } from '../types';
import type { TimeRange, CheckinWithUser } from '../types';

export function Dashboard() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const userId = localStorage.getItem('fitorfat_user_id');
  
  const { group, users, checkins, loading, addCheckin, deleteCheckin, error, clearError } = useGroup(groupId || null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { stats, chartData } = useStats(users, checkins, timeRange);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [checkinForm, setCheckinForm] = useState({
    duration: '',
    workoutType: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUser = users.find(u => u.id === userId);
  
  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Pad start to align with weekday
    const startDay = start.getDay();
    const paddedDays: (Date | null)[] = Array(startDay).fill(null);
    return [...paddedDays, ...days];
  }, [currentMonth]);

  // Group checkins by date
  const checkinsByDate = useMemo(() => {
    const map = new Map<string, CheckinWithUser[]>();
    checkins.forEach(c => {
      const existing = map.get(c.date) || [];
      map.set(c.date, [...existing, c]);
    });
    return map;
  }, [checkins]);

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    setShowCheckinModal(true);
    setCheckinForm({ duration: '', workoutType: '', notes: '' });
    clearError();
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedDate) return;
    
    setSubmitting(true);
    const result = await addCheckin(
      userId,
      selectedDate,
      checkinForm.duration ? parseInt(checkinForm.duration) : undefined,
      checkinForm.workoutType || undefined,
      checkinForm.notes || undefined
    );
    
    if (result) {
      setShowCheckinModal(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async (checkinId: string) => {
    if (confirm('Remove this check-in?')) {
      await deleteCheckin(checkinId);
    }
  };

  const copyCode = async () => {
    if (group) {
      await navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!currentUser) {
    navigate(`/group/${groupId}`);
    return null;
  }

  const userCheckinToday = checkins.find(
    c => c.user_id === userId && c.date === format(new Date(), 'yyyy-MM-dd')
  );

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.initials}
            </div>
            <div>
              <h1 className="font-bold text-lg">{group?.name}</h1>
              <button
                onClick={copyCode}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <span className="font-mono">{group?.code}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate(`/group/${groupId}`)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Switch user"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Quick Check-in Button */}
        {!userCheckinToday && (
          <button
            onClick={() => handleDayClick(new Date())}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:from-emerald-500 hover:to-emerald-400 transition-all pulse-glow"
          >
            <Dumbbell className="w-6 h-6" />
            Check In Today
          </button>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {stats.slice(0, 3).map((s, i) => (
            <div
              key={s.user.id}
              className={`bg-slate-800/50 rounded-xl p-3 border ${
                s.user.id === userId ? 'border-emerald-500/50' : 'border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {i === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: s.user.color }}
                >
                  {s.user.initials}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-bold">{s.currentStreak}</span>
                <span className="text-slate-500">day streak</span>
              </div>
              <div className="flex items-center gap-1 text-sm mt-1">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className={s.goalMet ? 'text-emerald-500 font-bold' : ''}>
                  {s.thisWeek}/{s.weeklyGoal}
                </span>
                <span className="text-slate-500">this week</span>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-700 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-700 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayCheckins = checkinsByDate.get(dateStr) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              
              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(day)}
                  disabled={day > new Date()}
                  className={`
                    relative aspect-square rounded-lg flex flex-col items-center justify-center p-1
                    ${isCurrentMonth ? 'text-white' : 'text-slate-600'}
                    ${today ? 'bg-emerald-500/20 ring-1 ring-emerald-500' : 'hover:bg-slate-700'}
                    ${day > new Date() ? 'opacity-30 cursor-not-allowed' : ''}
                    transition-all
                  `}
                >
                  <span className={`text-sm ${today ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {dayCheckins.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayCheckins.slice(0, 3).map(c => (
                        <div
                          key={c.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: c.user?.color }}
                          title={c.user?.name}
                        />
                      ))}
                      {dayCheckins.length > 3 && (
                        <span className="text-[8px] text-slate-400">+{dayCheckins.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Comparison</h2>
            <div className="flex gap-1 bg-slate-700 rounded-lg p-1">
              {(['7d', '30d', '90d', '1y'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 py-1 text-xs rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#475569' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {users.map(user => (
                  <Bar
                    key={user.id}
                    dataKey={user.name}
                    fill={user.color}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-4">Leaderboard ({timeRange})</h2>
          <div className="space-y-3">
            {stats.map((s, i) => (
              <div
                key={s.user.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  s.user.id === userId ? 'bg-slate-700/50' : ''
                }`}
              >
                <span className={`w-6 text-center font-bold ${
                  i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  {i + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: s.user.color }}
                >
                  {s.user.initials}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{s.user.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-500">{s.totalCheckins}</span>
                  <span className="text-slate-500 text-sm ml-1">days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {checkins.slice(0, 10).map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 group"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: c.user?.color }}
                >
                  {c.user?.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.user?.name}</span>
                    {c.workout_type && (
                      <span className="text-xs bg-slate-600 px-2 py-0.5 rounded-full">
                        {c.workout_type}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {format(parseISO(c.date), 'MMM d')}
                    {c.duration_minutes && ` • ${c.duration_minutes} min`}
                  </div>
                </div>
                {c.user_id === userId && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckinModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-semibold">
                Check In - {format(parseISO(selectedDate), 'MMM d, yyyy')}
              </h3>
              <button
                onClick={() => setShowCheckinModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckin} className="p-4 space-y-4">
              {/* Already checked in warning */}
              {checkins.find(c => c.user_id === userId && c.date === selectedDate) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
                  You already checked in on this day!
                </div>
              )}

              {/* Workout Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Workout Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCheckinForm(f => ({ ...f, workoutType: f.workoutType === type ? '' : type }))}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        checkinForm.workoutType === type
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={checkinForm.duration}
                  onChange={e => setCheckinForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g., 60"
                  min="1"
                  max="480"
                  className="w-full px-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={checkinForm.notes}
                  onChange={e => setCheckinForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="What did you do?"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !!checkins.find(c => c.user_id === userId && c.date === selectedDate)}
                className="w-full py-3 bg-emerald-600 rounded-xl font-semibold hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Dumbbell className="w-5 h-5" />
                    Log Workout
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
