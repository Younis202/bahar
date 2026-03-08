import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  BookOpen, Save, Eye, ArrowLeft, Video, FileText, HelpCircle
} from 'lucide-react';

interface LessonForm {
  id: string;
  title: string;
  lesson_type: 'video' | 'quiz' | 'document';
  duration_minutes: number;
  bunny_video_id: string;
  is_preview: boolean;
}

interface SectionForm {
  id: string;
  title: string;
  lessons: LessonForm[];
  expanded: boolean;
}

const newLesson = (): LessonForm => ({
  id: crypto.randomUUID(),
  title: '',
  lesson_type: 'video',
  duration_minutes: 10,
  bunny_video_id: '',
  is_preview: false,
});

const newSection = (): SectionForm => ({
  id: crypto.randomUUID(),
  title: '',
  lessons: [newLesson()],
  expanded: true,
});

export default function CreateCourse() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [info, setInfo] = useState({
    title: '',
    short_description: '',
    description: '',
    price: '',
    original_price: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    language: 'Arabic',
    thumbnail_url: '',
    trailer_bunny_id: '',
    category_id: '',
  });

  const [sections, setSections] = useState<SectionForm[]>([newSection()]);

  const updateInfo = (k: string, v: string) => setInfo(prev => ({ ...prev, [k]: v }));

  const addSection = () => setSections(prev => [...prev, newSection()]);
  const removeSection = (sid: string) => setSections(prev => prev.filter(s => s.id !== sid));
  const updateSection = (sid: string, title: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, title } : s));
  const toggleSection = (sid: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, expanded: !s.expanded } : s));

  const addLesson = (sid: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, lessons: [...s.lessons, newLesson()] } : s));
  const removeLesson = (sid: string, lid: string) =>
    setSections(prev => prev.map(s => s.id === sid ? { ...s, lessons: s.lessons.filter(l => l.id !== lid) } : s));
  const updateLesson = (sid: string, lid: string, key: string, val: string | boolean | number) =>
    setSections(prev => prev.map(s => s.id === sid ? {
      ...s,
      lessons: s.lessons.map(l => l.id === lid ? { ...l, [key]: val } : l)
    } : s));

  const handleSave = async (status: 'draft' | 'published') => {
    if (!info.title.trim()) {
      toast({ title: 'خطأ', description: 'عنوان الكورس مطلوب', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // 1. Create course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: info.title,
          short_description: info.short_description,
          description: info.description,
          price: parseFloat(info.price) || 0,
          original_price: info.original_price ? parseFloat(info.original_price) : null,
          level: info.level,
          language: info.language,
          thumbnail_url: info.thumbnail_url || null,
          trailer_bunny_id: info.trailer_bunny_id || null,
          category_id: info.category_id || null,
          instructor_id: profile!.id,
          status,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Create sections + lessons
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        if (!sec.title.trim()) continue;

        const { data: secData, error: secError } = await supabase
          .from('sections')
          .insert({ course_id: courseData.id, title: sec.title, order_index: si })
          .select()
          .single();

        if (secError) throw secError;

        for (let li = 0; li < sec.lessons.length; li++) {
          const les = sec.lessons[li];
          if (!les.title.trim()) continue;
          await supabase.from('lessons').insert({
            section_id: secData.id,
            title: les.title,
            lesson_type: les.lesson_type,
            duration_minutes: les.duration_minutes,
            bunny_video_id: les.bunny_video_id || null,
            is_preview: les.is_preview,
            order_index: li,
          });
        }
      }

      toast({ title: status === 'published' ? '🎉 تم نشر الكورس!' : '✅ تم الحفظ كمسودة' });
      navigate('/dashboard/instructor');
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const lessonTypeIcon = (t: string) => {
    if (t === 'quiz') return <HelpCircle className="w-4 h-4 text-accent" />;
    if (t === 'document') return <FileText className="w-4 h-4 text-blue-400" />;
    return <Video className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/instructor')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Create New Course</h1>
            <p className="text-muted-foreground text-sm">Build your course step by step</p>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Course Info' },
            { n: 2, label: 'Curriculum' },
            { n: 3, label: 'Preview & Publish' },
          ].map(({ n, label }) => (
            <button
              key={n}
              onClick={() => setStep(n as 1 | 2 | 3)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === n ? 'bg-primary text-primary-foreground' : step > n ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step === n ? 'bg-primary-foreground text-primary' : step > n ? 'bg-green-400 text-background' : 'bg-muted text-muted-foreground'
              }`}>{n}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Course Info */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Basic Information
              </h2>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Course Title *</label>
                <Input
                  value={info.title}
                  onChange={e => updateInfo('title', e.target.value)}
                  placeholder="e.g. Maritime Navigation Systems: ECDIS & GPS Mastery"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Short Description</label>
                <Input
                  value={info.short_description}
                  onChange={e => updateInfo('short_description', e.target.value)}
                  placeholder="Brief description shown in course cards (max 150 chars)"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Description</label>
                <Textarea
                  value={info.description}
                  onChange={e => updateInfo('description', e.target.value)}
                  placeholder="Detailed description of what students will learn..."
                  rows={5}
                  className="bg-background resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Price ($)</label>
                  <Input type="number" value={info.price} onChange={e => updateInfo('price', e.target.value)} placeholder="299" className="bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Original Price ($) <span className="text-muted-foreground text-xs">(optional)</span></label>
                  <Input type="number" value={info.original_price} onChange={e => updateInfo('original_price', e.target.value)} placeholder="499" className="bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Level</label>
                  <select value={info.level} onChange={e => updateInfo('level', e.target.value)} className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Language</label>
                  <select value={info.language} onChange={e => updateInfo('language', e.target.value)} className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm">
                    <option value="Arabic">Arabic</option>
                    <option value="English">English</option>
                    <option value="Arabic & English">Arabic & English</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Thumbnail URL</label>
                <Input value={info.thumbnail_url} onChange={e => updateInfo('thumbnail_url', e.target.value)} placeholder="https://..." className="bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Bunny.net Trailer Video ID <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <Input value={info.trailer_bunny_id} onChange={e => updateInfo('trailer_bunny_id', e.target.value)} placeholder="e.g. abc123-def456" className="bg-background" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                Next: Build Curriculum →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Curriculum */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-lg">Course Curriculum</h2>
              <Button size="sm" onClick={addSection} variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Add Section
              </Button>
            </div>

            {sections.map((section, si) => (
              <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-3 p-4 bg-secondary/30 border-b border-border">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">Section {si + 1}</span>
                  <Input
                    value={section.title}
                    onChange={e => updateSection(section.id, e.target.value)}
                    placeholder="Section title..."
                    className="bg-background flex-1 h-8 text-sm"
                  />
                  <button onClick={() => toggleSection(section.id)} className="text-muted-foreground hover:text-foreground">
                    {section.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(section.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {section.expanded && (
                  <div className="p-4 space-y-3">
                    {section.lessons.map((lesson, li) => (
                      <div key={lesson.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border/50">
                        <div className="mt-2 shrink-0">{lessonTypeIcon(lesson.lesson_type)}</div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            value={lesson.title}
                            onChange={e => updateLesson(section.id, lesson.id, 'title', e.target.value)}
                            placeholder={`Lesson ${li + 1} title...`}
                            className="bg-card h-8 text-sm col-span-2 sm:col-span-1"
                          />
                          <div className="flex gap-2">
                            <select
                              value={lesson.lesson_type}
                              onChange={e => updateLesson(section.id, lesson.id, 'lesson_type', e.target.value)}
                              className="flex-1 px-2 py-1.5 bg-card border border-input rounded-md text-xs"
                            >
                              <option value="video">Video</option>
                              <option value="quiz">Quiz</option>
                              <option value="document">Document</option>
                            </select>
                            <Input
                              type="number"
                              value={lesson.duration_minutes}
                              onChange={e => updateLesson(section.id, lesson.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                              placeholder="Min"
                              className="w-16 bg-card h-8 text-xs"
                            />
                          </div>
                          {lesson.lesson_type === 'video' && (
                            <Input
                              value={lesson.bunny_video_id}
                              onChange={e => updateLesson(section.id, lesson.id, 'bunny_video_id', e.target.value)}
                              placeholder="Bunny Video ID"
                              className="bg-card h-8 text-xs"
                            />
                          )}
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={lesson.is_preview}
                              onChange={e => updateLesson(section.id, lesson.id, 'is_preview', e.target.checked)}
                              className="rounded"
                            />
                            Free Preview
                          </label>
                        </div>
                        {section.lessons.length > 1 && (
                          <button onClick={() => removeLesson(section.id, lesson.id)} className="text-destructive hover:text-destructive/80 mt-2 shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => addLesson(section.id)} className="w-full border border-dashed border-border/60 hover:border-primary/40">
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Lesson
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                Next: Preview & Publish →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview & Publish */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Course Preview
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium text-right max-w-xs">{info.title || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold text-primary">${info.price || '0'}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Level</span>
                  <span className="capitalize">{info.level}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Sections</span>
                  <span>{sections.filter(s => s.title).length}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Total Lessons</span>
                  <span>{sections.reduce((acc, s) => acc + s.lessons.filter(l => l.title).length, 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20 rounded-xl p-5">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Video className="w-4 h-4 text-accent" /> Bunny.net Setup Reminder
              </h3>
              <p className="text-sm text-muted-foreground">
                Make sure to upload your videos to Bunny.net Stream first and add the Video IDs to each lesson above.
                Videos with blank IDs will show a placeholder.
              </p>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>← Back to Curriculum</Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" /> Save as Draft
                </Button>
                <Button
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
                  onClick={() => handleSave('published')}
                  disabled={saving}
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                  ) : null}
                  🚀 Publish Course
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
