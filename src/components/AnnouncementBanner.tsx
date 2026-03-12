import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  link?: string;
}

const announcements: Announcement[] = [
  {
    id: '1',
    message: '🚀 New Course Alert: Bridge Resource Management (BRM) Advanced is now available!',
    type: 'info',
    link: '/courses',
  },
];

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed-announcements') || '[]');
    } catch { return []; }
  });

  const visible = announcements.filter(a => !dismissed.includes(a.id));

  const dismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed-announcements', JSON.stringify(updated));
  };

  if (visible.length === 0) return null;

  const announcement = visible[0];
  const bgColor = announcement.type === 'warning' ? 'bg-accent/10 border-accent/20' :
    announcement.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
    'bg-primary/10 border-primary/20';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`border-b ${bgColor}`}
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
          <Megaphone className="w-4 h-4 text-primary shrink-0" />
          <span>{announcement.message}</span>
          {announcement.link && (
            <a href={announcement.link} className="text-primary font-medium hover:underline shrink-0">
              Learn more →
            </a>
          )}
          <button onClick={() => dismiss(announcement.id)} className="ml-2 text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
