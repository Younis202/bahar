import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Clock, Star, CheckCircle, CreditCard, Lock, Award } from 'lucide-react';

export default function Checkout() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'knet'>('card');
  const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvv: '', name: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadCourse();
  }, [courseId, user]);

  const loadCourse = async () => {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*, profiles(full_name, avatar_url)').eq('id', courseId!).single();
    if (data) setCourse(data);

    // Check if already enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId!)
      .eq('student_id', user!.id)
      .maybeSingle();
    if (enrollment) setIsEnrolled(true);
    setLoading(false);
  };

  const handleFreeEnroll = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase.from('enrollments').insert({
        course_id: courseId!,
        student_id: user!.id,
        progress: 0,
      });
      if (error) throw error;
      // Create notification
      await supabase.from('notifications').insert({
        user_id: user!.id,
        title: 'تم التسجيل في الكورس!',
        message: `تم تسجيلك بنجاح في كورس "${course?.title}"`,
        type: 'success',
        link: `/courses/${courseId}`,
      });
      toast({ title: '🎉 تم التسجيل بنجاح!', description: 'يمكنك الآن بدء التعلم' });
      navigate(`/courses/${courseId}/learn/start`);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaidEnroll = async () => {
    if (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvv || !cardInfo.name) {
      toast({ title: 'بيانات ناقصة', description: 'يرجى ملء جميع بيانات البطاقة', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    // Simulate payment processing (payment gateway will be integrated)
    await new Promise(r => setTimeout(r, 2000));
    try {
      const { error } = await supabase.from('enrollments').insert({
        course_id: courseId!,
        student_id: user!.id,
        progress: 0,
      });
      if (error) throw error;
      await supabase.from('notifications').insert({
        user_id: user!.id,
        title: '💳 تم الدفع بنجاح!',
        message: `تم شراء كورس "${course?.title}" بنجاح. يمكنك البدء الآن!`,
        type: 'success',
        link: `/courses/${courseId}`,
      });
      toast({ title: '🎉 تم الدفع والتسجيل بنجاح!', description: 'يمكنك الآن بدء التعلم' });
      navigate(`/courses/${courseId}/learn/start`);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!course) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Course not found</p></div>;

  if (isEnrolled) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">أنت مسجل بالفعل!</h2>
        <p className="text-muted-foreground mb-6">لديك وصول كامل لهذا الكورس</p>
        <Button onClick={() => navigate(`/courses/${courseId}/learn/start`)} className="bg-gradient-primary text-primary-foreground">
          ابدأ التعلم الآن
        </Button>
      </div>
    </div>
  );

  const isFree = !course.price || course.price === 0;
  const discount = course.original_price ? Math.round((1 - course.price / course.original_price) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold mb-8"
        >
          {isFree ? 'تسجيل مجاني' : 'إتمام الدفع'}
        </motion.h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Payment Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            {!isFree && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> طريقة الدفع
                </h2>

                {/* Payment Method Selection */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { id: 'card', label: '💳 بطاقة', desc: 'Visa / Mastercard' },
                    { id: 'apple', label: '🍎 Apple Pay', desc: 'Apple Pay' },
                    { id: 'knet', label: '🏦 KNET', desc: 'KNET / Benefit' },
                  ].map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3 rounded-lg border text-center text-sm transition-all ${
                        paymentMethod === pm.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <div className="text-base mb-0.5">{pm.label}</div>
                      <div className="text-xs opacity-70">{pm.desc}</div>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">اسم حامل البطاقة</label>
                      <Input
                        value={cardInfo.name}
                        onChange={e => setCardInfo(p => ({ ...p, name: e.target.value }))}
                        placeholder="AHMED AL-RASHIDI"
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">رقم البطاقة</label>
                      <Input
                        value={cardInfo.number}
                        onChange={e => setCardInfo(p => ({ ...p, number: e.target.value.replace(/\D/g, '').slice(0, 16) }))}
                        placeholder="1234 5678 9012 3456"
                        className="bg-background font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">تاريخ الانتهاء</label>
                        <Input
                          value={cardInfo.expiry}
                          onChange={e => setCardInfo(p => ({ ...p, expiry: e.target.value }))}
                          placeholder="MM/YY"
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">CVV</label>
                        <Input
                          value={cardInfo.cvv}
                          onChange={e => setCardInfo(p => ({ ...p, cvv: e.target.value.slice(0, 4) }))}
                          placeholder="123"
                          type="password"
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'apple' || paymentMethod === 'knet') && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">ستتم إعادة توجيهك إلى بوابة الدفع بعد الضغط على "ادفع الآن"</p>
                    <p className="text-xs mt-1 text-accent">🔒 مدعوم بتشفير SSL 256-bit</p>
                  </div>
                )}
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-green-400" /> SSL Secured</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> 30-Day Refund</span>
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-gold" /> Certificate Included</span>
            </div>

            <Button
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-12 text-base font-semibold"
              onClick={isFree ? handleFreeEnroll : handlePaidEnroll}
              disabled={processing}
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  {isFree ? 'جاري التسجيل...' : 'جاري معالجة الدفع...'}
                </div>
              ) : (
                isFree ? '🎓 سجل مجاناً الآن' : `💳 ادفع $${course.price} الآن`
              )}
            </Button>
          </motion.div>

          {/* Right: Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-24">
              <img
                src={course.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=300&fit=crop'}
                alt={course.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <h3 className="font-display font-bold text-base mb-2 line-clamp-2">{course.title}</h3>

                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-2xl font-bold text-primary">
                    {isFree ? 'Free' : `$${course.price}`}
                  </span>
                  {course.original_price && (
                    <span className="text-muted-foreground line-through">${course.original_price}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded">{discount}% OFF</span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {[
                    { icon: <Clock className="w-4 h-4" />, text: `${course.duration_hours || 0}h video content` },
                    { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: 'Full lifetime access' },
                    { icon: <Award className="w-4 h-4 text-gold" />, text: 'Certificate of completion' },
                    { icon: <Shield className="w-4 h-4 text-primary" />, text: '30-day money-back guarantee' },
                    { icon: <Star className="w-4 h-4 text-gold" />, text: `Rating: ${course.rating || '—'} ⭐` },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-muted-foreground">
                      {icon}<span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
