import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Upload, Clock, CheckCircle, AlertCircle,
  Download, MessageSquare, Calendar, Send, Paperclip
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_attempts: number;
  max_score: number;
  sample_file_url: string | null;
  course_id: string;
  courses?: { title: string } | null;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Send },
  graded: { label: 'Graded', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle },
  revision: { label: 'Needs Revision', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: AlertCircle },
};

export default function Assignments() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'revision'>('all');
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: assignData } = await db
      .from('assignments')
      .select('*, courses(title)')
      .order('created_at', { ascending: false });

    const { data: subData } = await db
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', user!.id);

    setAssignments((assignData as unknown as Assignment[]) || []);
    setSubmissions((subData as unknown as Submission[]) || []);
    setLoading(false);
  };

  const getStatus = (a: Assignment) => {
    const sub = submissions.find(s => s.assignment_id === a.id);
    if (!sub) return 'pending';
    return sub.status;
  };

  const getSubmission = (a: Assignment) => submissions.find(s => s.assignment_id === a.id);
  const getAttempts = (a: Assignment) => submissions.filter(s => s.assignment_id === a.id).length;

  const handleSubmit = async (assignmentId: string) => {
    if (!submissionText.trim()) return;
    setSubmitting(true);
    const { error } = await db.from('assignment_submissions').insert({
      assignment_id: assignmentId,
      student_id: user!.id,
      content: submissionText,
      status: 'submitted',
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Submitted!', description: 'Your assignment has been submitted.' });
      setSubmissionText('');
      loadData();
    }
  };

  const filtered = filter === 'all' ? assignments : assignments.filter(a => getStatus(a) === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <FileText className="w-7 h-7 text-primary" />
                Assignments
              </h1>
              <p className="text-muted-foreground mt-1">Track and submit your course assignments</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'pending', 'submitted', 'graded', 'revision'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                  filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? `All (${assignments.length})` : `${statusConfig[f]?.label || f} (${assignments.filter(a => getStatus(a) === f).length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No assignments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(assignment => {
                const status = getStatus(assignment);
                const config = statusConfig[status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const sub = getSubmission(assignment);
                const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && status === 'pending';

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-card border rounded-xl p-5 hover:border-primary/30 transition-all ${isOverdue ? 'border-destructive/30' : 'border-border'}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display font-semibold text-lg">{assignment.title}</h3>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{assignment.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> {assignment.courses?.title || 'Course'}
                          </span>
                          {assignment.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Upload className="w-3.5 h-3.5" /> {getAttempts(assignment)}/{assignment.max_attempts} attempts
                          </span>
                          {sub?.score != null && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              Score: {sub.score}/{assignment.max_score}
                            </span>
                          )}
                        </div>
                        {sub?.feedback && (
                          <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Instructor Feedback
                            </p>
                            <p className="text-sm">{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {(status === 'pending' || status === 'revision') && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                                <Upload className="w-3.5 h-3.5 mr-1" /> Submit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Submit: {assignment.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Write your answer or notes here..."
                                  value={submissionText}
                                  onChange={e => setSubmissionText(e.target.value)}
                                  className="min-h-[150px]"
                                />
                                <Button
                                  className="w-full bg-gradient-primary text-primary-foreground"
                                  disabled={submitting || !submissionText.trim()}
                                  onClick={() => handleSubmit(assignment.id)}
                                >
                                  <Send className="w-4 h-4 mr-2" /> {submitting ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
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
