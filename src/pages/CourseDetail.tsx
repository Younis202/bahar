import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Anchor, BookOpen, Clock, Users, Star, CheckCircle, PlayCircle,
  Lock, ChevronDown, ChevronUp, ArrowRight, ArrowLeft, ShieldCheck
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*, categories(name_ar, name_en, slug)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', course?.instructor_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', course!.instructor_id)
        .single();
      return data;
    },
    enabled: !!course?.instructor_id,
  });

  const { data: topics } = useQuery({
    queryKey: ['topics', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('topics')
        .select('*, lessons(*)')
        .eq('course_id', id!)
        .order('sort_order');
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
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

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('course_id', id!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('enrollments').insert({
        course_id: id!,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      toast({
        title: language === 'ar' ? 'تم الاشتراك بنجاح!' : 'Enrolled successfully!',
        description: language === 'ar' ? 'يمكنك البدء في مشاهدة الكورس الآن' : 'You can start watching the course now',
      });
    },
    onError: (err: any) => {
      toast({ title: t('general.error'), description: err.message, variant: 'destructive' });
    },
  });

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev =>
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
    );
  };

  const totalLessons = topics?.reduce((acc, t) => acc + (t.lessons?.length || 0), 0) ?? 0;
  const totalDuration = topics?.reduce(
    (acc, t) => acc + (t.lessons?.reduce((a: number, l: any) => a + (l.duration_minutes || 0), 0) || 0), 0
  ) ?? 0;

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">{t('general.loading')}</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center">{t('courses.noCourses')}</div>;

  const title = language === 'ar' ? course.title_ar : (course.title_en || course.title_ar);
  const description = language === 'ar' ? course.description_ar : (course.description_en || course.description_ar);
  const whatYouLearn = language === 'ar' ? course.what_you_learn_ar : (course.what_you_learn_en || course.what_you_learn_ar);
  const requirements = language === 'ar' ? course.requirements_ar : (course.requirements_en || course.requirements_ar);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-ocean-dark to-ocean text-white py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Badge className="bg-white/20 text-white border-0 mb-4">
                {language === 'ar' ? (course.categories as any)?.name_ar : (course.categories as any)?.name_en}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
              <p className="text-white/80 text-lg mb-6 max-w-2xl">{description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-white/70">
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-gold fill-gold" />
                    {avgRating} ({reviews?.length})
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {totalLessons} {t('courses.lessons')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round(totalDuration / 60)} {t('courses.hours')}
                </span>
                <Badge variant="outline" className="border-white/30 text-white">
                  {t(`courses.${course.level}` as any)}
                </Badge>
              </div>

              {instructor && (
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {instructor.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-sm text-white/60">{t('courses.instructor')}</div>
                    <div className="font-medium">{instructor.full_name}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Card */}
            <div>
              <Card className="sticky top-20 shadow-2xl">
                {/* Trailer */}
                {course.trailer_url ? (
                  <div className="aspect-video w-full" dangerouslySetInnerHTML={{ __html: course.trailer_url }} />
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-ocean/20 to-navy/20 flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-ocean/40" />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-4">
                    {course.discount_price ? (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-foreground">${course.discount_price}</span>
                        <span className="text-lg text-muted-foreground line-through">${course.price}</span>
                        <Badge className="bg-gold text-navy">
                          {Math.round(((course.price! - course.discount_price) / course.price!) * 100)}% {language === 'ar' ? 'خصم' : 'OFF'}
                        </Badge>
                      </div>
                    ) : course.price && course.price > 0 ? (
                      <span className="text-3xl font-bold text-foreground">${course.price}</span>
                    ) : (
                      <span className="text-3xl font-bold text-ocean">{t('courses.free')}</span>
                    )}
                  </div>

                  {enrollment ? (
                    <Button
                      className="w-full bg-ocean hover:bg-ocean-dark text-lg h-12"
                      onClick={() => navigate(`/course/${id}/learn`)}
                    >
                      <PlayCircle className="h-5 w-5 me-2" />
                      {language === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-gold hover:bg-gold/90 text-navy text-lg h-12 font-semibold"
                      onClick={() => {
                        if (!user) {
                          navigate('/auth');
                          return;
                        }
                        enrollMutation.mutate();
                      }}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending
                        ? t('general.loading')
                        : (course.price && course.price > 0 ? t('courses.enroll') : (language === 'ar' ? 'اشترك مجاناً' : 'Enroll Free'))}
                    </Button>
                  )}

                  <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-ocean" />
                      {language === 'ar' ? 'وصول مدى الحياة' : 'Lifetime Access'}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-ocean" />
                      {language === 'ar' ? 'شهادة إتمام' : 'Certificate of Completion'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-3xl">
            {/* What You'll Learn */}
            {whatYouLearn && whatYouLearn.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold mb-4">{t('courses.whatYouLearn')}</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {whatYouLearn.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-ocean mt-0.5 shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Requirements */}
            {requirements && requirements.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{t('courses.requirements')}</h2>
                <ul className="space-y-2">
                  {requirements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowIcon className="h-4 w-4 text-ocean mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Curriculum */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{t('courses.curriculum')}</h2>
              <div className="space-y-3">
                {topics?.map((topic: any) => (
                  <Card key={topic.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedTopics.includes(topic.id) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        <span className="font-semibold">
                          {language === 'ar' ? topic.title_ar : (topic.title_en || topic.title_ar)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {topic.lessons?.length || 0} {t('courses.lessons')}
                      </span>
                    </button>
                    {expandedTopics.includes(topic.id) && topic.lessons && (
                      <div className="border-t">
                        {topic.lessons
                          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                          .map((lesson: any) => (
                            <div key={lesson.id} className="flex items-center justify-between px-6 py-3 border-b last:border-0 text-sm">
                              <div className="flex items-center gap-3">
                                {lesson.is_preview ? (
                                  <PlayCircle className="h-4 w-4 text-ocean" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span>{language === 'ar' ? lesson.title_ar : (lesson.title_en || lesson.title_ar)}</span>
                                {lesson.is_preview && (
                                  <Badge variant="outline" className="text-xs">{language === 'ar' ? 'معاينة' : 'Preview'}</Badge>
                                )}
                              </div>
                              {lesson.duration_minutes && (
                                <span className="text-muted-foreground">{lesson.duration_minutes} {language === 'ar' ? 'د' : 'min'}</span>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  {t('courses.reviews')} ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-8 w-8 rounded-full bg-ocean/10 flex items-center justify-center text-sm font-bold text-ocean">
                            {(review.profiles as any)?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{(review.profiles as any)?.full_name || (language === 'ar' ? 'طالب' : 'Student')}</div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-gold fill-gold' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;
