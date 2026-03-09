import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Anchor, PlayCircle } from 'lucide-react';

const Courses = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') || 'all');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      return data ?? [];
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', search, level, categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*, categories(name_ar, name_en, slug)')
        .eq('status', 'published');

      if (level !== 'all') query = query.eq('level', level as 'beginner' | 'intermediate' | 'advanced');
      if (categorySlug !== 'all') {
        const cat = categories?.find(c => c.slug === categorySlug);
        if (cat) query = query.eq('category_id', cat.id);
      }

      const { data } = await query.order('created_at', { ascending: false });
      
      if (search && data) {
        const s = search.toLowerCase();
        return data.filter((c: any) =>
          c.title_ar?.toLowerCase().includes(s) ||
          c.title_en?.toLowerCase().includes(s) ||
          c.description_ar?.toLowerCase().includes(s)
        );
      }
      return data ?? [];
    },
    enabled: !!categories,
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <h1 className="text-3xl font-bold mb-8">{t('courses.all')}</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('courses.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select value={categorySlug} onValueChange={setCategorySlug}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('categories.title')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'كل التصنيفات' : 'All Categories'}</SelectItem>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {language === 'ar' ? cat.name_ar : cat.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('courses.level')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'كل المستويات' : 'All Levels'}</SelectItem>
              <SelectItem value="beginner">{t('courses.beginner')}</SelectItem>
              <SelectItem value="intermediate">{t('courses.intermediate')}</SelectItem>
              <SelectItem value="advanced">{t('courses.advanced')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">{t('general.loading')}</div>
        ) : courses?.length === 0 ? (
          <div className="text-center py-20">
            <Anchor className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('courses.noCourses')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course: any) => (
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
                </div>
                <CardContent className="p-5">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {language === 'ar' ? (course.categories as any)?.name_ar : (course.categories as any)?.name_en}
                  </Badge>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    {language === 'ar' ? course.title_ar : (course.title_en || course.title_ar)}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {language === 'ar' ? course.description_ar : (course.description_en || course.description_ar)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      {course.discount_price ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ocean">${course.discount_price}</span>
                          <span className="text-sm text-muted-foreground line-through">${course.price}</span>
                        </div>
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
        )}
      </div>
    </div>
  );
};

export default Courses;
