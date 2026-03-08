import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Award, Clock, TrendingUp, Play, CheckCircle, ChevronRight, Plus } from 'lucide-react';

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: enrollData }, { data: certData }] = await Promise.all([
      supabase
        .from('enrollments')
        .select('*, courses(id, title, thumbnail_url, duration_hours, level)')
        .eq('student_id', user!.id)
        .order('enrolled_at', { ascending: false }),
      supabase
        .from('certificates')
        .select('*, courses(title)')
        .eq('student_id', user!.id),
    ]);
    if (enrollData) setEnrollments(enrollData);
    if (certData) setCertificates(certData);
    setLoading(false);
  };

  const stats = [
    { label: 'Enrolled', value: enrollments.length.toString(), icon: BookOpen, color: 'text-primary' },
    { label: 'Completed', value: enrollments.filter(e => e.progress === 100).length.toString(), icon: Award, color: 'text-gold' },
    { label: 'In Progress', value: enrollments.filter(e => e.progress > 0 && e.progress < 100).length.toString(), icon: Clock, color: 'text-blue-400' },
    { label: 'Certificates', value: certificates.length.toString(), icon: TrendingUp, color: 'text-green-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">
            Welcome back, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p className="text-muted-foreground">Continue your maritime education journey</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className={`text-2xl font-display font-bold ${color}`}>{value}</span>
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* My Courses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">My Courses</h2>
            <Link to="/courses" className="text-primary text-sm flex items-center gap-1 hover:underline">
              Browse more <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-64 animate-pulse" />)}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display font-bold mb-2">No courses yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Start your maritime learning journey today</p>
              <Button onClick={() => navigate('/courses')} className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Browse Courses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrollments.map((enrollment, i) => {
                const course = enrollment.courses;
                const progress = enrollment.progress || 0;
                return (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                  >
                    <div className="relative">
                      <img
                        src={course?.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=300&fit=crop'}
                        alt={course?.title}
                        className="w-full h-40 object-cover"
                      />
                      {progress === 100 && (
                        <div className="absolute inset-0 bg-green-900/70 flex items-center justify-center">
                          <div className="text-center">
                            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-1" />
                            <p className="text-sm text-green-300 font-semibold">Completed!</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-3">{course?.title}</h3>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span className="font-medium text-foreground">{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary">
                          <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          variant={progress === 100 ? 'secondary' : 'default'}
                          onClick={() => navigate(`/courses/${course?.id}/learn/start`)}
                        >
                          {progress === 0 ? (
                            <><Play className="w-3.5 h-3.5 mr-1" />Start</>
                          ) : progress === 100 ? (
                            <><Award className="w-3.5 h-3.5 mr-1" />Review</>
                          ) : (
                            <><Play className="w-3.5 h-3.5 mr-1" />Continue</>
                          )}
                        </Button>
                        {progress === 100 && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/certificate/${course?.id}`)}>
                            <Award className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Certificates */}
        {certificates.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
            <h2 className="font-display text-xl font-bold mb-5">My Certificates 🎓</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map(cert => (
                <div key={cert.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gold/5 to-accent/5 border border-gold/20 rounded-xl hover:border-gold/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{cert.courses?.title}</p>
                    <p className="font-mono text-xs text-accent mt-0.5">{cert.certificate_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/certificate/${cert.course_id}`)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommended */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10">
          <h2 className="font-display text-xl font-bold mb-5">Recommended for You</h2>
          <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold mb-1">Explore More Maritime Courses</h3>
              <p className="text-sm text-muted-foreground">Deepen your expertise with our full course catalog</p>
            </div>
            <Button onClick={() => navigate('/courses')}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
