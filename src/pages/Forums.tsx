import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessagesSquare, Search, Pin, MessageSquare, Eye,
  Clock, User, Plus, Bookmark, TrendingUp, ArrowUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { useToast } from '@/hooks/use-toast';

interface Topic {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  solved: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
  author_id: string;
  profiles?: { full_name: string; role: string };
  reply_count?: number;
}

const categories = ['All', 'Navigation', 'Engineering', 'Safety', 'Environment', 'Career', 'General'];

export default function Forums() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadTopics(); }, []);

  const loadTopics = async () => {
    setLoading(true);
    const { data } = await db
      .from('forum_topics')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false });

    if (data) {
      const topicsWithCounts = await Promise.all(
        (data as any[]).map(async (t: any) => {
          const { count } = await db
            .from('forum_replies')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', t.id);
          return { ...t, reply_count: count || 0 };
        })
      );
      setTopics(topicsWithCounts);
    }
    setLoading(false);
  };

  const createTopic = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    setCreating(true);
    const { error } = await db.from('forum_topics').insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      author_id: user.id,
    });
    setCreating(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Topic Created!' });
      setNewTitle(''); setNewContent('');
      loadTopics();
    }
  };

  const filtered = topics.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === 'popular') return b.views_count - a.views_count;
    if (sortBy === 'trending') return b.likes_count - a.likes_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalReplies = topics.reduce((s, t) => s + (t.reply_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <MessagesSquare className="w-7 h-7 text-primary" /> Community Forums
              </h1>
              <p className="text-muted-foreground mt-1">Discuss, learn, and connect with fellow maritime professionals</p>
            </div>
            {user && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" /> New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Create New Topic</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Topic title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <select
                      value={newCategory} onChange={e => setNewCategory(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Textarea placeholder="Write your discussion topic..." className="min-h-[150px]" value={newContent} onChange={e => setNewContent(e.target.value)} />
                    <Button className="w-full bg-gradient-primary text-primary-foreground" disabled={creating} onClick={createTopic}>
                      {creating ? 'Posting...' : 'Post Topic'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Topics', value: topics.length.toString(), icon: MessagesSquare },
              { label: 'Replies', value: totalReplies.toString(), icon: MessageSquare },
              { label: 'This Week', value: topics.filter(t => new Date(t.created_at) > new Date(Date.now() - 7 * 86400000)).length.toString(), icon: TrendingUp },
              { label: 'Solved', value: topics.filter(t => t.solved).length.toString(), icon: User },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="font-display text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search topics..." className="pl-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {(['recent', 'popular', 'trending'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`text-xs font-medium px-3 py-1 rounded-md transition-colors capitalize ${
                  sortBy === s ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >{s}</button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <MessagesSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No topics found. Be the first to start a discussion!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map(topic => (
                <motion.div key={topic.id} whileHover={{ x: 4 }}
                  className={`bg-card border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer ${topic.pinned ? 'border-accent/30' : 'border-border'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="hidden md:flex flex-col items-center gap-1 pt-1">
                      <ArrowUp className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                      <span className="text-sm font-bold">{topic.likes_count}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {topic.pinned && <Pin className="w-3.5 h-3.5 text-accent" />}
                        <Badge variant="secondary" className="text-xs">{topic.category}</Badge>
                        {topic.solved && <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">✓ Solved</Badge>}
                      </div>
                      <h3 className="font-semibold mb-1 hover:text-primary transition-colors">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{topic.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {topic.profiles?.full_name || 'Unknown'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(topic.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {topic.reply_count} replies</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {topic.views_count}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
