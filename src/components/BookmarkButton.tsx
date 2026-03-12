import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { useToast } from '@/hooks/use-toast';

interface Props {
  courseId: string;
  size?: 'sm' | 'md';
  variant?: 'icon' | 'button';
}

export default function BookmarkButton({ courseId, size = 'md', variant = 'icon' }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) checkBookmark();
  }, [user, courseId]);

  const checkBookmark = async () => {
    const { data } = await db
      .from('bookmarks')
      .select('id')
      .eq('user_id', user!.id)
      .eq('course_id', courseId)
      .maybeSingle();
    setBookmarked(!!data);
  };

  const toggle = async () => {
    if (!user) {
      toast({ title: 'Please log in to bookmark courses', variant: 'destructive' });
      return;
    }
    setLoading(true);
    if (bookmarked) {
      await db.from('bookmarks').delete().eq('user_id', user.id).eq('course_id', courseId);
      setBookmarked(false);
      toast({ title: 'Bookmark removed' });
    } else {
      await db.from('bookmarks').insert({ user_id: user.id, course_id: courseId });
      setBookmarked(true);
      toast({ title: '🔖 Course bookmarked!' });
    }
    setLoading(false);
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={loading}
        className={bookmarked ? 'border-primary/40 text-primary' : ''}
      >
        {bookmarked ? (
          <BookmarkCheck className={`${iconSize} mr-2`} />
        ) : (
          <Bookmark className={`${iconSize} mr-2`} />
        )}
        {bookmarked ? 'Bookmarked' : 'Bookmark'}
      </Button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        bookmarked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
    >
      {bookmarked ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
    </button>
  );
}
