import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useGroup } from '../hooks/useGroup';

export function Landing() {
  const navigate = useNavigate();
  const { createGroup, joinGroup, error, clearError } = useGroup(null);
  
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setLoading(true);
    clearError();
    
    const group = await createGroup(groupName.trim());
    if (group) {
      localStorage.setItem('fitorfat_group_id', group.id);
      navigate(`/group/${group.id}`);
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim()) return;
    
    setLoading(true);
    clearError();
    
    const group = await joinGroup(groupCode.trim());
    if (group) {
      localStorage.setItem('fitorfat_group_id', group.id);
      navigate(`/group/${group.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            FitOrFat
          </h1>
          <p className="text-slate-400 mt-2">Track gym days together. Stay accountable.</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700 animate-fade-in">
          {mode === 'choice' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl font-medium hover:from-emerald-500 hover:to-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>Create a Group</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setMode('join')}
                className="w-full flex items-center justify-between p-4 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5" />
                  <span>Join with Code</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g., Gym Bros"
                  className="w-full px-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMode('choice'); clearError(); }}
                  className="flex-1 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !groupName.trim()}
                  className="flex-1 py-3 bg-emerald-600 rounded-xl font-medium hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Group Code
                </label>
                <input
                  type="text"
                  value={groupCode}
                  onChange={e => setGroupCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMode('choice'); clearError(); }}
                  className="flex-1 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || groupCode.length < 6}
                  className="flex-1 py-3 bg-emerald-600 rounded-xl font-medium hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          💪 No excuses. Just gains.
        </p>
      </div>
    </div>
  );
}
