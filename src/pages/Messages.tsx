import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare, Search, Send, Paperclip, MoreVertical, Check, CheckCheck, Plus, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  updated_at: string;
  participants: { user_id: string; profiles?: { full_name: string; avatar_url: string | null; role: string } }[];
  lastMessage?: { content: string; created_at: string; read: boolean };
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConvoId) loadMessages(selectedConvoId);
  }, [selectedConvoId]);

  const loadConversations = async () => {
    setLoading(true);
    const { data: participations } = await db
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user!.id);

    if (!participations?.length) { setLoading(false); return; }

    const convoIds = participations.map((p: any) => p.conversation_id);
    const convos: Conversation[] = [];

    for (const cid of convoIds) {
      const { data: parts } = await db
        .from('conversation_participants')
        .select('user_id, profiles(full_name, avatar_url, role)')
        .eq('conversation_id', cid);

      const { data: msgs } = await db
        .from('messages')
        .select('*')
        .eq('conversation_id', cid)
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await db
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', cid)
        .eq('read', false)
        .neq('sender_id', user!.id);

      convos.push({
        id: cid,
        updated_at: (msgs?.[0] as any)?.created_at || '',
        participants: (parts as any) || [],
        lastMessage: msgs?.[0] as any,
        unreadCount: count || 0,
      });
    }

    convos.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setConversations(convos);
    setLoading(false);
  };

  const loadMessages = async (convoId: string) => {
    const { data } = await db
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    setMessages((data as unknown as Message[]) || []);

    await db
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convoId)
      .neq('sender_id', user!.id)
      .eq('read', false);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConvoId) return;
    const { error } = await db.from('messages').insert({
      conversation_id: selectedConvoId,
      sender_id: user!.id,
      content: messageText.trim(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setMessageText('');
      loadMessages(selectedConvoId);
      loadConversations();
    }
  };

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);
  const otherParticipant = selectedConvo?.participants.find(p => p.user_id !== user?.id);
  const otherName = otherParticipant?.profiles?.full_name || 'Unknown';

  const filteredConvos = conversations.filter(c => {
    const other = c.participants.find(p => p.user_id !== user?.id);
    return other?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden h-[calc(100vh-8rem)]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-e border-border flex flex-col ${!showMobileList ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-border">
                <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-primary" /> Messages
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-10 h-9" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : filteredConvos.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">No conversations yet</div>
                ) : filteredConvos.map(convo => {
                  const other = convo.participants.find(p => p.user_id !== user?.id);
                  return (
                    <button
                      key={convo.id}
                      onClick={() => { setSelectedConvoId(convo.id); setShowMobileList(false); }}
                      className={`w-full flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border/30 text-left ${
                        selectedConvoId === convo.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                        {other?.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold truncate">{other?.profiles?.full_name || 'Unknown'}</h3>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {convo.lastMessage ? new Date(convo.lastMessage.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {convo.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {convo.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
                          {convo.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
              {selectedConvoId ? (
                <>
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setShowMobileList(true)}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {otherName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{otherName}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{otherParticipant?.profiles?.role || ''}</p>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 max-w-3xl mx-auto">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary rounded-bl-md'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${msg.sender_id === user?.id ? 'justify-end' : ''}`}>
                              <span className={`text-xs ${msg.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.sender_id === user?.id && (
                                msg.read ? <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/60" /> : <Check className="w-3.5 h-3.5 text-primary-foreground/60" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-border">
                    <div className="flex items-end gap-2 max-w-3xl mx-auto">
                      <Textarea
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[42px] max-h-[120px] resize-none"
                        rows={1}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      />
                      <Button size="icon" className="h-10 w-10 shrink-0 bg-gradient-primary text-primary-foreground" disabled={!messageText.trim()} onClick={sendMessage}>
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
