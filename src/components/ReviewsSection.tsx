import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

interface Props {
  courseId: string;
  isEnrolled: boolean;
}

export default function ReviewsSection({ courseId, isEnrolled }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => { loadReviews(); }, [courseId]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) {
      setReviews(data);
      if (user) {
        const mine = data.find(r => r.user_id === user.id);
        if (mine) { setUserReview(mine); setRating(mine.rating); setComment(mine.comment || ''); }
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      if (userReview) {
        await supabase.from('reviews').update({ rating, comment }).eq('id', userReview.id);
        toast({ title: '✅ تم تحديث تقييمك' });
      } else {
        await supabase.from('reviews').insert({ course_id: courseId, user_id: user.id, rating, comment });
        toast({ title: '⭐ تم إضافة تقييمك' });
      }
      setShowForm(false);
      loadReviews();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;
    await supabase.from('reviews').delete().eq('id', userReview.id);
    setUserReview(null);
    setShowForm(false);
    toast({ title: 'تم حذف تقييمك' });
    loadReviews();
  };

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-2xl font-bold">
          Student Reviews
          <span className="text-muted-foreground text-base font-normal ml-2">({reviews.length})</span>
        </h2>
        {avgRating !== '—' && (
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-bold text-gold">{avgRating}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-gold text-gold' : 'text-muted'}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Write Review Button */}
      {isEnrolled && user && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-5 p-4 rounded-xl border border-dashed border-primary/30 text-primary text-sm hover:bg-primary/5 transition-colors"
        >
          {userReview ? '✏️ Edit Your Review' : '⭐ Write a Review'}
        </button>
      )}

      {/* Review Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-5 mb-5"
        >
          <h3 className="font-semibold mb-4">{userReview ? 'Edit Review' : 'Write a Review'}</h3>
          {/* Star Rating */}
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
              >
                <Star className={`w-7 h-7 transition-colors ${s <= (hoverRating || rating) ? 'fill-gold text-gold' : 'text-muted-foreground'}`} />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground self-center">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || rating]}
            </span>
          </div>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience with this course..."
            rows={3}
            className="bg-background resize-none mb-4"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            {userReview && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            )}
            <Button size="sm" className="bg-gradient-primary text-primary-foreground ml-auto" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {(review.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{(review.profiles as any)?.full_name || 'Anonymous'}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-gold text-gold' : 'text-muted'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {user && review.user_id === user.id && (
                      <button onClick={() => setShowForm(true)} className="text-muted-foreground hover:text-primary">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
