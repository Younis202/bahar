import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle, Circle, PlayCircle, ChevronDown, ChevronUp,
  ArrowLeft, ArrowRight, Menu, X, Lock
} from 'lucide-react';

const CourseViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Check enrollment
  const { data: enrollment, isLoading: enrollLoading } = useQuery({
    queryKey: ['enrollment', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id!)
        .eq('student_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: course } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections-with-lessons', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sections')
        .select('*, lessons(*)')
        .eq('course_id', id!)
        .order('order_index');
      return data?.map(s => ({
        ...s,
        lessons: Array.isArray(s.lessons) ? [...s.lessons].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)) : []
      })) ?? [];
    },
    enabled: !!id,
  });

  const { data: progressData } = useQuery({
    queryKey: ['lesson-progress', id, user?.id],
    queryFn: async () => {
      const lessonIds = sections?.flatMap(s => s.lessons?.map((l: any) => l.id) || []) || [];
      if (lessonIds.length === 0) return [];
      const { data } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', user!.id)
        .in('lesson_id', lessonIds);
      return data ?? [];
    },
    enabled: !!sections && !!user,
  });

  const completedLessonIds = new Set(progressData?.filter(p => p.completed).map(p => p.lesson_id) || []);
  const allLessons = sections?.flatMap(s => s.lessons || []) || [];
  const progressPercent = allLessons.length > 0 ? Math.round((completedLessonIds.size / allLessons.length) * 100) : 0;

  // Set first lesson as default
  useEffect(() => {
    if (!currentLessonId && allLessons.length > 0) {
      const firstUncompleted = allLessons.find(l => !completedLessonIds.has(l.id));
      setCurrentLessonId(firstUncompleted?.id || allLessons[0].id);
    }
  }, [allLessons, currentLessonId, completedLessonIds]);

  // Expand section of current lesson
  useEffect(() => {
    if (currentLessonId && sections) {
      const section = sections.find(s => s.lessons?.some((l: any) => l.id === currentLessonId));
      if (section && !expandedSections.includes(section.id)) {
        setExpandedSections(prev => [...prev, section.id]);
      }
    }
  }, [currentLessonId, sections]);

  const currentLesson = allLessons.find(l => l.id === currentLessonId);
  const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const existing = progressData?.find(p => p.lesson_id === lessonId);
      if (existing) {
        await supabase.from('lesson_progress').update({
          completed: true,
          completed_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabase.from('lesson_progress').insert({
          lesson_id: lessonId,
          student_id: user!.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', id] });
    },
  });

  const goToLesson = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < allLessons.length) {
      setCurrentLessonId(allLessons[newIndex].id);
    }
  };

  // Redirect if not enrolled
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    if (!enrollLoading && !enrollment && user) navigate(`/course/${id}`);
  }, [authLoading, enrollLoading, user, enrollment]);

  if (authLoading || enrollLoading || !sections) {
    return <div className="min-h-screen flex items-center justify-center">{t('general.loading')}</div>;
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-e bg-card overflow-hidden shrink-0`}>
        <div className="w-80 h-full flex flex-col">
          {/* Progress Header */}
          <div className="p-4 border-b">
            <h3 className="font-bold text-sm mb-2">
              {course?.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{progressPercent}%</span>
              <Progress value={progressPercent} className="flex-1 h-2" />
            </div>
          </div>

          {/* Lessons List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sections.map((section: any) => (
                <div key={section.id} className="mb-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 text-sm font-semibold"
                  >
                    <span className="truncate">{section.title}</span>
                    {expandedSections.includes(section.id) ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </button>
                  {expandedSections.includes(section.id) && (
                    <div className="ms-2">
                      {section.lessons?.map((lesson: any) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        const isCurrent = lesson.id === currentLessonId;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setCurrentLessonId(lesson.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                              isCurrent ? 'bg-ocean/10 text-ocean font-medium' : 'hover:bg-muted/50'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            ) : isCurrent ? (
                              <PlayCircle className="h-4 w-4 text-ocean shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="truncate text-start">{lesson.title}</span>
                            {lesson.duration_minutes && (
                              <span className="ms-auto text-xs text-muted-foreground shrink-0">
                                {lesson.duration_minutes}{language === 'ar' ? 'د' : 'm'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toggle + Title */}
        <div className="flex items-center gap-3 p-3 border-b bg-background">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h2 className="font-semibold truncate">
            {currentLesson?.title}
          </h2>
        </div>

        {/* Video Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4">
            {currentLesson?.bunny_video_id ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://iframe.mediadelivery.net/embed/library/${currentLesson.bunny_video_id}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <PlayCircle className="h-16 w-16 mx-auto mb-2 opacity-30" />
                  <p>{language === 'ar' ? 'لا يوجد فيديو لهذا الدرس' : 'No video for this lesson'}</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => goToLesson('prev')}
                disabled={currentIndex <= 0}
              >
                {language === 'ar' ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
                {language === 'ar' ? 'الدرس السابق' : 'Previous'}
              </Button>

              <Button
                variant={completedLessonIds.has(currentLessonId || '') ? 'outline' : 'default'}
                onClick={() => currentLessonId && markCompleteMutation.mutate(currentLessonId)}
                disabled={markCompleteMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 me-2" />
                {completedLessonIds.has(currentLessonId || '')
                  ? (language === 'ar' ? 'مكتمل ✓' : 'Completed ✓')
                  : (language === 'ar' ? 'تعليم كمكتمل' : 'Mark Complete')}
              </Button>

              <Button
                variant="outline"
                onClick={() => goToLesson('next')}
                disabled={currentIndex >= allLessons.length - 1}
              >
                {language === 'ar' ? 'الدرس التالي' : 'Next'}
                {language === 'ar' ? <ArrowLeft className="h-4 w-4 ms-2" /> : <ArrowRight className="h-4 w-4 ms-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
