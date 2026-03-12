import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/supabaseAny';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, BookOpen, GraduationCap, TrendingUp, Search, Shield, CheckCircle, XCircle,
  Trash2, AlertCircle, Clock, Check, X, Calendar, MessageSquare, Tag, Award,
  LayoutGrid, Ticket, DollarSign, Settings, Plus, Eye, Edit, ChevronDown, ChevronUp,
  FileText, Globe, Layers, BarChart3, Wallet, Bell, RefreshCw
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

type Tab = 'overview' | 'users' | 'courses' | 'applications' | 'categories' | 'events' | 'blog' | 'coupons' | 'support' | 'badges' | 'finances';

const tabs: { value: Tab; label: string; icon: any }[] = [
  { value: 'overview', label: 'Overview', icon: BarChart3 },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'courses', label: 'Courses', icon: BookOpen },
  { value: 'applications', label: 'Applications', icon: GraduationCap },
  { value: 'categories', label: 'Categories', icon: LayoutGrid },
  { value: 'events', label: 'Events', icon: Calendar },
  { value: 'blog', label: 'Blog', icon: FileText },
  { value: 'coupons', label: 'Coupons', icon: Tag },
  { value: 'support', label: 'Support', icon: Ticket },
  { value: 'badges', label: 'Badges', icon: Award },
  { value: 'finances', label: 'Finances', icon: DollarSign },
];

