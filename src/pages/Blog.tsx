import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Search, Clock, User, Heart, MessageSquare,
  TrendingUp, Calendar
} from 'lucide-react';
import { db } from '@/lib/supabaseAny';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category: string;
  featured: boolean;
  likes_count: number;
  views_count: number;
  read_time_minutes: number;
  published_at: string | null;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

const categories = ['All', 'Technology', 'Regulations', 'Environment', 'Career', 'Safety', 'General'];

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await db
      .from('blog_posts')
      .select('*, profiles(full_name, avatar_url)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    setPosts((data as unknown as Post[]) || []);
    setLoading(false);
  };

  const filtered = posts.filter(post => {
    const matchSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const featuredPost = posts.find(p => p.featured);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Maritime <span className="gradient-text">Knowledge</span> Hub
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Expert articles, industry updates, and career insights from certified maritime professionals.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search articles..." className="pl-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No articles found</p>
            </div>
          ) : (
            <>
              {featuredPost && selectedCategory === 'All' && !searchTerm && (
                <div className="block mb-10">
                  <motion.div whileHover={{ y: -4 }} className="relative rounded-2xl overflow-hidden bg-card border border-border group">
                    <div className="grid md:grid-cols-2 gap-0">
                      {featuredPost.image_url && (
                        <div className="h-64 md:h-auto">
                          <img src={featuredPost.image_url} alt={featuredPost.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-8 flex flex-col justify-center">
                        <Badge className="w-fit mb-4 bg-accent text-accent-foreground">
                          <TrendingUp className="w-3 h-3 mr-1" /> Featured
                        </Badge>
                        <h2 className="font-display text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{featuredPost.title}</h2>
                        <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{featuredPost.profiles?.full_name}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{featuredPost.read_time_minutes} min read</span>
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{featuredPost.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.filter(p => !p.featured || selectedCategory !== 'All' || searchTerm).map(post => (
                  <motion.div key={post.id} whileHover={{ y: -4 }}>
                    <div className="block bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/30 transition-all">
                      {post.image_url && (
                        <div className="h-48 overflow-hidden">
                          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5">
                        <Badge variant="secondary" className="mb-3 text-xs">{post.category}</Badge>
                        <h3 className="font-display font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes} min</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at || post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
