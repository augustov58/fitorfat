import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dumbbell, Plus, Copy, Check, Loader2, Users } from 'lucide-react';
import { useGroup } from '../hooks/useGroup';

export function UserSelect() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { group, users, loading, error, addUser, clearError } = useGroup(groupId || null);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectUser = (userId: string) => {
    localStorage.setItem('fitorfat_user_id', userId);
    navigate(`/group/${groupId}/dashboard`);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    
    setAddingUser(true);
    clearError();
    
    const user = await addUser(newUserName.trim());
    if (user) {
      setNewUserName('');
      setShowAddUser(false);
      handleSelectUser(user.id);
    }
    setAddingUser(false);
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

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-slate-400 mb-4">Group not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-all"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          
          {/* Group Code */}
          <button
            onClick={copyCode}
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-all"
          >
            <span className="font-mono">{group.code}</span>
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Selection */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700 animate-fade-in">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who's checking in?
          </h2>

          {users.length > 0 ? (
            <div className="space-y-3 mb-4">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.initials}
                  </div>
                  <span className="flex-1 text-left font-medium">{user.name}</span>
                  <span className="text-slate-500 group-hover:text-emerald-500 transition-colors">→</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4 mb-4">
              No members yet. Be the first!
            </p>
          )}

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          {/* Add User Form */}
          {showAddUser ? (
            <form onSubmit={handleAddUser} className="space-y-3">
              <input
                type="text"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddUser(false); clearError(); }}
                  className="flex-1 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser || !newUserName.trim()}
                  className="flex-1 py-3 bg-emerald-600 rounded-xl font-medium hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddUser(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Yourself
            </button>
          )}
        </div>

        {/* Switch User Link */}
        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-slate-500 text-sm mt-4 hover:text-slate-300 transition-colors"
        >
          ← Different group
        </button>
      </div>
    </div>
  );
}
