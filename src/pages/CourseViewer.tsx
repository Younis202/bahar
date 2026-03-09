import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
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
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  // Check enrollment
  const { data: enrollment, isLoading: enrollLoading } = useQuery({
    queryKey: ['enrollment', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id!)
        .eq('user_id', user!.id)
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

  const { data: topics } = useQuery({
    queryKey: ['topics-with-lessons', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('topics')
        .select('*, lessons(*)')
        .eq('course_id', id!)
        .order('sort_order');
      // Sort lessons within each topic
      return data?.map(t => ({
        ...t,
        lessons: (t.lessons || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      })) ?? [];
    },
    enabled: !!id,
  });

  const { data: progressData } = useQuery({
    queryKey: ['lesson-progress', id, user?.id],
    queryFn: async () => {
      const lessonIds = topics?.flatMap(t => t.lessons?.map((l: any) => l.id) || []) || [];
      if (lessonIds.length === 0) return [];
      const { data } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user!.id)
        .in('lesson_id', lessonIds);
      return data ?? [];
    },
    enabled: !!topics && !!user,
  });

  const completedLessonIds = new Set(progressData?.filter(p => p.completed).map(p => p.lesson_id) || []);
  const allLessons = topics?.flatMap(t => t.lessons || []) || [];
  const progressPercent = allLessons.length > 0 ? Math.round((completedLessonIds.size / allLessons.length) * 100) : 0;

  // Set first lesson as default
  useEffect(() => {
    if (!currentLessonId && allLessons.length > 0) {
      // Find first uncompleted lesson, or first lesson
      const firstUncompleted = allLessons.find(l => !completedLessonIds.has(l.id));
      setCurrentLessonId(firstUncompleted?.id || allLessons[0].id);
    }
  }, [allLessons, currentLessonId, completedLessonIds]);

  // Expand topic of current lesson
  useEffect(() => {
    if (currentLessonId && topics) {
      const topic = topics.find(t => t.lessons?.some((l: any) => l.id === currentLessonId));
      if (topic && !expandedTopics.includes(topic.id)) {
        setExpandedTopics(prev => [...prev, topic.id]);
      }
    }
  }, [currentLessonId, topics]);

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
          user_id: user!.id,
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

  if (authLoading || enrollLoading || !topics) {
    return <div className="min-h-screen flex items-center justify-center">{t('general.loading')}</div>;
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev =>
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
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
              {language === 'ar' ? course?.title_ar : (course?.title_en || course?.title_ar)}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{progressPercent}%</span>
              <Progress value={progressPercent} className="flex-1 h-2" />
            </div>
          </div>

          {/* Lessons List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {topics.map((topic: any) => (
                <div key={topic.id} className="mb-1">
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 text-sm font-semibold"
                  >
                    <span className="truncate">
                      {language === 'ar' ? topic.title_ar : (topic.title_en || topic.title_ar)}
                    </span>
                    {expandedTopics.includes(topic.id) ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </button>
                  {expandedTopics.includes(topic.id) && (
                    <div className="ms-2">
                      {topic.lessons?.map((lesson: any) => {
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
                            <span className="truncate text-start">
                              {language === 'ar' ? lesson.title_ar : (lesson.title_en || lesson.title_ar)}
                            </span>
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
            {currentLesson && (language === 'ar' ? currentLesson.title_ar : (currentLesson.title_en || currentLesson.title_ar))}
          </h2>
        </div>

        {/* Video Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4">
            {currentLesson?.video_embed_code ? (
              <div
                className="aspect-video w-full rounded-lg overflow-hidden bg-black"
                dangerouslySetInnerHTML={{ __html: currentLesson.video_embed_code }}
              />
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
                className={completedLessonIds.has(currentLessonId || '') ? 'text-ocean' : 'bg-ocean hover:bg-ocean-dark'}
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

            {/* Lesson description */}
            {currentLesson && (currentLesson.description_ar || currentLesson.description_en) && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">{language === 'ar' ? 'عن الدرس' : 'About this lesson'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? currentLesson.description_ar : (currentLesson.description_en || currentLesson.description_ar)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
