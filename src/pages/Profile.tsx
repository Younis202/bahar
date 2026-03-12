import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  User, BookOpen, Award, Edit2, Save, Camera, Mail, Shield,
  Globe, Linkedin, Twitter, Briefcase, MapPin
} from 'lucide-react';
import { db } from '@/lib/supabaseAny';

export default function Profile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [form, setForm] = useState({
    full_name: '', bio: '', avatar_url: '',
    website: '', linkedin_url: '', twitter_handle: '',
    career_history: '', location: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (profile) setForm({
      full_name: profile.full_name,
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
      website: (profile as any).website || '',
      linkedin_url: (profile as any).linkedin_url || '',
      twitter_handle: (profile as any).twitter_handle || '',
      career_history: (profile as any).career_history || '',
      location: (profile as any).location || '',
    });
    loadStats();
  }, [user, profile]);

  const loadStats = async () => {
    const [{ data: enrollData }, { data: certData }] = await Promise.all([
      supabase.from('enrollments').select('*, courses(title, thumbnail_url, duration_hours)').eq('student_id', user!.id).order('enrolled_at', { ascending: false }).limit(5),
      supabase.from('certificates').select('*, courses(title)').eq('student_id', user!.id),
    ]);
    if (enrollData) setEnrollments(enrollData);
    if (certData) setCertificates(certData);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await db
      .from('profiles')
      .update({
        full_name: form.full_name,
        bio: form.bio,
        avatar_url: form.avatar_url || null,
        website: form.website || null,
        linkedin_url: form.linkedin_url || null,
        twitter_handle: form.twitter_handle || null,
        career_history: form.career_history || null,
        location: form.location || null,
      })
      .eq('id', user!.id);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ تم تحديث الملف الشخصي' });
      setEditing(false);
    }
    setSaving(false);
  };

  if (!profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const roleColor = profile.role === 'admin' ? 'text-red-400 bg-red-400/10' : profile.role === 'instructor' ? 'text-blue-400 bg-blue-400/10' : 'text-green-400 bg-green-400/10';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground overflow-hidden ring-2 ring-primary/20">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                {editing && (
                  <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                )}
              </div>

              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <Input
                      value={form.full_name}
                      onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Full Name"
                      className="bg-background font-display text-xl font-bold"
                    />
                    <Input
                      value={form.avatar_url}
                      onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))}
                      placeholder="Avatar URL (optional)"
                      className="bg-background text-sm"
                    />
                    <Textarea
                      value={form.bio}
                      onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="bg-background text-sm resize-none"
                    />
                    <Input
                      value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="Location (e.g. Dubai, UAE)"
                      className="bg-background text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        value={form.website}
                        onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                        placeholder="Website URL"
                        className="bg-background text-sm"
                      />
                      <Input
                        value={form.linkedin_url}
                        onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                        placeholder="LinkedIn URL"
                        className="bg-background text-sm"
                      />
                      <Input
                        value={form.twitter_handle}
                        onChange={e => setForm(p => ({ ...p, twitter_handle: e.target.value }))}
                        placeholder="Twitter handle"
                        className="bg-background text-sm"
                      />
                    </div>
                    <Textarea
                      value={form.career_history}
                      onChange={e => setForm(p => ({ ...p, career_history: e.target.value }))}
                      placeholder="Career history & experience..."
                      rows={3}
                      className="bg-background text-sm resize-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="font-display text-2xl font-bold">{profile.full_name}</h1>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${roleColor}`}>{profile.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="w-4 h-4" />{profile.email}
                    </div>
                    {(profile as any).location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4" />{(profile as any).location}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">{profile.bio || 'No bio added yet.'}</p>
                    {/* Social links */}
                    <div className="flex items-center gap-3">
                      {(profile as any).website && (
                        <a href={(profile as any).website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {(profile as any).linkedin_url && (
                        <a href={(profile as any).linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {(profile as any).twitter_handle && (
                        <a href={`https://twitter.com/${(profile as any).twitter_handle}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {(profile as any).career_history && (
                      <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Career History
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(profile as any).career_history}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-gradient-primary text-primary-foreground">
                      {saving ? <div className="w-3 h-3 rounded-full border border-primary-foreground border-t-transparent animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-primary">{enrollments.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1"><BookOpen className="w-3 h-3" /> Enrolled</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-gold">{certificates.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1"><Award className="w-3 h-3" /> Certificates</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-green-400">
                  {enrollments.length > 0 ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg Progress</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Enrolled Courses */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> My Courses
              </h2>
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses enrolled yet.</p>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-secondary/20 transition-colors">
                      <img
                        src={e.courses?.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=100&h=60&fit=crop'}
                        alt={e.courses?.title}
                        className="w-14 h-10 rounded-md object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{e.courses?.title}</p>
                        <div className="h-1 bg-secondary rounded-full mt-1.5">
                          <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${e.progress || 0}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.progress || 0}% complete</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certificates */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-gold" /> Certificates
              </h2>
              {certificates.length === 0 ? (
                <div className="text-center py-6">
                  <Award className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Complete a course to earn your first certificate!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gold/5 to-accent/5 border border-gold/20 rounded-lg">
                      <Award className="w-8 h-8 text-gold shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{c.courses?.title}</p>
                        <p className="font-mono text-xs text-accent mt-0.5">{c.certificate_number}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="shrink-0 h-7 text-xs" onClick={() => navigate(`/certificate/${c.course_id}`)}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
