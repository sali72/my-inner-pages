import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Key,
  Shield,
  BookOpen,
  MessageSquare,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmModal } from '@components/journal';

interface UserItem {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  auth_provider: 'google' | 'email';
  login_count: number;
  journal_count: number;
  chat_count: number;
  created_at: string;
  last_login?: string;
}

interface UserListResponse {
  total: number;
  skip: number;
  limit: number;
  users: UserItem[];
}

export const UsersTab: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usersData, setUsersData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const limit = 50;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        ...(search.trim() && { search: search.trim() }),
      });
      const data = await api.get<UserListResponse>(`/admin/users?${queryParams}`);
      setUsersData(data);
    } catch (err) {
      console.error('Failed to fetch user directory:', err);
      setError('Failed to load user directory from server.');
    } finally {
      setLoading(false);
    }
  }, [skip, search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchUsers]);

  const handleToggleStatus = async (targetUser: UserItem) => {
    try {
      setActionLoadingId(targetUser.id);
      const updatedUser = await api.patch<UserItem>(`/admin/users/${targetUser.id}/status`, {
        is_active: !targetUser.is_active,
      });

      setUsersData(prev =>
        prev
          ? {
              ...prev,
              users: prev.users.map(u => (u.id === updatedUser.id ? updatedUser : u)),
            }
          : null
      );
      toast.success(
        `User ${targetUser.email} ${updatedUser.is_active ? 'reactivated' : 'deactivated'}`
      );
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      toast.error(err.message || 'Failed to update user status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setActionLoadingId(userToDelete.id);
      await api.delete(`/admin/users/${userToDelete.id}`);
      const deletedEmail = userToDelete.email;
      setUsersData(prev =>
        prev
          ? {
              ...prev,
              total: prev.total - 1,
              users: prev.users.filter(u => u.id !== userToDelete.id),
            }
          : null
      );
      setUserToDelete(null);
      toast.success(`Account "${deletedEmail}" permanently deleted.`);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      toast.error(err.message || 'Failed to delete user account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-default pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            User Directory & Management
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            View registered user accounts, activity statistics, and manage account status.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setSkip(0);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-default bg-surface text-primary text-xs focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {loading && !usersData ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
            <p className="text-secondary text-sm">Loading users list...</p>
          </div>
        </div>
      ) : error || !usersData ? (
        <div className="p-6 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error || 'Failed to load users.'}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 bg-surface text-primary border border-default rounded-md text-xs hover:bg-hover"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-secondary px-1">
            <span>
              Showing <strong>{usersData.users.length}</strong> of <strong>{usersData.total}</strong> registered users
            </span>
          </div>

          <div className="card overflow-hidden border-default bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-base border-b border-default text-muted uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="p-3 pl-4">User Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Auth Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Activity Summary</th>
                    <th className="p-3">Signed Up</th>
                    <th className="p-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default/50">
                  {usersData.users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted">
                        No users found matching "{search}".
                      </td>
                    </tr>
                  ) : (
                    usersData.users.map(u => {
                      const isSelf = currentUser?.id === u.id;
                      const isLoadingAction = actionLoadingId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-hover/50 transition-colors">
                          <td className="p-3 pl-4 font-medium text-primary font-mono flex items-center gap-2">
                            {u.email}
                            {isSelf && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-accent/10 text-accent uppercase">
                                You
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-base text-secondary border border-default'
                              }`}
                            >
                              {u.role === 'admin' && <Shield className="w-3 h-3 text-amber-500" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-secondary">
                              {u.auth_provider === 'google' ? (
                                <>
                                  <Mail className="w-3.5 h-3.5 text-sky-500" />
                                  Google OAuth
                                </>
                              ) : (
                                <>
                                  <Key className="w-3.5 h-3.5 text-muted" />
                                  Password
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3">
                            {!u.is_active ? (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                <UserX className="w-3.5 h-3.5" />
                                Deactivated
                              </span>
                            ) : u.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Active & Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Active (Unverified)
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3 text-secondary font-mono text-[11px]">
                              <span className="flex items-center gap-1" title="Journal entries created">
                                <BookOpen className="w-3.5 h-3.5 text-accent" />
                                {u.journal_count} entries
                              </span>
                              <span className="flex items-center gap-1" title="AI chat sessions started">
                                <MessageSquare className="w-3.5 h-3.5 text-accent" />
                                {u.chat_count} chats
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-secondary font-mono text-[11px]">
                            {new Date(u.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Active / Deactivate */}
                              <button
                                disabled={isSelf || isLoadingAction}
                                onClick={() => handleToggleStatus(u)}
                                title={
                                  isSelf
                                    ? 'Cannot deactivate your own admin account'
                                    : u.is_active
                                    ? 'Deactivate account'
                                    : 'Reactivate account'
                                }
                                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                  isSelf
                                    ? 'opacity-30 cursor-not-allowed bg-base text-muted'
                                    : u.is_active
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100'
                                }`}
                              >
                                {isLoadingAction ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : u.is_active ? (
                                  <>
                                    <UserX className="w-3 h-3" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3" />
                                    Reactivate
                                  </>
                                )}
                              </button>

                              {/* Delete User */}
                              <button
                                disabled={isSelf || isLoadingAction}
                                onClick={() => setUserToDelete(u)}
                                title={isSelf ? 'Cannot delete your own admin account' : 'Delete user account'}
                                className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {usersData.total > limit && (
            <div className="flex justify-between items-center pt-2">
              <button
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - limit))}
                className="px-3 py-1.5 rounded-lg border border-default text-xs text-secondary hover:bg-hover disabled:opacity-30"
              >
                Previous Page
              </button>
              <span className="text-xs text-muted">
                Page {Math.floor(skip / limit) + 1} of {Math.ceil(usersData.total / limit)}
              </span>
              <button
                disabled={skip + limit >= usersData.total}
                onClick={() => setSkip(skip + limit)}
                className="px-3 py-1.5 rounded-lg border border-default text-xs text-secondary hover:bg-hover disabled:opacity-30"
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <ConfirmModal
          isOpen={!!userToDelete}
          onCancel={() => setUserToDelete(null)}
          onConfirm={handleDeleteUser}
          title="Permanently Delete User Account?"
          message={`Are you sure you want to delete account "${userToDelete.email}"? This will permanently delete all associated journal entries, AI chats, and login sessions.`}
          confirmLabel="Yes, Delete Account"
          cancelLabel="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};
