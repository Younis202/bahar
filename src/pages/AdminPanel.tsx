import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, BookOpen, GraduationCap, TrendingUp, Search,
  Shield, CheckCircle, XCircle, Edit, Trash2, Eye, AlertCircle,
  Clock, Check, X
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'courses' | 'applications';

export default function AdminPanel() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    if (tab === 'overview' || tab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
    }
    if (tab === 'overview' || tab === 'courses') {
      const { data } = await supabase.from('courses').select('*, profiles(full_name)').order('created_at', { ascending: false });
      if (data) setCourses(data);
    }
    if (tab === 'applications') {
      const { data } = await supabase
        .from('instructor_applications')
        .select('*, profiles(full_name, email, avatar_url)')
        .order('created_at', { ascending: false });
      if (data) setApplications(data);
    }
    if (tab === 'overview') {
      const [{ count: userCount }, { count: courseCount }, { count: enrollCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ users: userCount || 0, courses: courseCount || 0, enrollments: enrollCount || 0, revenue: 0 });
    }
    setLoading(false);
  };

  const handleApplicationAction = async (appId: string, userId: string, action: 'approved' | 'rejected') => {
    await supabase.from('instructor_applications').update({
      status: action,
      reviewed_by: profile!.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', appId);

    if (action === 'approved') {
      await supabase.from('profiles').update({ role: 'instructor' }).eq('id', userId);
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '🎉 تمت الموافقة على طلبك!',
        message: 'تمت الموافقة على طلبك كمحاضر في BahriaAcad. يمكنك الآن إنشاء كورساتك.',
        type: 'success',
        link: '/dashboard/instructor',
      });
    } else {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'طلب المحاضر',
        message: 'نأسف، لم نتمكن من قبول طلبك في الوقت الحالي. يمكنك إعادة التقديم لاحقاً.',
        type: 'warning',
      });
    }

    toast({ title: action === 'approved' ? '✅ تمت الموافقة' : '❌ تم الرفض' });
    loadData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({ title: 'تم حذف المستخدم' });
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course? All enrollments will be removed.')) return;
    await supabase.from('courses').delete().eq('id', id);
    setCourses(prev => prev.filter(c => c.id !== id));
    toast({ title: 'تم حذف الكورس' });
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role: string) => {
    if (role === 'admin') return 'bg-red-500/10 text-red-400';
    if (role === 'instructor') return 'bg-blue-500/10 text-blue-400';
    return 'bg-green-500/10 text-green-400';
  };

  const platformStats = [
    { label: 'Total Users', value: stats.users.toLocaleString(), icon: Users },
    { label: 'Active Courses', value: stats.courses.toString(), icon: BookOpen },
    { label: 'Total Enrollments', value: stats.enrollments.toLocaleString(), icon: GraduationCap },
    { label: 'Applications', value: applications.filter(a => a.status === 'pending').length.toString(), icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">Manage the entire BahriaAcad platform</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400 font-medium">Admin Access</span>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 mb-8 w-fit">
          {(['overview', 'users', 'courses', 'applications'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
              {t === 'applications' && applications.filter(a => a.status === 'pending').length > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs inline-flex items-center justify-center">
                  {applications.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {platformStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="font-display text-2xl font-bold">{loading ? '...' : value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold mb-4">Monthly Enrollments</h3>
                <div className="h-32 flex items-end gap-1.5">
                  {[35, 52, 45, 68, 60, 85, 78, 92, 88, 105, 98, 115].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/60 rounded-t hover:bg-primary transition-colors" style={{ height: `${(h / 115) * 100}%` }} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Jan</span><span>Jun</span><span>Dec</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold mb-4">Users by Role</h3>
                <div className="space-y-3">
                  {[
                    { role: 'Students', count: users.filter(u => u.role === 'student').length, color: 'bg-green-500' },
                    { role: 'Instructors', count: users.filter(u => u.role === 'instructor').length, color: 'bg-blue-500' },
                    { role: 'Admins', count: users.filter(u => u.role === 'admin').length, color: 'bg-red-500' },
                  ].map(({ role, count, color }) => (
                    <div key={role}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{role}</span><span>{count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full">
                        <div className={`h-full ${color} rounded-full`} style={{ width: users.length ? `${(count / users.length) * 100}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">User Management ({users.length})</h2>
            </div>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-10" />
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                              {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-medium">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${roleColor(u.role)}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Courses Tab */}
        {tab === 'courses' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">Course Management ({courses.length})</h2>
            </div>
            <div className="space-y-3">
              {courses.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                  <img
                    src={c.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=100&h=60&fit=crop'}
                    alt={c.title}
                    className="w-16 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold line-clamp-1">{c.title}</h3>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>by {(c.profiles as any)?.full_name || '—'}</span>
                      <span>{c.students_count || 0} students</span>
                      <span>${c.price || 0}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${c.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {c.status}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteCourse(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Applications Tab */}
        {tab === 'applications' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold">Instructor Applications</h2>
              <div className="flex gap-2 text-xs">
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                  <button
                    key={f}
                    onClick={() => setAppFilter(f as any)}
                    className={`px-3 py-1 rounded-lg border transition-colors capitalize ${
                      appFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f === 'all' ? `All (${applications.length})` :
                     f === 'pending' ? `Pending (${applications.filter(a => a.status === 'pending').length})` :
                     f === 'approved' ? `Approved (${applications.filter(a => a.status === 'approved').length})` :
                     `Rejected (${applications.filter(a => a.status === 'rejected').length})`}
                  </button>
                ))}
              </div>
            </div>

            {applications.filter(a => appFilter === 'all' || a.status === appFilter).length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No applications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.filter(a => appFilter === 'all' || a.status === appFilter).map(app => (
                  <div key={app.id} className={`bg-card border rounded-xl p-5 transition-colors ${
                    app.status === 'pending' ? 'border-yellow-500/30 hover:border-yellow-500/50' :
                    app.status === 'approved' ? 'border-green-500/20' : 'border-red-500/20'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-base font-bold text-primary-foreground shrink-0">
                        {(app.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold">{(app.profiles as any)?.full_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize ${
                            app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                            app.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>{app.status}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(app.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{(app.profiles as any)?.email}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="bg-secondary/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-muted-foreground">التخصص</p>
                            <p className="text-sm font-medium truncate">{app.expertise}</p>
                          </div>
                          <div className="bg-secondary/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-muted-foreground">سنوات الخبرة</p>
                            <p className="text-sm font-medium">{app.experience_years} سنة</p>
                          </div>
                          {app.linkedin_url && (
                            <div className="bg-secondary/40 rounded-lg px-3 py-2">
                              <p className="text-xs text-muted-foreground">LinkedIn</p>
                              <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate block hover:underline">عرض الملف</a>
                            </div>
                          )}
                          {app.portfolio_url && (
                            <div className="bg-secondary/40 rounded-lg px-3 py-2">
                              <p className="text-xs text-muted-foreground">Portfolio</p>
                              <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate block hover:underline">عرض الموقع</a>
                            </div>
                          )}
                        </div>

                        <div className="bg-secondary/20 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">النبذة الشخصية:</p>
                          <p className="text-sm leading-relaxed">{app.bio}</p>
                        </div>
                      </div>

                      {app.status === 'pending' && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 w-28"
                            onClick={() => handleApplicationAction(app.id, app.user_id, 'approved')}
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" /> موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-500/10 border border-red-500/20 w-28"
                            onClick={() => handleApplicationAction(app.id, app.user_id, 'rejected')}
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" /> رفض
                          </Button>
                        </div>
                      )}
                      {app.status === 'approved' && (
                        <div className="shrink-0">
                          <div className="flex items-center gap-1.5 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" /> مُوافَق عليه
                          </div>
                        </div>
                      )}
                      {app.status === 'rejected' && (
                        <div className="shrink-0">
                          <div className="flex items-center gap-1.5 text-red-400 text-sm">
                            <XCircle className="w-4 h-4" /> مرفوض
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
