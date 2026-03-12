import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video, Calendar, Clock, Users, MapPin, Globe,
  Play, Ticket, Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  duration_minutes: number | null;
  max_attendees: number;
  price: number;
  image_url: string | null;
  location: string | null;
  tags: string[];
  status: string;
  instructor_id: string | null;
  profiles?: { full_name: string };
  registration_count?: number;
}

const typeConfig: Record<string, { label: string; icon: typeof Video; color: string }> = {
  live_class: { label: 'Live Class', icon: Video, color: 'bg-red-500/10 text-red-400' },
  webinar: { label: 'Webinar', icon: Globe, color: 'bg-blue-500/10 text-blue-400' },
  in_person: { label: 'In-Person', icon: MapPin, color: 'bg-green-500/10 text-green-400' },
  recorded: { label: 'Recorded', icon: Play, color: 'bg-purple-500/10 text-purple-400' },
};

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'recorded'>('all');
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    const { data } = await db
      .from('events')
      .select('*, profiles(full_name)')
      .order('date', { ascending: true });

    if (data) {
      const eventsWithCounts = await Promise.all(
        (data as any[]).map(async (e: any) => {
          const { count } = await db
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', e.id)
            .eq('status', 'registered');
          return { ...e, registration_count: count || 0 };
        })
      );
      setEvents(eventsWithCounts);
    }
    setLoading(false);
  };

  const registerForEvent = async (eventId: string) => {
    if (!user) { toast({ title: 'Please sign in to register', variant: 'destructive' }); return; }
    setRegistering(eventId);
    const { error } = await db.from('event_registrations').insert({
      event_id: eventId,
      user_id: user.id,
    });
    setRegistering(null);
    if (error) {
      if (error.message.includes('duplicate')) {
        toast({ title: 'Already registered', description: 'You are already registered for this event.' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Registered!', description: 'You have been registered for this event.' });
      loadEvents();
    }
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Live <span className="gradient-text">Sessions</span> & Events
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join live workshops, webinars, and in-person training sessions with maritime experts.
            </p>
          </div>

          <div className="flex gap-2 justify-center mb-8 flex-wrap">
            {(['all', 'upcoming', 'live', 'recorded'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >{f === 'all' ? 'All Events' : f}</button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No events found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(event => {
                const tc = typeConfig[event.type] || typeConfig.live_class;
                const TypeIcon = tc.icon;
                const spotsLeft = event.max_attendees > 0 ? event.max_attendees - (event.registration_count || 0) : null;

                return (
                  <motion.div key={event.id} whileHover={{ y: -4 }}
                    className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/30 transition-all"
                  >
                    {event.image_url && (
                      <div className="relative h-44 overflow-hidden">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className={tc.color}><TypeIcon className="w-3 h-3 mr-1" /> {tc.label}</Badge>
                          {event.status === 'live' && <Badge className="bg-red-500 text-white animate-pulse">● LIVE</Badge>}
                        </div>
                        <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-lg font-bold text-sm">
                          {Number(event.price) > 0 ? `$${event.price}` : 'FREE'}
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-display font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                      <div className="space-y-2 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(event.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          {event.duration_minutes && <><Clock className="w-3.5 h-3.5 ml-2" /><span>{event.duration_minutes} min</span></>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          <span>{event.registration_count} attendees</span>
                          {spotsLeft !== null && spotsLeft > 0 && <span className="text-primary">· {spotsLeft} spots left</span>}
                          {spotsLeft !== null && spotsLeft <= 0 && <span className="text-destructive">· Sold out</span>}
                        </div>
                        {event.profiles && (
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5" /><span>{event.profiles.full_name}</span>
                          </div>
                        )}
                      </div>
                      {event.tags?.length > 0 && (
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {event.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                        </div>
                      )}
                      <Button
                        className="w-full bg-gradient-primary text-primary-foreground"
                        disabled={(spotsLeft !== null && spotsLeft <= 0) || registering === event.id}
                        onClick={() => registerForEvent(event.id)}
                      >
                        {registering === event.id ? 'Registering...' :
                          event.status === 'live' ? <><Play className="w-4 h-4 mr-2" /> Join Now</> :
                          event.status === 'recorded' ? <><Play className="w-4 h-4 mr-2" /> Watch Recording</> :
                          <><Ticket className="w-4 h-4 mr-2" /> Register</>}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
