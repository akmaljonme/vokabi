import { useState, useEffect } from 'react';
import { Search, MoreVertical, Shield, ShieldOff, Trash2, Eye, Crown, AlertTriangle, Download } from 'lucide-react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { logAdminAction } from '@/lib/adminAudit';
import { exportToCSV } from '@/lib/csvExport';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_seen_at: string | null;
  roles: string[];
  test_count: number;
  avg_score: number;
  is_pro: boolean;
}

export const UsersTab = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userTests, setUserTests] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each user, fetch their roles and test stats
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Fetch roles
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          // Fetch test stats
          const { data: tests } = await supabase
            .from('test_results')
            .select('percentage')
            .eq('user_id', profile.user_id);

          // Fetch subscription
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan, expires_at')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          const isPro = sub?.plan === 'pro' && (!sub.expires_at || new Date(sub.expires_at) > new Date());

          const avgScore = tests?.length 
            ? Math.round(tests.reduce((acc, t) => acc + t.percentage, 0) / tests.length)
            : 0;

          return {
            ...profile,
            roles: rolesData?.map(r => r.role) || [],
            test_count: tests?.length || 0,
            avg_score: avgScore,
            is_pro: isPro
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        await logAdminAction('role_removed', userId, { role: 'admin' });
        toast.success('Admin role removed');
      } else {
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        await logAdminAction('role_granted', userId, { role: 'admin' });
        toast.success('Admin role granted');
      }
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const toggleProStatus = async (userId: string, isCurrentlyPro: boolean) => {
    try {
      if (isCurrentlyPro) {
        await supabase
          .from('subscriptions')
          .delete()
          .eq('user_id', userId);
        await logAdminAction('pro_removed', userId);
        toast.success('Pro status olib tashlandi');
      } else {
        await supabase
          .from('subscriptions')
          .upsert({ user_id: userId, plan: 'pro' }, { onConflict: 'user_id' });
        await logAdminAction('pro_granted', userId, { plan: 'pro' });
        toast.success('Pro status berildi');
      }
      fetchUsers();
    } catch (error) {
      console.error('Error updating pro status:', error);
      toast.error('Pro statusni yangilashda xatolik');
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('delete-user', {
        body: { user_id: deleteTarget.user_id },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || 'Xatolik');
      }
      await logAdminAction('user_deleted', deleteTarget.user_id, { full_name: deleteTarget.full_name });
      toast.success(`${deleteTarget.full_name || 'Foydalanuvchi'} o'chirildi`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Foydalanuvchini o\'chirishda xatolik');
    } finally {
      setDeleting(false);
    }
  };

  const viewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    
    const { data: tests } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    setUserTests(tests || []);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users Management</h2>
          <p className="text-muted-foreground">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              exportToCSV('vokabi_users', filteredUsers.map(u => ({
                'Ism': u.full_name || '',
                'User ID': u.user_id,
                'Rol': u.roles.join('; ') || 'user',
                'Plan': u.is_pro ? 'Pro' : 'Free',
                'Testlar soni': u.test_count,
                "O'rtacha ball": u.avg_score,
                "Ro'yxatdan o'tgan": new Date(u.created_at).toLocaleDateString('uz-UZ'),
                'Oxirgi faollik': u.last_seen_at ? new Date(u.last_seen_at).toLocaleString('uz-UZ') : '—',
              })));
              logAdminAction('csv_exported', null, { export: 'users_csv', count: filteredUsers.length }).catch(() => {});
            }}
          >
            <Download className="w-4 h-4 mr-2" /> CSV eksport
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Plan</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Tests Taken</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Avg Score</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Last seen</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isAdmin = user.roles.includes('admin');
                return (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                          <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          Student
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {user.is_pro ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                          <Crown className="w-3 h-3" />
                          Pro
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm">{user.test_count}</td>
                    <td className="py-4 px-4">
                      <span className={user.avg_score >= 60 ? 'text-green-500' : 'text-destructive'}>
                        {user.avg_score}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {user.last_seen_at
                        ? format(new Date(user.last_seen_at), 'MMM d, HH:mm')
                        : '—'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAdminRole(user.user_id, isAdmin)}>
                            {isAdmin ? (
                              <>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Make Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleProStatus(user.user_id, user.is_pro)}>
                            {user.is_pro ? (
                              <>
                                <Crown className="w-4 h-4 mr-2 text-muted-foreground" />
                                Remove Pro
                              </>
                            ) : (
                              <>
                                <Crown className="w-4 h-4 mr-2 text-amber-500" />
                                Make Pro
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteTarget(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Foydalanuvchini o'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name || 'Unnamed User'}</h3>
                  <p className="text-sm text-muted-foreground">
                    Joined {format(new Date(selectedUser.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{selectedUser.test_count}</p>
                  <p className="text-sm text-muted-foreground">Tests Taken</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{selectedUser.avg_score}%</p>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{selectedUser.roles.includes('admin') ? 'Admin' : 'Student'}</p>
                  <p className="text-sm text-muted-foreground">Role</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Recent Tests</h4>
                <div className="space-y-2">
                  {userTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium bg-level-${test.level.toLowerCase()}/20 text-level-${test.level.toLowerCase()}`}>
                          {test.level}
                        </span>
                        <span className="capitalize">{test.skill}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={test.percentage >= 60 ? 'text-green-500' : 'text-destructive'}>
                          {test.percentage}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(test.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {userTests.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No tests taken yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => !deleting && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Foydalanuvchini o'chirish
            </DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.full_name || 'Foydalanuvchi'}</strong> butunlay o'chiriladi. 
              Barcha ma'lumotlari (testlar, natijalar, xabarlar) ham yo'q qilinadi. 
              Bu amalni qaytarib bo'lmaydi!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={deleteUser} disabled={deleting}>
              {deleting ? 'O\'chirilmoqda...' : 'Ha, o\'chirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
