import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Users, BookOpen, Play, Check, ChevronDown, Globe, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [instructor, setInstructor] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [id, user]);

  const loadCourse = async () => {
    setLoading(true);
    const { data: courseData } = await supabase
      .from('courses')
      .select('*, categories(name, icon)')
      .eq('id', id!)
      .single();
    if (courseData) {
      setCourse(courseData);
      // Load instructor profile
      if (courseData.instructor_id) {
        const { data: instrData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', courseData.instructor_id)
          .single();
        if (instrData) setInstructor(instrData);
      }
      // Load sections + lessons
      const { data: sectionsData } = await supabase
        .from('sections')
        .select('*, lessons(*)')
        .eq('course_id', id!)
        .order('order_index');
      if (sectionsData) {
        const sorted = sectionsData.map(s => ({
          ...s,
          lessons: [...(s.lessons || [])].sort((a, b) => a.order_index - b.order_index),
        }));
        setSections(sorted);
        if (sorted.length > 0) setExpandedSection(sorted[0].id);
      }
      // Check enrollment
      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', id!)
          .eq('student_id', user.id)
          .maybeSingle();
        setIsEnrolled(!!enrollment);
      }
    }
    setLoading(false);
  };

  const handleEnrollClick = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (isEnrolled) {
      // Find first lesson
      const firstLesson = sections[0]?.lessons?.[0];
      navigate(`/courses/${id}/learn/${firstLesson?.id || 'start'}`);
      return;
    }
    navigate(`/checkout/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary rounded-lg w-2/3" />
            <div className="h-4 bg-secondary rounded w-1/2" />
            <div className="h-64 bg-secondary rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🚢</div>
          <h2 className="font-display text-2xl font-bold mb-2">Course Not Found</h2>
          <Link to="/courses" className="text-primary hover:underline">Browse Courses</Link>
        </div>
      </div>
    );
  }

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const totalMinutes = sections.reduce((acc, s) => acc + (s.lessons || []).reduce((a: number, l: any) => a + (l.duration_minutes || 0), 0), 0);
  const discount = course.original_price && course.original_price > course.price
    ? Math.round((1 - course.price / course.original_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="bg-navy-mid border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left: Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                {course.categories && (
                  <span className="text-xs text-primary font-medium">{course.categories.icon} {course.categories.name}</span>
                )}
                {course.categories && <span className="text-xs text-muted-foreground">›</span>}
                {course.level && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    course.level === 'beginner' ? 'bg-green-500/10 text-green-400' :
                    course.level === 'intermediate' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-orange-500/10 text-orange-400'
                  }`}>{course.level.charAt(0).toUpperCase() + course.level.slice(1)}</span>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground text-lg mb-5">{course.short_description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm mb-5">
                {(course.rating || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gold font-bold text-lg">{Number(course.rating).toFixed(1)}</span>
                    <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(course.rating) ? 'fill-gold text-gold' : 'text-muted'}`} />)}</div>
                    {course.rating_count > 0 && <span className="text-muted-foreground">({course.rating_count.toLocaleString()} ratings)</span>}
                  </div>
                )}
                {course.students_count > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" />{course.students_count.toLocaleString()} students</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {course.duration_hours > 0 && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration_hours}h total</span>}
                {totalLessons > 0 && <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{totalLessons} lessons</span>}
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{course.language || 'Arabic'}</span>
              </div>

              {instructor && (
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden">
                    {instructor.avatar_url ? (
                      <img src={instructor.avatar_url} alt={instructor.full_name} className="w-full h-full object-cover" />
                    ) : (
                      instructor.full_name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Instructor</p>
                    <p className="font-medium text-primary">{instructor.full_name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Buy Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
                  <div className="aspect-video bg-navy-deep relative">
                    <img
                      src={course.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=340&fit=crop'}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
                        <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="font-display text-3xl font-bold">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                      {discount > 0 && (
                        <>
                          <span className="text-muted-foreground line-through text-lg">${course.original_price}</span>
                          <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">{discount}% OFF</span>
                        </>
                      )}
                    </div>
                    <Button
                      className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow mb-3"
                      size="lg"
                      onClick={handleEnrollClick}
                    >
                      {isEnrolled ? '▶ Continue Learning' : user ? (course.price === 0 ? '🎓 Enroll Free' : 'Enroll Now') : 'Get Started'}
                    </Button>
                    {isEnrolled && (
                      <div className="flex items-center justify-center gap-2 text-sm text-green-400 mb-3">
                        <Check className="w-4 h-4" /> You're enrolled
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center mb-4">30-Day Money-Back Guarantee</p>
                    <div className="space-y-2 text-sm">
                      {[
                        course.duration_hours > 0 && `${course.duration_hours}h on-demand HD video`,
                        totalLessons > 0 && `${totalLessons} lectures`,
                        'Certificate of completion',
                        'Full lifetime access',
                      ].filter(Boolean).map(item => (
                        <div key={item as string} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {course.description && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">About This Course</h2>
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              </div>
            )}

            {/* Curriculum */}
            {sections.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Course Curriculum</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {sections.length} sections • {totalLessons} lessons • {Math.round(totalMinutes / 60)}h total
                </p>
                <div className="space-y-2">
                  {sections.map(section => (
                    <div key={section.id} className="rounded-lg border border-border overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 transition-colors text-left"
                        onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`} />
                          <span className="font-semibold text-sm">{section.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{section.lessons?.length || 0} lessons</span>
                      </button>
                      {expandedSection === section.id && (
                        <div className="divide-y divide-border/50">
                          {(section.lessons || []).map((lesson: any) => (
                            <div key={lesson.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                              <div className="flex items-center gap-3">
                                {lesson.is_preview ? (
                                  <Play className="w-4 h-4 text-primary shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="text-sm text-muted-foreground">{lesson.title}</span>
                                {lesson.is_preview && (
                                  <span className="text-xs text-primary border border-primary/30 px-1.5 py-0.5 rounded">Preview</span>
                                )}
                                {lesson.lesson_type && lesson.lesson_type !== 'video' && (
                                  <span className="text-xs text-accent border border-accent/30 px-1.5 py-0.5 rounded capitalize">{lesson.lesson_type}</span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0 ml-4">{lesson.duration_minutes || 0}m</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor */}
            {instructor && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-5">Your Instructor</h2>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground overflow-hidden shrink-0">
                    {instructor.avatar_url ? (
                      <img src={instructor.avatar_url} alt={instructor.full_name} className="w-full h-full object-cover" />
                    ) : (
                      instructor.full_name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-primary">{instructor.full_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 capitalize">{instructor.role}</p>
                    {instructor.bio && <p className="text-sm text-muted-foreground">{instructor.bio}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