export default function AdminPanel() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, revenue: 0 });
  const [appFilter, setAppFilter] = useState<string>('all');

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [badgeDialog, setBadgeDialog] = useState(false);
  const [couponDialog, setCouponDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Forms
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', icon: '' });
  const [badgeForm, setBadgeForm] = useState({ name: '', description: '', icon: '🏆', criteria_type: 'manual', criteria_value: 0 });
  const [couponForm, setCouponForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: 10, usage_limit: 100, expires_at: '' });

  useEffect(() => { loadTabData(); }, [tab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      switch (tab) {
        case 'overview': {
          const [{ data: u }, { data: c }, { count: enrollCount }, { data: txn }] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('courses').select('*, profiles(full_name)').order('created_at', { ascending: false }),
            supabase.from('enrollments').select('*', { count: 'exact', head: true }),
            db.from('wallet_transactions').select('*').eq('type', 'payment').order('created_at', { ascending: false }).limit(100),
          ]);
          if (u) setUsers(u);
          if (c) setCourses(c);
          const revenue = (txn || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
          setStats({ users: u?.length || 0, courses: c?.length || 0, enrollments: enrollCount || 0, revenue });
          break;
        }
        case 'users': {
          const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          if (data) setUsers(data);
          break;
        }
        case 'courses': {
          const { data } = await supabase.from('courses').select('*, profiles(full_name), categories(name)').order('created_at', { ascending: false });
          if (data) setCourses(data);
          break;
        }
        case 'applications': {
          const { data } = await supabase.from('instructor_applications').select('*, profiles(full_name, email, avatar_url)').order('created_at', { ascending: false });
          if (data) setApplications(data);
          break;
        }
        case 'categories': {
          const { data } = await supabase.from('categories').select('*').order('name');
          if (data) setCategories(data);
          break;
        }
        case 'events': {
          const { data } = await db.from('events').select('*, profiles(full_name)').order('date', { ascending: false });
          if (data) setEvents(data);
          break;
        }
        case 'blog': {
          const { data } = await db.from('blog_posts').select('*, profiles(full_name)').order('created_at', { ascending: false });
          if (data) setBlogPosts(data);
          break;
        }
        case 'coupons': {
          const { data } = await db.from('coupons').select('*').order('created_at', { ascending: false });
          if (data) setCoupons(data);
          break;
        }
        case 'support': {
          const { data } = await db.from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
          if (data) setTickets(data);
          break;
        }
        case 'badges': {
          const { data } = await db.from('badges').select('*').order('created_at', { ascending: false });
          if (data) setBadges(data);
          break;
        }
        case 'finances': {
          const [{ data: txn }, { data: enr }] = await Promise.all([
            db.from('wallet_transactions').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(200),
            supabase.from('enrollments').select('*, courses(title, price), profiles(full_name)').order('enrolled_at', { ascending: false }).limit(200),
          ]);
          if (txn) setTransactions(txn);
          if (enr) setEnrollments(enr);
          break;
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ─── Actions ───
  const handleApplicationAction = async (appId: string, userId: string, action: 'approved' | 'rejected') => {
    await supabase.from('instructor_applications').update({
      status: action, reviewed_by: profile!.id, reviewed_at: new Date().toISOString(),
    }).eq('id', appId);
    if (action === 'approved') {
      await supabase.from('profiles').update({ role: 'instructor' }).eq('id', userId);
      await supabase.from('notifications').insert({
        user_id: userId, title: '🎉 Application Approved!',
        message: 'Your instructor application has been approved. You can now create courses.',
        type: 'success', link: '/dashboard/instructor',
      });
    } else {
      await supabase.from('notifications').insert({
        user_id: userId, title: 'Application Update',
        message: 'Unfortunately your instructor application was not approved at this time.',
        type: 'warning',
      });
    }
    toast({ title: action === 'approved' ? '✅ Approved' : '❌ Rejected' });
    loadTabData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({ title: 'User deleted' });
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast({ title: `Role updated to ${newRole}` });
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    await supabase.from('courses').delete().eq('id', id);
    setCourses(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Course deleted' });
  };

  const handleToggleCourseStatus = async (id: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published';
    await supabase.from('courses').update({ status: newStatus }).eq('id', id);
    setCourses(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    toast({ title: `Course ${newStatus}` });
  };

  // Categories
  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) return;
    if (editingItem) {
      await supabase.from('categories').update(categoryForm).eq('id', editingItem.id);
    } else {
      await supabase.from('categories').insert(categoryForm);
    }
    setCategoryDialog(false);
    setCategoryForm({ name: '', slug: '', description: '', icon: '' });
    setEditingItem(null);
    loadTabData();
    toast({ title: editingItem ? 'Category updated' : 'Category created' });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Category deleted' });
  };

  // Events
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await db.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast({ title: 'Event deleted' });
  };

  // Blog
  const handleToggleBlogStatus = async (id: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published';
    await db.from('blog_posts').update({ status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null }).eq('id', id);
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    toast({ title: `Post ${newStatus}` });
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await db.from('blog_posts').delete().eq('id', id);
    setBlogPosts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Post deleted' });
  };

  // Coupons
  const handleSaveCoupon = async () => {
    if (!couponForm.code) return;
    const payload = {
      ...couponForm,
      discount_value: Number(couponForm.discount_value),
      usage_limit: Number(couponForm.usage_limit) || null,
      expires_at: couponForm.expires_at || null,
      created_by: profile!.id,
    };
    if (editingItem) {
      await db.from('coupons').update(payload).eq('id', editingItem.id);
    } else {
      await db.from('coupons').insert(payload);
    }
    setCouponDialog(false);
    setCouponForm({ code: '', description: '', discount_type: 'percentage', discount_value: 10, usage_limit: 100, expires_at: '' });
    setEditingItem(null);
    loadTabData();
    toast({ title: editingItem ? 'Coupon updated' : 'Coupon created' });
  };

  const handleToggleCoupon = async (id: string, active: boolean) => {
    await db.from('coupons').update({ active: !active }).eq('id', id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await db.from('coupons').delete().eq('id', id);
    setCoupons(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Coupon deleted' });
  };

  // Support
  const handleUpdateTicketStatus = async (id: string, status: string) => {
    await db.from('support_tickets').update({ status }).eq('id', id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    toast({ title: `Ticket ${status}` });
  };

  // Badges
  const handleSaveBadge = async () => {
    if (!badgeForm.name) return;
    if (editingItem) {
      await db.from('badges').update(badgeForm).eq('id', editingItem.id);
    } else {
      await db.from('badges').insert(badgeForm);
    }
    setBadgeDialog(false);
    setBadgeForm({ name: '', description: '', icon: '🏆', criteria_type: 'manual', criteria_value: 0 });
    setEditingItem(null);
    loadTabData();
    toast({ title: editingItem ? 'Badge updated' : 'Badge created' });
  };

  const handleDeleteBadge = async (id: string) => {
    if (!confirm('Delete this badge?')) return;
    await db.from('badges').delete().eq('id', id);
    setBadges(prev => prev.filter(b => b.id !== id));
    toast({ title: 'Badge deleted' });
  };

  // ─── Filters ───
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role: string) => {
    if (role === 'admin') return 'bg-destructive/10 text-destructive';
    if (role === 'instructor') return 'bg-primary/10 text-primary';
    return 'bg-accent/30 text-accent-foreground';
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      published: 'bg-accent/30 text-accent-foreground',
      draft: 'bg-muted text-muted-foreground',
      pending: 'bg-primary/10 text-primary',
      approved: 'bg-accent/30 text-accent-foreground',
      rejected: 'bg-destructive/10 text-destructive',
      open: 'bg-primary/10 text-primary',
      closed: 'bg-muted text-muted-foreground',
      resolved: 'bg-accent/30 text-accent-foreground',
      upcoming: 'bg-primary/10 text-primary',
      completed: 'bg-accent/30 text-accent-foreground',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const openTickets = tickets.filter(t => t.status === 'open').length;

  const platformStats = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-primary' },
    { label: 'Active Courses', value: stats.courses, icon: BookOpen, color: 'text-accent-foreground' },
    { label: 'Enrollments', value: stats.enrollments, icon: GraduationCap, color: 'text-primary' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-accent-foreground' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className={`hidden md:flex flex-col border-r border-border bg-card/50 sticky top-0 h-screen transition-all ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive shrink-0" />
            {!sidebarCollapsed && <span className="font-display font-bold text-sm">Admin Panel</span>}
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {tabs.map(t => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{t.label}</span>
                    {t.value === 'applications' && pendingApps > 0 && (
                      <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">{pendingApps}</span>
                    )}
                    {t.value === 'support' && openTickets > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{openTickets}</span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-3 border-t border-border text-muted-foreground hover:text-foreground">
            {sidebarCollapsed ? <ChevronDown className="w-4 h-4 mx-auto rotate-[-90deg]" /> : <ChevronUp className="w-4 h-4 mx-auto rotate-[-90deg]" />}
          </button>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border overflow-x-auto">
          <div className="flex">
            {tabs.slice(0, 6).map(t => (
              <button key={t.value} onClick={() => setTab(t.value)} className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] ${tab === t.value ? 'text-primary' : 'text-muted-foreground'}`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen pb-20 md:pb-8">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold capitalize">{tab === 'overview' ? 'Dashboard Overview' : tab}</h1>
                <p className="text-sm text-muted-foreground">Manage your platform</p>
              </div>
              <Button size="sm" variant="outline" onClick={loadTabData} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

                {/* ═══════════ OVERVIEW ═══════════ */}
                {tab === 'overview' && (
                  <div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {platformStats.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-card border border-border rounded-xl p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                          </div>
                          <p className="font-display text-2xl font-bold">{loading ? '...' : value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-card border border-border rounded-xl p-5">
                        <h3 className="font-display font-semibold mb-4">Users by Role</h3>
                        <div className="space-y-3">
                          {[
                            { role: 'Students', count: users.filter(u => u.role === 'student').length, cls: 'bg-primary' },
                            { role: 'Instructors', count: users.filter(u => u.role === 'instructor').length, cls: 'bg-accent' },
                            { role: 'Admins', count: users.filter(u => u.role === 'admin').length, cls: 'bg-destructive' },
                          ].map(({ role, count, cls }) => (
                            <div key={role}>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>{role}</span><span>{count}</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full">
                                <div className={`h-full ${cls} rounded-full transition-all`} style={{ width: users.length ? `${(count / users.length) * 100}%` : '0%' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-5">
                        <h3 className="font-display font-semibold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Manage Users', icon: Users, tab: 'users' as Tab },
                            { label: 'Applications', icon: GraduationCap, tab: 'applications' as Tab },
                            { label: 'Support Tickets', icon: Ticket, tab: 'support' as Tab },
                            { label: 'Manage Coupons', icon: Tag, tab: 'coupons' as Tab },
                          ].map(a => (
                            <button key={a.label} onClick={() => setTab(a.tab)} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium">
                              <a.icon className="w-4 h-4 text-primary" /> {a.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Recent users */}
                    <div className="bg-card border border-border rounded-xl p-5">
                      <h3 className="font-display font-semibold mb-4">Recent Users</h3>
                      <div className="space-y-2">
                        {users.slice(0, 5).map(u => (
                          <div key={u.id} className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                              {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.full_name || 'No name'}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md capitalize ${roleColor(u.role)}`}>{u.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════ USERS ═══════════ */}
                {tab === 'users' && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-10" />
                      </div>
                      <span className="text-sm text-muted-foreground">{filteredUsers.length} users</span>
                    </div>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-secondary/30">
                              {['Name', 'Email', 'Role', 'Points', 'Wallet', 'Joined', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {filteredUsers.map(u => (
                              <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                      {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-sm font-medium">{u.full_name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                                <td className="px-4 py-3">
                                  <Select value={u.role} onValueChange={(v) => handleChangeRole(u.id, v)}>
                                    <SelectTrigger className="h-7 w-28 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="student">Student</SelectItem>
                                      <SelectItem value="instructor">Instructor</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-4 py-3 text-sm">{u.total_points || 0}</td>
                                <td className="px-4 py-3 text-sm">${Number(u.wallet_balance || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                  {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3">
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════ COURSES ═══════════ */}
                {tab === 'courses' && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="pl-10" />
                      </div>
                      <span className="text-sm text-muted-foreground">{courses.length} courses</span>
                    </div>
                    <div className="space-y-3">
                      {courses.filter(c => c.title?.toLowerCase().includes(search.toLowerCase())).map(c => (
                        <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                          <img src={c.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=100&h=60&fit=crop'} alt={c.title} className="w-20 h-14 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold line-clamp-1">{c.title}</h3>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                              <span>by {(c.profiles as any)?.full_name || '—'}</span>
                              <span>{(c.categories as any)?.name || 'No category'}</span>
                              <span>{c.students_count || 0} students</span>
                              <span>${c.price || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleToggleCourseStatus(c.id, c.status)} className={`text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer ${statusColor(c.status || 'draft')}`}>
                              {c.status || 'draft'}
                            </button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteCourse(c.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {courses.length === 0 && !loading && (
                        <div className="text-center py-16 text-muted-foreground">No courses yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══════════ APPLICATIONS ═══════════ */}
                {tab === 'applications' && (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {['all', 'pending', 'approved', 'rejected'].map(f => (
                        <button key={f} onClick={() => setAppFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${appFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                          {f} ({f === 'all' ? applications.length : applications.filter(a => a.status === f).length})
                        </button>
                      ))}
                    </div>
                    {applications.filter(a => appFilter === 'all' || a.status === appFilter).length === 0 ? (
                      <div className="text-center py-16 bg-card border border-border rounded-xl">
                        <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground">No applications found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.filter(a => appFilter === 'all' || a.status === appFilter).map(app => (
                          <div key={app.id} className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-base font-bold text-primary shrink-0">
                                {(app.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{(app.profiles as any)?.full_name}</h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize ${statusColor(app.status)}`}>{app.status}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">{(app.profiles as any)?.email}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  <div className="bg-secondary/40 rounded-lg px-3 py-2">
                                    <p className="text-xs text-muted-foreground">Expertise</p>
                                    <p className="text-sm font-medium truncate">{app.expertise}</p>
                                  </div>
                                  <div className="bg-secondary/40 rounded-lg px-3 py-2">
                                    <p className="text-xs text-muted-foreground">Experience</p>
                                    <p className="text-sm font-medium">{app.experience_years} years</p>
                                  </div>
                                  {app.linkedin_url && (
                                    <div className="bg-secondary/40 rounded-lg px-3 py-2">
                                      <p className="text-xs text-muted-foreground">LinkedIn</p>
                                      <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">View</a>
                                    </div>
                                  )}
                                  {app.portfolio_url && (
                                    <div className="bg-secondary/40 rounded-lg px-3 py-2">
                                      <p className="text-xs text-muted-foreground">Portfolio</p>
                                      <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">View</a>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-secondary/20 rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Bio:</p>
                                  <p className="text-sm leading-relaxed">{app.bio}</p>
                                </div>
                              </div>
                              {app.status === 'pending' && (
                                <div className="flex flex-col gap-2 shrink-0">
                                  <Button size="sm" className="bg-accent/30 text-accent-foreground hover:bg-accent/50 w-28" onClick={() => handleApplicationAction(app.id, app.user_id, 'approved')}>
                                    <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 w-28" onClick={() => handleApplicationAction(app.id, app.user_id, 'rejected')}>
                                    <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                                  </Button>
                                </div>
                              )}
                              {app.status !== 'pending' && (
                                <div className="shrink-0 flex items-center gap-1.5 text-sm">
                                  {app.status === 'approved' ? <CheckCircle className="w-4 h-4 text-accent-foreground" /> : <XCircle className="w-4 h-4 text-destructive" />}
                                  <span className={app.status === 'approved' ? 'text-accent-foreground' : 'text-destructive'}>{app.status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════ CATEGORIES ═══════════ */}
                {tab === 'categories' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">{categories.length} categories</span>
                      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => { setEditingItem(null); setCategoryForm({ name: '', slug: '', description: '', icon: '' }); }}>
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Category
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{editingItem ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div><Label>Name</Label><Input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
                            <div><Label>Slug</Label><Input value={categoryForm.slug} onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })} /></div>
                            <div><Label>Icon (emoji)</Label><Input value={categoryForm.icon || ''} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} /></div>
                            <div><Label>Description</Label><Textarea value={categoryForm.description || ''} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleSaveCategory}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map(cat => (
                        <div key={cat.id} className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{cat.icon || '📁'}</span>
                              <h3 className="font-semibold">{cat.name}</h3>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                                setEditingItem(cat);
                                setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '' });
                                setCategoryDialog(true);
                              }}><Edit className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{cat.description || 'No description'}</p>
                          <p className="text-[10px] text-muted-foreground mt-2">/{cat.slug}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══════════ EVENTS ═══════════ */}
                {tab === 'events' && (
                  <div>
                    <span className="text-sm text-muted-foreground mb-4 block">{events.length} events</span>
                    <div className="space-y-3">
                      {events.map(ev => (
                        <div key={ev.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                            <span className="text-lg font-bold text-primary">{new Date(ev.date).getDate()}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{new Date(ev.date).toLocaleString('en', { month: 'short' })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold line-clamp-1">{ev.title}</h3>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                              <span>{ev.type}</span>
                              <span>by {(ev.profiles as any)?.full_name || '—'}</span>
                              {ev.location && <span>📍 {ev.location}</span>}
                              {ev.price > 0 && <span>${ev.price}</span>}
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${statusColor(ev.status)}`}>{ev.status}</span>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => handleDeleteEvent(ev.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      {events.length === 0 && !loading && <div className="text-center py-16 text-muted-foreground">No events</div>}
                    </div>
                  </div>
                )}

                {/* ═══════════ BLOG ═══════════ */}
                {tab === 'blog' && (
                  <div>
                    <span className="text-sm text-muted-foreground mb-4 block">{blogPosts.length} posts</span>
                    <div className="space-y-3">
                      {blogPosts.map(post => (
                        <div key={post.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                          {post.image_url && <img src={post.image_url} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold line-clamp-1">{post.title}</h3>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                              <span>by {(post.profiles as any)?.full_name || '—'}</span>
                              <span>{post.category}</span>
                              <span>👁 {post.views_count}</span>
                              <span>❤ {post.likes_count}</span>
                            </div>
                          </div>
                          <button onClick={() => handleToggleBlogStatus(post.id, post.status)} className={`text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer ${statusColor(post.status)}`}>
                            {post.status}
                          </button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => handleDeleteBlogPost(post.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      {blogPosts.length === 0 && !loading && <div className="text-center py-16 text-muted-foreground">No blog posts</div>}
                    </div>
                  </div>
                )}

                {/* ═══════════ COUPONS ═══════════ */}
                {tab === 'coupons' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">{coupons.length} coupons</span>
                      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => { setEditingItem(null); setCouponForm({ code: '', description: '', discount_type: 'percentage', discount_value: 10, usage_limit: 100, expires_at: '' }); }}>
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Coupon
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{editingItem ? 'Edit Coupon' : 'New Coupon'}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div><Label>Code</Label><Input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="SUMMER25" /></div>
                            <div><Label>Description</Label><Input value={couponForm.description} onChange={e => setCouponForm({ ...couponForm, description: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Type</Label>
                                <Select value={couponForm.discount_type} onValueChange={v => setCouponForm({ ...couponForm, discount_type: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div><Label>Value</Label><Input type="number" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div><Label>Usage Limit</Label><Input type="number" value={couponForm.usage_limit} onChange={e => setCouponForm({ ...couponForm, usage_limit: Number(e.target.value) })} /></div>
                              <div><Label>Expires At</Label><Input type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })} /></div>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleSaveCoupon}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-3">
                      {coupons.map(c => (
                        <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Tag className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold font-mono">{c.code}</h3>
                              <span className="text-xs text-muted-foreground">— {c.description || 'No description'}</span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                              <span>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`} off</span>
                              <span>Used: {c.used_count}/{c.usage_limit || '∞'}</span>
                              {c.expires_at && <span>Expires: {new Date(c.expires_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Switch checked={c.active} onCheckedChange={() => handleToggleCoupon(c.id, c.active)} />
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                              setEditingItem(c);
                              setCouponForm({ code: c.code, description: c.description || '', discount_type: c.discount_type, discount_value: c.discount_value, usage_limit: c.usage_limit || 100, expires_at: c.expires_at || '' });
                              setCouponDialog(true);
                            }}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteCoupon(c.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {coupons.length === 0 && !loading && <div className="text-center py-16 text-muted-foreground">No coupons created</div>}
                    </div>
                  </div>
                )}

                {/* ═══════════ SUPPORT ═══════════ */}
                {tab === 'support' && (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
                        <button key={f} onClick={() => setSearch(f === 'all' ? '' : f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${(search === f || (f === 'all' && !search)) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
                          {f.replace('_', ' ')} ({f === 'all' ? tickets.length : tickets.filter(t => t.status === f).length})
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {tickets.filter(t => !search || t.status === search).map(ticket => (
                        <div key={ticket.id} className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <Ticket className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold">{ticket.subject}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${ticket.priority === 'high' ? 'bg-destructive/10 text-destructive' : ticket.priority === 'medium' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{ticket.priority}</span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span>by {(ticket.profiles as any)?.full_name || '—'}</span>
                                <span>{(ticket.profiles as any)?.email}</span>
                                <span>{ticket.department}</span>
                                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Select value={ticket.status} onValueChange={v => handleUpdateTicketStatus(ticket.id, v)}>
                              <SelectTrigger className="h-7 w-32 text-xs shrink-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                      {tickets.length === 0 && !loading && <div className="text-center py-16 text-muted-foreground">No support tickets</div>}
                    </div>
                  </div>
                )}

                {/* ═══════════ BADGES ═══════════ */}
                {tab === 'badges' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">{badges.length} badges</span>
                      <Dialog open={badgeDialog} onOpenChange={setBadgeDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => { setEditingItem(null); setBadgeForm({ name: '', description: '', icon: '🏆', criteria_type: 'manual', criteria_value: 0 }); }}>
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Badge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{editingItem ? 'Edit Badge' : 'New Badge'}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div><Label>Name</Label><Input value={badgeForm.name} onChange={e => setBadgeForm({ ...badgeForm, name: e.target.value })} /></div>
                            <div><Label>Description</Label><Textarea value={badgeForm.description || ''} onChange={e => setBadgeForm({ ...badgeForm, description: e.target.value })} /></div>
                            <div><Label>Icon (emoji)</Label><Input value={badgeForm.icon || ''} onChange={e => setBadgeForm({ ...badgeForm, icon: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Criteria Type</Label>
                                <Select value={badgeForm.criteria_type} onValueChange={v => setBadgeForm({ ...badgeForm, criteria_type: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="courses_completed">Courses Completed</SelectItem>
                                    <SelectItem value="points_earned">Points Earned</SelectItem>
                                    <SelectItem value="assignments_submitted">Assignments</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div><Label>Value</Label><Input type="number" value={badgeForm.criteria_value} onChange={e => setBadgeForm({ ...badgeForm, criteria_value: Number(e.target.value) })} /></div>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleSaveBadge}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badges.map(badge => (
                        <div key={badge.id} className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">{badge.icon || '🏆'}</span>
                              <div>
                                <h3 className="font-semibold text-sm">{badge.name}</h3>
                                <p className="text-[10px] text-muted-foreground capitalize">{badge.criteria_type} {badge.criteria_value > 0 ? `≥ ${badge.criteria_value}` : ''}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                                setEditingItem(badge);
                                setBadgeForm({ name: badge.name, description: badge.description || '', icon: badge.icon || '🏆', criteria_type: badge.criteria_type, criteria_value: badge.criteria_value || 0 });
                                setBadgeDialog(true);
                              }}><Edit className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteBadge(badge.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{badge.description || 'No description'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══════════ FINANCES ═══════════ */}
                {tab === 'finances' && (
                  <div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: 'Total Transactions', value: transactions.length, icon: Wallet },
                        { label: 'Total Enrollments', value: enrollments.length, icon: GraduationCap },
                        { label: 'Total Revenue', value: `$${transactions.filter(t => t.type === 'payment').reduce((s: number, t: any) => s + Number(t.amount), 0).toFixed(2)}`, icon: DollarSign },
                        { label: 'Avg. Course Price', value: `$${enrollments.length > 0 ? (enrollments.reduce((s: number, e: any) => s + Number((e.courses as any)?.price || 0), 0) / enrollments.length).toFixed(0) : 0}`, icon: TrendingUp },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-card border border-border rounded-xl p-5">
                          <Icon className="w-5 h-5 text-primary mb-2" />
                          <p className="font-display text-xl font-bold">{value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                    <h3 className="font-display font-semibold mb-3">Recent Transactions</h3>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-secondary/30">
                              {['User', 'Type', 'Amount', 'Description', 'Status', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {transactions.slice(0, 50).map(t => (
                              <tr key={t.id} className="hover:bg-secondary/20">
                                <td className="px-4 py-3 text-sm">{(t.profiles as any)?.full_name || '—'}</td>
                                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary capitalize">{t.type}</span></td>
                                <td className="px-4 py-3 text-sm font-medium">${Number(t.amount).toFixed(2)}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[200px]">{t.description}</td>
                                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-md ${statusColor(t.status)}`}>{t.status}</span></td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {transactions.length === 0 && !loading && <div className="text-center py-8 text-muted-foreground">No transactions yet</div>}
                    </div>

                    <h3 className="font-display font-semibold mb-3 mt-8">Recent Enrollments</h3>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-secondary/30">
                              {['Student', 'Course', 'Price', 'Progress', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {enrollments.slice(0, 50).map(e => (
                              <tr key={e.id} className="hover:bg-secondary/20">
                                <td className="px-4 py-3 text-sm">{(e.profiles as any)?.full_name || '—'}</td>
                                <td className="px-4 py-3 text-sm font-medium truncate max-w-[200px]">{(e.courses as any)?.title || '—'}</td>
                                <td className="px-4 py-3 text-sm">${Number((e.courses as any)?.price || 0).toFixed(2)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 bg-secondary rounded-full">
                                      <div className="h-full bg-primary rounded-full" style={{ width: `${e.progress || 0}%` }} />
                                    </div>
                                    <span className="text-xs">{e.progress || 0}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {enrollments.length === 0 && !loading && <div className="text-center py-8 text-muted-foreground">No enrollments yet</div>}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
