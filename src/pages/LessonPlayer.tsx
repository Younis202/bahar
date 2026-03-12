import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Play, FileText, HelpCircle, Menu, X, CheckCircle, BookOpen, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BunnyPlayer from '@/components/BunnyPlayer';
import TextLessonContent from '@/components/TextLessonContent';
import QuizPlayer from '@/components/QuizPlayer';
import LearningNotes from '@/components/LearningNotes';
import LessonComments from '@/components/LessonComments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/supabaseAny';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function LessonPlayer() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [id, user]);

  const loadCourseData = async () => {
    setLoading(true);
    // Load course
    const { data: courseData } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', id!)
      .single();
    if (courseData) setCourse(courseData);

    // Load sections + lessons
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*, lessons(*)')
      .eq('course_id', id!)
      .order('order_index');
    if (sectionsData) {
      const sorted = sectionsData.map(s => ({
        ...s,
        lessons: [...(s.lessons || [])].sort((a: any, b: any) => a.order_index - b.order_index),
      }));
      setSections(sorted);
    }

    // Load completed lessons
    if (user) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', user.id)
        .eq('completed', true);
      if (progressData) {
        setCompletedLessons(new Set(progressData.map(p => p.lesson_id)));
      }
    }
    setLoading(false);
  };

  // Redirect to first lesson if lessonId is 'start' or missing
  useEffect(() => {
    if (!loading && sections.length > 0 && (!lessonId || lessonId === 'start')) {
      const firstLesson = sections[0]?.lessons?.[0];
      if (firstLesson) {
        navigate(`/courses/${id}/learn/${firstLesson.id}`, { replace: true });
      }
    }
  }, [loading, sections, lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Course not found</h2>
          <Link to="/courses" className="text-primary hover:underline">Back to Courses</Link>
        </div>
      </div>
    );
  }

  // Find current lesson
  const allLessons = sections.flatMap(s => s.lessons || []);
  const currentIdx = allLessons.findIndex(l => l.id === lessonId);
  const currentLesson = currentIdx >= 0 ? allLessons[currentIdx] : allLessons[0];
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const progress = allLessons.length > 0 ? Math.round((completedLessons.size / allLessons.length) * 100) : 0;

  const toggleComplete = async (lid: string) => {
    if (!user || markingComplete) return;
    setMarkingComplete(true);
    const isCompleted = completedLessons.has(lid);
    if (!isCompleted) {
      // Mark as complete
      await supabase.from('lesson_progress').upsert({
        student_id: user.id,
        lesson_id: lid,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'student_id,lesson_id' });
      setCompletedLessons(prev => new Set([...prev, lid]));
      toast({ title: '✅ Lesson completed!' });
      // Update enrollment progress
      const newProgress = Math.round(((completedLessons.size + 1) / allLessons.length) * 100);
      await supabase
        .from('enrollments')
        .update({ progress: newProgress, ...(newProgress === 100 ? { completed_at: new Date().toISOString() } : {}) })
        .eq('course_id', id!)
        .eq('student_id', user.id);
      // Auto-advance to next lesson
      if (nextLesson) {
        setTimeout(() => navigate(`/courses/${id}/learn/${nextLesson.id}`), 500);
      }
    } else {
      await supabase
        .from('lesson_progress')
        .update({ completed: false, completed_at: null })
        .eq('student_id', user.id)
        .eq('lesson_id', lid);
      setCompletedLessons(prev => {
        const next = new Set(prev);
        next.delete(lid);
        return next;
      });
    }
    setMarkingComplete(false);
  };

  const lessonTypeIcon = (type: string) => {
    if (type === 'quiz') return <HelpCircle className="w-3.5 h-3.5" />;
    if (type === 'text' || type === 'article') return <BookOpen className="w-3.5 h-3.5" />;
    if (type === 'document') return <FileText className="w-3.5 h-3.5" />;
    if (type === 'audio') return <Headphones className="w-3.5 h-3.5" />;
    return <Play className="w-3.5 h-3.5" />;
  };

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">No lessons yet</h2>
          <Link to={`/courses/${id}`} className="text-primary hover:underline">Back to Course</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b border-border glass flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/courses/${id}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-border">|</span>
          <span className="text-sm font-medium text-foreground line-clamp-1">{course.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-32 h-1.5 rounded-full bg-secondary">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}% complete</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Lesson Content - varies by type */}
          <div className="w-full">
            {(currentLesson.lesson_type === 'text' || currentLesson.lesson_type === 'article') ? (
              <div className="max-w-4xl mx-auto p-6">
                <TextLessonContent content={currentLesson.text_content} title={currentLesson.title} />
              </div>
            ) : currentLesson.lesson_type === 'quiz' ? (
              <div className="max-w-3xl mx-auto p-6">
                <QuizPlayer
                  lessonId={currentLesson.id}
                  onComplete={(passed) => {
                    if (passed) toggleComplete(currentLesson.id);
                  }}
                />
              </div>
            ) : currentLesson.lesson_type === 'audio' ? (
              <div className="max-w-4xl mx-auto p-6">
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Headphones className="w-16 h-16 mx-auto mb-4 text-primary/40" />
                  <h3 className="font-display text-lg font-bold mb-4">{currentLesson.title}</h3>
                  {currentLesson.audio_url ? (
                    <audio controls className="w-full max-w-md mx-auto" src={currentLesson.audio_url}>
                      Your browser does not support audio.
                    </audio>
                  ) : (
                    <p className="text-muted-foreground">No audio file attached yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-black">
                <div className="max-w-5xl mx-auto">
                  <BunnyPlayer
                    videoId={currentLesson.bunny_video_id}
                    title={currentLesson.title}
                    className="w-full rounded-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lesson Info + Tabs */}
          <div className="max-w-4xl mx-auto w-full px-6 py-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {lessonTypeIcon(currentLesson.lesson_type || 'video')}
                  <span className="capitalize">{currentLesson.lesson_type || 'video'}</span>
                  {currentLesson.duration_minutes > 0 && (
                    <><span>•</span><span>{currentLesson.duration_minutes} min</span></>
                  )}
                </div>
                <h1 className="font-display text-2xl font-bold">{currentLesson.title}</h1>
              </div>
              <Button
                variant={completedLessons.has(currentLesson.id) ? 'secondary' : 'default'}
                size="sm"
                className="shrink-0"
                onClick={() => toggleComplete(currentLesson.id)}
                disabled={markingComplete}
              >
                <Check className="w-4 h-4 mr-2" />
                {completedLessons.has(currentLesson.id) ? 'Completed ✓' : 'Mark Complete'}
              </Button>
            </div>

            {/* Tabs: Notes, Comments */}
            <Tabs defaultValue="comments" className="mb-6">
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="comments">💬 Discussion</TabsTrigger>
                <TabsTrigger value="notes">📝 My Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="mt-4">
                <LessonComments lessonId={currentLesson.id} />
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <LearningNotes lessonId={currentLesson.id} lessonTitle={currentLesson.title} />
              </TabsContent>
            </Tabs>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => prevLesson && navigate(`/courses/${id}/learn/${prevLesson.id}`)}
                disabled={!prevLesson}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIdx + 1} / {allLessons.length}
              </span>
              <Button
                onClick={() => nextLesson && navigate(`/courses/${id}/learn/${nextLesson.id}`)}
                disabled={!nextLesson}
                className={nextLesson ? 'bg-gradient-primary text-primary-foreground' : ''}
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Curriculum */}
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-80 border-l border-border bg-card overflow-y-auto shrink-0"
          >
            <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="font-display font-semibold text-sm">Course Content</h3>
              <p className="text-xs text-muted-foreground mt-1">{completedLessons.size}/{allLessons.length} completed</p>
            </div>
            <div className="divide-y divide-border/30">
              {sections.map(section => (
                <div key={section.id}>
                  <div className="px-4 py-3 bg-secondary/30">
                    <p className="text-xs font-semibold text-foreground">{section.title}</p>
                  </div>
                  {(section.lessons || []).map((lesson: any) => (
                    <button
                      key={lesson.id}
                      onClick={() => navigate(`/courses/${id}/learn/${lesson.id}`)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors ${lesson.id === currentLesson?.id ? 'bg-primary/10 border-r-2 border-primary' : ''}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {completedLessons.has(lesson.id) ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center">
                            <span className="text-muted-foreground">{lessonTypeIcon(lesson.lesson_type || 'video')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${lesson.id === currentLesson?.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {lesson.title}
                        </p>
                        {lesson.duration_minutes > 0 && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{lesson.duration_minutes}m</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  );
}
