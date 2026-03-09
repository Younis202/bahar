import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Anchor, BookOpen, Shield, Navigation, Wrench, Scale, Ship, Package, Star, Users, PlayCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const categoryIcons: Record<string, React.ReactNode> = {
  'navigation': <Navigation className="h-8 w-8" />,
  'engineering': <Wrench className="h-8 w-8" />,
  'safety': <Shield className="h-8 w-8" />,
  'law': <Scale className="h-8 w-8" />,
  'ship-management': <Ship className="h-8 w-8" />,
  'logistics': <Package className="h-8 w-8" />,
};

const Index = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      return data ?? [];
    },
  });

  const { data: featuredCourses } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*, categories(name_ar, name_en, slug)')
        .eq('status', 'published')
        .eq('is_featured', true)
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-ocean-dark to-ocean py-24 md:py-32">
        {/* Animated wave bg */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="currentColor" className="text-white" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,133.3C672,117,768,139,864,170.7C960,203,1056,245,1152,245.3C1248,245,1344,203,1392,181.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center text-white"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Anchor className="h-5 w-5" />
              <span className="text-sm font-medium">
                {language === 'ar' ? 'منصة تعليمية بحرية متخصصة' : 'Specialized Maritime Education'}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gold hover:bg-gold/90 text-navy font-semibold text-base px-8"
                onClick={() => navigate('/courses')}
              >
                <BookOpen className="h-5 w-5 me-2" />
                {t('hero.cta')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-base px-8"
                onClick={() => navigate('/auth?tab=signup')}
              >
                {t('hero.cta2')}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-md mx-auto">
              {[
                { icon: <BookOpen className="h-5 w-5" />, num: '50+', label: language === 'ar' ? 'كورس' : 'Courses' },
                { icon: <Users className="h-5 w-5" />, num: '1000+', label: language === 'ar' ? 'طالب' : 'Students' },
                { icon: <Star className="h-5 w-5" />, num: '4.8', label: language === 'ar' ? 'تقييم' : 'Rating' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-1 text-gold">{stat.icon}</div>
                  <div className="text-2xl font-bold">{stat.num}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{t('categories.title')}</h2>
            <p className="text-muted-foreground">{t('categories.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg hover:border-ocean/30 transition-all group text-center"
                  onClick={() => navigate(`/courses?category=${cat.slug}`)}
                >
                  <CardContent className="p-6">
                    <div className="mb-3 text-ocean group-hover:scale-110 transition-transform inline-block">
                      {categoryIcons[cat.slug] || <BookOpen className="h-8 w-8" />}
                    </div>
                    <h3 className="font-semibold text-sm">
                      {language === 'ar' ? cat.name_ar : cat.name_en}
                    </h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses && featuredCourses.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">{t('courses.featured')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course: any) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-ocean/20 to-navy/20 flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Anchor className="h-16 w-16 text-ocean/30" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {course.discount_price && (
                      <Badge className="absolute top-3 start-3 bg-gold text-navy">
                        {language === 'ar' ? 'خصم' : 'Sale'}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {language === 'ar' ? (course.categories as any)?.name_ar : (course.categories as any)?.name_en}
                    </Badge>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {language === 'ar' ? course.title_ar : (course.title_en || course.title_ar)}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1">
                        {course.discount_price ? (
                          <>
                            <span className="font-bold text-ocean">${course.discount_price}</span>
                            <span className="text-sm text-muted-foreground line-through">${course.price}</span>
                          </>
                        ) : course.price > 0 ? (
                          <span className="font-bold text-ocean">${course.price}</span>
                        ) : (
                          <span className="font-bold text-ocean">{t('courses.free')}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {t(`courses.${course.level}` as any)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button variant="outline" size="lg" onClick={() => navigate('/courses')}>
                {t('courses.all')}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-ocean to-navy text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'ابدأ رحلتك البحرية اليوم' : 'Start Your Maritime Journey Today'}
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            {language === 'ar'
              ? 'انضم لآلاف الطلاب الذين يتعلمون العلوم البحرية من أفضل المحاضرين المتخصصين'
              : 'Join thousands of students learning maritime sciences from the best specialized instructors'}
          </p>
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-navy font-semibold" onClick={() => navigate('/auth?tab=signup')}>
            {t('nav.signup')}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
