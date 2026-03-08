import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Plus, BookOpen, Users, Star, DollarSign, Eye, Edit, ToggleLeft, ToggleRight, Play } from 'lucide-react';

export default function InstructorDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*, categories(name, icon)')
      .eq('instructor_id', user!.id)
      .order('created_at', { ascending: false });

    if (coursesData) {
      setCourses(coursesData);
      setTotalStudents(coursesData.reduce((acc, c) => acc + (c.students_count || 0), 0));
    }
    setLoading(false);
  };

  const togglePublish = async (courseId: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published';
    await supabase.from('courses').update({ status: newStatus }).eq('id', courseId);
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus } : c));
  };

  const totalRevenue = courses.reduce((acc, c) => acc + ((c.price || 0) * (c.students_count || 0) * 0.7), 0);
  const avgRating = courses.length ? (courses.reduce((acc, c) => acc + (c.rating || 0), 0) / courses.length).toFixed(1) : '—';

  const stats = [
    { label: 'Total Students', value: totalStudents.toLocaleString(), icon: Users, change: '+' },
    { label: 'Total Courses', value: courses.length.toString(), icon: BookOpen, change: '' },
    { label: 'Avg Rating', value: avgRating, icon: Star, change: '' },
    { label: 'Est. Revenue', value: `$${Math.round(totalRevenue).toLocaleString()}`, icon: DollarSign, change: '' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Instructor Dashboard</h1>
            <p className="text-muted-foreground">Manage your courses and track performance</p>
          </div>
          <Button
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
            onClick={() => navigate('/instructor/create-course')}
          >
            <Plus className="w-4 h-4 mr-2" /> Create New Course
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Revenue Overview</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-lg">Last 6 months</span>
          </div>
          <div className="h-40 flex items-end gap-2">
            {[40, 65, 55, 80, 72, 95].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-gradient-primary opacity-80 transition-all hover:opacity-100" style={{ height: `${h}%` }} />
                <span className="text-xs text-muted-foreground">{['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'][i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* My Courses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-xl font-bold mb-5">My Courses</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display font-bold mb-2">No courses yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Create your first maritime course</p>
              <Button onClick={() => navigate('/instructor/create-course')} className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Create Course
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
                >
                  <img
                    src={course.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=100&h=60&fit=crop'}
                    alt={course.title}
                    className="w-20 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{course.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(course.students_count || 0).toLocaleString()} students</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{course.rating || '—'}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${course.price || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => togglePublish(course.id, course.status)}
                      className="flex items-center gap-2 text-xs"
                    >
                      {course.status === 'published' ? (
                        <><ToggleRight className="w-5 h-5 text-green-400" /><span className="text-green-400">Live</span></>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">Draft</span></>
                      )}
                    </button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${course.id}`)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/instructor/edit-course/${course.id}`)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bunny.net CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
          <div className="p-6 rounded-xl bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
                  <Play className="w-5 h-5 text-accent" /> Connect Bunny.net Stream
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Upload your videos to Bunny.net Stream for DRM protection, prevent downloads and screen recording, and get worldwide CDN delivery.
                </p>
              </div>
              <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 shrink-0">
                Setup Now
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
