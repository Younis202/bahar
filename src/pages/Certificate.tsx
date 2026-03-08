import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, ArrowLeft, Anchor, CheckCircle } from 'lucide-react';

export default function Certificate() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [cert, setCert] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [courseId, user]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: certData }, { data: courseData }, { data: enrollment }] = await Promise.all([
      supabase.from('certificates').select('*').eq('course_id', courseId!).eq('student_id', user!.id).maybeSingle(),
      supabase.from('courses').select('*, profiles(full_name)').eq('id', courseId!).single(),
      supabase.from('enrollments').select('progress').eq('course_id', courseId!).eq('student_id', user!.id).maybeSingle(),
    ]);
    setCourse(courseData);

    if (certData) {
      setCert(certData);
    } else if (enrollment?.progress === 100) {
      // Auto-issue if course is 100% complete
      await issueCertificate();
    }
    setLoading(false);
  };

  const issueCertificate = async () => {
    setIssuing(true);
    try {
      const { data, error } = await supabase.from('certificates').insert({
        student_id: user!.id,
        course_id: courseId!,
      }).select().single();
      if (!error && data) setCert(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIssuing(false);
    }
  };

  if (loading || issuing) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">{issuing ? 'Generating your certificate...' : 'Loading...'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {cert ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            {/* Certificate Card */}
            <div
              id="certificate"
              className="relative rounded-2xl overflow-hidden border-4 border-gold/40 shadow-[0_0_80px_hsl(43_100%_55%/0.2)] bg-gradient-to-br from-navy-deep via-navy-mid to-background p-10 text-center"
            >
              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-gold/50 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-gold/50 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-gold/50 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-gold/50 rounded-br-lg" />

              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Anchor className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display text-2xl font-bold">
                  <span className="text-foreground">Bahria</span>
                  <span className="gradient-gold-text">Acad</span>
                </span>
              </div>

              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Certificate of Completion</p>
              <p className="text-muted-foreground text-sm mb-6">This is to certify that</p>

              <h2 className="font-display text-4xl font-bold gradient-gold-text mb-2">
                {profile?.full_name}
              </h2>
              <p className="text-muted-foreground mb-6">has successfully completed</p>

              <div className="bg-primary/10 border border-primary/20 rounded-xl px-8 py-4 mb-8 inline-block">
                <h3 className="font-display text-xl font-bold text-foreground">{course?.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{course?.level && course.level.charAt(0).toUpperCase() + course.level.slice(1)} Level • {course?.language}</p>
              </div>

              <div className="flex items-center justify-center gap-3 mb-8">
                <Award className="w-6 h-6 text-gold" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Certificate Number</p>
                  <p className="font-mono text-sm font-bold text-accent">{cert.certificate_number}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>

              <p className="text-xs text-muted-foreground">
                Issued on {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              {/* Signature line */}
              <div className="mt-8 flex justify-center gap-16">
                <div className="text-center">
                  <div className="w-24 border-t border-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{(course?.profiles as any)?.full_name || 'Instructor'}</p>
                  <p className="text-xs text-muted-foreground/60">Course Instructor</p>
                </div>
                <div className="text-center">
                  <div className="w-24 border-t border-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">BahriaAcad</p>
                  <p className="text-xs text-muted-foreground/60">Platform Director</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.certificate_number}`);
                  alert('Verification link copied!');
                }}
              >
                <Share2 className="w-4 h-4 mr-2" /> Share Certificate
              </Button>
              <Button
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => navigate('/dashboard/student')}
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Certificate Not Available Yet</h2>
            <p className="text-muted-foreground mb-6">Complete the course to receive your certificate</p>
            <Button onClick={() => navigate(`/courses/${courseId}/learn/start`)}>
              Continue Learning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
