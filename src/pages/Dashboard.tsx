import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Award, Clock, PlayCircle, Anchor } from 'lucide-react';

const Dashboard = () => {
  const { user, loading, isAdmin, isInstructor } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('*, courses(*, categories(name))')
        .eq('student_id', user!.id)
        .order('enrolled_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // Get progress for all enrolled courses
  const { data: allProgress } = useQuery({
    queryKey: ['all-progress', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('student_id', user!.id)
        .eq('completed', true);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Get lesson counts per course
  const courseIds = enrollments?.map((e: any) => e.course_id) ?? [];
  const { data: lessonCounts } = useQuery({
    queryKey: ['lesson-counts', courseIds],
    queryFn: async () => {
      const { data: sectionData } = await supabase
        .from('sections')
        .select('course_id, lessons(id)')
        .in('course_id', courseIds);
      
      const counts: Record<string, { total: number; lessonIds: string[] }> = {};
      sectionData?.forEach((s: any) => {
        if (!counts[s.course_id]) counts[s.course_id] = { total: 0, lessonIds: [] };
        const lessons = Array.isArray(s.lessons) ? s.lessons : [];
        counts[s.course_id].total += lessons.length;
        counts[s.course_id].lessonIds.push(...lessons.map((l: any) => l.id));
      });
      return counts;
    },
    enabled: courseIds.length > 0,
  });

  const getProgress = (courseId: string) => {
    if (!lessonCounts?.[courseId] || !allProgress) return 0;
    const { lessonIds, total } = lessonCounts[courseId];
    if (total === 0) return 0;
    const completed = allProgress.filter(p => lessonIds.includes(p.lesson_id)).length;
    return Math.round((completed / total) * 100);
  };

  const completedCourses = enrollments?.filter((e: any) => e.completed_at)?.length ?? 0;
  const totalHours = enrollments?.reduce((acc: number, e: any) => acc + ((e.courses as any)?.duration_hours || 0), 0) ?? 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('general.loading')}</div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <div className="flex gap-2">
            {isInstructor && (
              <Button variant="outline" onClick={() => navigate('/instructor')}>
                {language === 'ar' ? 'لوحة المحاضر' : 'Instructor Panel'}
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate('/admin')}>
                {language === 'ar' ? 'لوحة الأدمن' : 'Admin Panel'}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === 'ar' ? 'كورساتي' : 'My Courses'}
              </CardTitle>
              <BookOpen className="h-5 w-5 text-ocean" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{enrollments?.length ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === 'ar' ? 'مكتمل' : 'Completed'}
              </CardTitle>
              <Award className="h-5 w-5 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === 'ar' ? 'ساعات التعلم' : 'Learning Hours'}
              </CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours}</div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        {enrollments && enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment: any) => {
              const course = enrollment.courses;
              const progress = getProgress(course.id);
              return (
                <Card
                  key={enrollment.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => navigate(`/course/${course.id}/learn`)}
                >
                  <div className="relative h-40 bg-gradient-to-br from-ocean/20 to-navy/20 flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Anchor className="h-12 w-12 text-ocean/30" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <PlayCircle className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {(course.categories as any)?.name}
                    </Badge>
                    <h3 className="font-bold mb-3 line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-1 h-2" />
                      <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                    </div>
                    {progress === 100 && (
                      <Badge className="mt-2 bg-ocean text-ocean-foreground">
                        {language === 'ar' ? '✅ مكتمل' : '✅ Complete'}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ar' ? 'لم تشترك في أي كورس بعد' : 'No enrolled courses yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'ar' ? 'تصفح الكورسات المتاحة وابدأ رحلتك التعليمية' : 'Browse available courses and start your learning journey'}
              </p>
              <Button onClick={() => navigate('/courses')} className="bg-ocean hover:bg-ocean-dark">
                {t('hero.cta')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
