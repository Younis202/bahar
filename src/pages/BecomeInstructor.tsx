import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap, Briefcase, Globe, Linkedin, CheckCircle,
  Clock, XCircle, Send, Star, Users, BookOpen, Award
} from 'lucide-react';

export default function BecomeInstructor() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({
    expertise: '',
    bio: '',
    experience_years: 1,
    linkedin_url: '',
    portfolio_url: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (profile?.role === 'instructor' || profile?.role === 'admin') {
      navigate('/dashboard/instructor');
      return;
    }
    checkExisting();
  }, [user, profile]);

  const checkExisting = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('instructor_applications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setExistingApp(data);
    setChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.expertise.trim() || !form.bio.trim()) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    if (form.bio.trim().length < 50) {
      toast({ title: 'يرجى كتابة نبذة تفصيلية (50 حرف على الأقل)', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('instructor_applications').insert({
      user_id: user.id,
      expertise: form.expertise.trim(),
      bio: form.bio.trim(),
      experience_years: form.experience_years,
      linkedin_url: form.linkedin_url.trim() || null,
      portfolio_url: form.portfolio_url.trim() || null,
    });

    if (error) {
      toast({ title: 'حدث خطأ أثناء إرسال الطلب', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🎉 تم إرسال طلبك بنجاح!', description: 'سيتم مراجعة طلبك من قبل الإدارة.' });
      checkExisting();
    }
    setLoading(false);
  };

  const statusConfig: Record<string, { icon: any; color: string; bg: string; title: string; desc: string }> = {
    pending: {
      icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20',
      title: 'طلبك قيد المراجعة', desc: 'سيتم مراجعة طلبك من قبل فريق الإدارة وسيتم إخطارك بالنتيجة.'
    },
    approved: {
      icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
      title: '🎉 تمت الموافقة على طلبك!', desc: 'يمكنك الآن الانتقال إلى لوحة تحكم المحاضر وبدء إنشاء كورساتك.'
    },
    rejected: {
      icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20',
      title: 'لم يتم قبول الطلب', desc: 'نأسف، لم يتم قبول طلبك هذه المرة. يمكنك المحاولة مرة أخرى لاحقاً.'
    },
  };

  const benefits = [
    { icon: Users, title: 'آلاف الطلاب', desc: 'انضم لمجتمع متنامي من المتعلمين' },
    { icon: BookOpen, title: 'أدوات احترافية', desc: 'Course Builder متكامل مع رفع فيديو' },
    { icon: Award, title: 'شهادات معتمدة', desc: 'كورساتك تصدر شهادات إتمام تلقائية' },
    { icon: Star, title: 'دخل مستمر', desc: 'اكسب 70% من كل عملية بيع' },
  ];

  if (checking) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3">انضم كمحاضر في BahriaAcad</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            شارك خبرتك مع آلاف الطلاب حول العالم وابنِ مصدر دخل مستدام من خلال كورساتك
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Existing Application Status */}
        {existingApp ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {(() => {
              const cfg = statusConfig[existingApp.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div className={`max-w-xl mx-auto border rounded-2xl p-8 text-center ${cfg.bg}`}>
                  <StatusIcon className={`w-16 h-16 mx-auto mb-4 ${cfg.color}`} />
                  <h2 className="font-display text-2xl font-bold mb-2">{cfg.title}</h2>
                  <p className="text-muted-foreground mb-4">{cfg.desc}</p>
                  <div className="bg-background/50 rounded-xl p-4 text-right space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التخصص:</span>
                      <span className="font-medium">{existingApp.expertise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">سنوات الخبرة:</span>
                      <span className="font-medium">{existingApp.experience_years} سنوات</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ التقديم:</span>
                      <span className="font-medium">{new Date(existingApp.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  {existingApp.status === 'approved' && (
                    <Button className="mt-6 bg-gradient-primary text-primary-foreground" onClick={() => navigate('/dashboard/instructor')}>
                      انتقل إلى لوحة المحاضر
                    </Button>
                  )}
                  {existingApp.status === 'rejected' && (
                    <Button variant="outline" className="mt-6" onClick={() => { setExistingApp(null); }}>
                      إعادة التقديم
                    </Button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        ) : (
          /* Application Form */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                نموذج التقديم
              </h2>

              <div className="space-y-2">
                <Label htmlFor="expertise">التخصص / مجال الخبرة *</Label>
                <Input
                  id="expertise"
                  placeholder="مثال: تطوير الويب، التصميم الجرافيكي، علوم البيانات..."
                  value={form.expertise}
                  onChange={e => setForm({ ...form, expertise: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">سنوات الخبرة *</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  value={form.experience_years}
                  onChange={e => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">نبذة عنك وعن خبرتك * (50 حرف على الأقل)</Label>
                <Textarea
                  id="bio"
                  rows={5}
                  placeholder="اكتب عن خلفيتك التعليمية والمهنية، وما الذي يميزك كمحاضر..."
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-muted-foreground text-left">{form.bio.length}/2000</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn (اختياري)
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={form.linkedin_url}
                    onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio" className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Portfolio / Website (اختياري)
                  </Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://yoursite.com"
                    value={form.portfolio_url}
                    onChange={e => setForm({ ...form, portfolio_url: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-12 text-base" disabled={loading}>
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> إرسال الطلب</>
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}

