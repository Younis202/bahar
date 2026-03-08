import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, Star, Clock, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const levels = ['All Levels', 'beginner', 'intermediate', 'advanced'];
const sortOptions = [
  { label: 'Most Popular', value: 'students_count' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Newest', value: 'created_at' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

const levelColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  advanced: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function Courses() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [sortBy, setSortBy] = useState('students_count');
  const [showFilters, setShowFilters] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: coursesData }, { data: catsData }] = await Promise.all([
      supabase
        .from('courses')
        .select('*, profiles(full_name, avatar_url), categories(name, icon, slug)')
        .eq('status', 'published')
        .order('students_count', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (coursesData) setCourses(coursesData);
    if (catsData) setCategories(catsData);
    setLoading(false);
  };

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.title?.toLowerCase().includes(q) ||
      c.short_description?.toLowerCase().includes(q);
    const matchCategory = selectedCategory === 'all' || c.category_id === selectedCategory;
    const matchLevel = selectedLevel === 'All Levels' || c.level === selectedLevel;
    return matchSearch && matchCategory && matchLevel;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return (b.students_count || 0) - (a.students_count || 0);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="py-12 bg-navy-mid/40 border-b border-border">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-4xl font-bold mb-2">Maritime Courses</h1>
            <p className="text-muted-foreground mb-6">{filtered.length} courses available</p>
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="pl-10"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {(selectedCategory !== 'all' || selectedLevel !== 'All Levels') && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {[selectedCategory !== 'all', selectedLevel !== 'All Levels'].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`w-64 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="font-display font-semibold text-foreground mb-3">Category</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === 'all' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <span>{cat.icon} {cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display font-semibold text-foreground mb-3">Level</h3>
                <div className="space-y-1">
                  {levels.map(level => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                        selectedLevel === level ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      {level === 'All Levels' ? level : level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedCategory !== 'all' || selectedLevel !== 'All Levels') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => { setSelectedCategory('all'); setSelectedLevel('All Levels'); }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Course Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">{filtered.length} results</p>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-card border border-border rounded-xl h-80 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-display text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {courses.length === 0 ? 'No published courses yet. Check back soon!' : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filtered.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/courses/${course.id}`} className="block group">
                      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-card transition-all duration-300">
                        <div className="relative aspect-video">
                          <img
                            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=340&fit=crop'}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {course.original_price && course.original_price > course.price && (
                            <div className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-md">
                              {Math.round((1 - course.price / course.original_price) * 100)}% OFF
                            </div>
                          )}
                          {course.level && (
                            <div className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-md border ${levelColors[course.level] || 'bg-secondary text-muted-foreground'}`}>
                              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          {course.categories && (
                            <p className="text-xs text-primary font-medium mb-1.5">{course.categories.icon} {course.categories.name}</p>
                          )}
                          <h3 className="font-display font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          {course.profiles && (
                            <p className="text-xs text-muted-foreground mb-2">by {course.profiles.full_name}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            {course.rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-gold fill-gold" />
                                <span className="text-foreground font-medium">{Number(course.rating).toFixed(1)}</span>
                                {course.rating_count > 0 && <span>({course.rating_count})</span>}
                              </span>
                            )}
                            {course.students_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {course.students_count.toLocaleString()}
                              </span>
                            )}
                            {course.duration_hours > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.duration_hours}h
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="font-display font-bold text-lg text-foreground">
                                {course.price === 0 ? 'Free' : `$${course.price}`}
                              </span>
                              {course.original_price && course.original_price > course.price && (
                                <span className="text-xs text-muted-foreground line-through">${course.original_price}</span>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">{course.language || 'Arabic'}</Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
