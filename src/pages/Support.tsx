import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Headphones, Plus, Clock, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Send, Tag
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  subject: string;
  department: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  content: string;
  is_staff: boolean;
  created_at: string;
  sender_id: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  high: { label: 'High', color: 'text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400' },
};

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', department: '', priority: '', message: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (user) loadTickets(); }, [user]);

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await db
      .from('support_tickets')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setTickets((data as unknown as Ticket[]) || []);
    setLoading(false);
  };

  const loadTicketMessages = async (ticketId: string) => {
    const { data } = await db
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setTicketMessages(prev => ({ ...prev, [ticketId]: (data as unknown as TicketMessage[]) || [] }));
  };

  const toggleTicket = (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
      if (!ticketMessages[ticketId]) loadTicketMessages(ticketId);
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message || !newTicket.department) return;
    setCreating(true);

    const { data: ticketData, error: ticketError } = await db
      .from('support_tickets')
      .insert({
        user_id: user!.id,
        subject: newTicket.subject,
        department: newTicket.department,
        priority: newTicket.priority || 'medium',
      })
      .select()
      .single();

    if (ticketError) {
      toast({ title: 'Error', description: ticketError.message, variant: 'destructive' });
      setCreating(false);
      return;
    }

    await db.from('ticket_messages').insert({
      ticket_id: (ticketData as any).id,
      sender_id: user!.id,
      content: newTicket.message,
    });

    setCreating(false);
    toast({ title: 'Ticket Created', description: 'Our support team will respond shortly.' });
    setNewTicket({ subject: '', department: '', priority: '', message: '' });
    loadTickets();
  };

  const sendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    const { error } = await db.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_id: user!.id,
      content: replyText.trim(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setReplyText('');
      loadTicketMessages(ticketId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Headphones className="w-7 h-7 text-primary" /> Support Center
              </h1>
              <p className="text-muted-foreground mt-1">Get help from our support team</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" /> New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Subject" value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select onValueChange={v => setNewTicket({ ...newTicket, department: v })}>
                      <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={v => setNewTicket({ ...newTicket, priority: v })}>
                      <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea placeholder="Describe your issue..." value={newTicket.message} onChange={e => setNewTicket({ ...newTicket, message: e.target.value })} className="min-h-[120px]" />
                  <Button className="w-full bg-gradient-primary text-primary-foreground" disabled={creating} onClick={createTicket}>
                    <Send className="w-4 h-4 mr-2" /> {creating ? 'Creating...' : 'Submit Ticket'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Open Tickets', count: tickets.filter(t => t.status === 'open').length, icon: AlertCircle, color: 'text-yellow-400' },
              { label: 'In Progress', count: tickets.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'text-blue-400' },
              { label: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length, icon: CheckCircle, color: 'text-green-400' },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <div>
                  <p className="font-display text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Headphones className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No support tickets yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const sc = statusConfig[ticket.status] || statusConfig.open;
                const pc = priorityConfig[ticket.priority] || priorityConfig.medium;
                const isExpanded = expandedTicket === ticket.id;
                const msgs = ticketMessages[ticket.id] || [];

                return (
                  <div key={ticket.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                    <button onClick={() => toggleTicket(ticket.id)} className="w-full p-5 flex items-center gap-4 text-left">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge variant="outline" className={sc.color}>{sc.label}</Badge>
                          <span className={`text-xs font-medium ${pc.color}`}>● {pc.label}</span>
                        </div>
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span><Tag className="w-3 h-3 inline mr-1" />{ticket.department}</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-border pt-4">
                        <div className="space-y-4 mb-4">
                          {msgs.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                                msg.sender_id === user?.id ? 'bg-primary/10 border border-primary/20' : 'bg-secondary'
                              }`}>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {msg.is_staff ? 'Support Team' : 'You'} · {new Date(msg.created_at).toLocaleString()}
                                </p>
                                <p className="text-sm">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <div className="flex gap-2">
                            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." className="min-h-[60px]" />
                            <Button className="shrink-0 bg-gradient-primary text-primary-foreground" onClick={() => sendReply(ticket.id)}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
