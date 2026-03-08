import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles?: { full_name: string; role: string };
  replies?: Comment[];
}

interface Props {
  lessonId: string;
}

export default function LessonComments({ lessonId }: Props) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => { loadComments(); }, [lessonId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('lesson_comments')
      .select('*, profiles(full_name, role)')
      .eq('lesson_id', lessonId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      // Load replies
      const withReplies = await Promise.all(data.map(async c => {
        const { data: replies } = await supabase
          .from('lesson_comments')
          .select('*, profiles(full_name, role)')
          .eq('parent_id', c.id)
          .order('created_at');
        return { ...c, replies: replies || [] };
      }));
      setComments(withReplies);
    }
  };

  const handleSubmit = async (parentId?: string) => {
    const text = parentId ? replyText : newComment;
    if (!text.trim() || !user) return;
    setSubmitting(true);
    try {
      await supabase.from('lesson_comments').insert({
        lesson_id: lessonId,
        user_id: user.id,
        content: text.trim(),
        parent_id: parentId || null,
      });
      if (parentId) { setReplyText(''); setReplyTo(null); }
      else setNewComment('');
      loadComments();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = (role: string) => {
    if (role === 'instructor') return <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Instructor</span>;
    if (role === 'admin') return <span className="text-xs bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">Admin</span>;
    return null;
  };

  const CommentItem = ({ c, isReply = false }: { c: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-8 mt-2' : ''}`}>
      <div className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 mt-0.5`}>
        {(c.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{(c.profiles as any)?.full_name || 'Unknown'}</span>
          {roleLabel((c.profiles as any)?.role)}
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{c.content}</p>
        {user && !isReply && (
          <button
            onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1.5 transition-colors"
          >
            <Reply className="w-3 h-3" /> Reply
          </button>
        )}
        {replyTo === c.id && (
          <div className="mt-2 flex gap-2">
            <Textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="bg-background text-xs resize-none flex-1"
            />
            <Button size="sm" onClick={() => handleSubmit(c.id)} disabled={submitting} className="self-end">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        {(c.replies as Comment[])?.map(r => <CommentItem key={r.id} c={r} isReply />)}
      </div>
    </div>
  );

  return (
    <div className="mt-8 border-t border-border pt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 font-display font-bold text-lg mb-4 hover:text-primary transition-colors"
      >
        <MessageSquare className="w-5 h-5" />
        Discussion ({comments.length})
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* New Comment */}
          {user ? (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Ask a question or share a thought..."
                  rows={3}
                  className="bg-card resize-none mb-2"
                />
                <Button
                  size="sm"
                  onClick={() => handleSubmit()}
                  disabled={submitting || !newComment.trim()}
                  className="bg-gradient-primary text-primary-foreground"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Post
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">Login to join the discussion.</p>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No questions yet. Be the first to ask!</p>
            ) : (
              comments.map(c => <CommentItem key={c.id} c={c} />)
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
