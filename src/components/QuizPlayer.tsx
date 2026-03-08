import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle, XCircle, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface Props {
  lessonId: string;
  onComplete?: (passed: boolean, score: number) => void;
}

type QuizState = 'intro' | 'active' | 'result';

export default function QuizPlayer({ lessonId, onComplete }: Props) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [state, setState] = useState<QuizState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previousAttempt, setPreviousAttempt] = useState<any>(null);

  useEffect(() => { loadQuiz(); }, [lessonId]);

  const loadQuiz = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index');

    if (data) {
      setQuestions(data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
      })));
    }

    if (user) {
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (attempt) setPreviousAttempt(attempt);
    }
    setLoading(false);
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return; // Already answered
    setSelected(idx);
    setAnswers(prev => ({ ...prev, [questions[currentQ].id]: idx }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(p => p + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const score = questions.filter(q => answers[q.id] === q.correct_answer).length;
    const passed = score >= Math.ceil(questions.length * 0.7);
    setState('result');

    if (user) {
      await supabase.from('quiz_attempts').insert({
        lesson_id: lessonId,
        student_id: user.id,
        answers,
        score,
        total_questions: questions.length,
        passed,
      });
    }
    onComplete?.(passed, score);
  };

  const restart = () => {
    setCurrentQ(0);
    setSelected(null);
    setAnswers({});
    setShowExplanation(false);
    setState('active');
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (questions.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>No quiz questions added yet.</p>
    </div>
  );

  const score = questions.filter(q => answers[q.id] === q.correct_answer).length;
  const passed = score >= Math.ceil(questions.length * 0.7);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Intro */}
      {state === 'intro' && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Lesson Quiz</h3>
          <p className="text-muted-foreground text-sm mb-4">{questions.length} questions • Pass score: 70%</p>
          {previousAttempt && (
            <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg mb-4 ${previousAttempt.passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {previousAttempt.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              Last attempt: {previousAttempt.score}/{previousAttempt.total_questions}
              {previousAttempt.passed ? ' (Passed ✓)' : ' (Failed)'}
            </div>
          )}
          <Button onClick={() => setState('active')} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {previousAttempt ? 'Retake Quiz' : 'Start Quiz'} →
          </Button>
        </div>
      )}

      {/* Active */}
      {state === 'active' && (
        <div className="p-6">
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${
                  i < currentQ ? 'bg-primary' :
                  i === currentQ ? 'bg-primary/60' : 'bg-secondary'
                }`} />
              ))}
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h4 className="font-display font-semibold text-lg mb-5">{questions[currentQ].question}</h4>

              <div className="space-y-3 mb-5">
                {questions[currentQ].options.map((opt, idx) => {
                  const isCorrect = idx === questions[currentQ].correct_answer;
                  const isSelected = idx === selected;
                  let style = 'border-border bg-background hover:border-primary/40 hover:bg-secondary/20';
                  if (selected !== null) {
                    if (isCorrect) style = 'border-green-500 bg-green-500/10 text-green-300';
                    else if (isSelected) style = 'border-red-500 bg-red-500/10 text-red-300';
                    else style = 'border-border bg-background opacity-50';
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selected !== null}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition-all ${style}`}
                    >
                      <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                        selected !== null && isCorrect ? 'border-green-500 text-green-400' :
                        selected !== null && isSelected && !isCorrect ? 'border-red-500 text-red-400' :
                        'border-muted-foreground/40 text-muted-foreground'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                      {selected !== null && isCorrect && <CheckCircle className="w-4 h-4 text-green-400 ml-auto shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && questions[currentQ].explanation && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground mb-4"
                >
                  <span className="font-semibold text-foreground">💡 Explanation: </span>
                  {questions[currentQ].explanation}
                </motion.div>
              )}

              {selected !== null && (
                <Button onClick={handleNext} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {currentQ < questions.length - 1 ? (
                    <><ArrowRight className="w-4 h-4 mr-2" /> Next Question</>
                  ) : (
                    <>Finish Quiz</>
                  )}
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Result */}
      {state === 'result' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {passed ? <Trophy className="w-10 h-10 text-gold" /> : <XCircle className="w-10 h-10 text-red-400" />}
          </div>
          <h3 className="font-display text-2xl font-bold mb-2">{passed ? '🎉 Passed!' : 'Not quite there'}</h3>
          <p className="text-4xl font-bold mb-1 text-primary">{score}/{questions.length}</p>
          <p className="text-muted-foreground text-sm mb-6">
            {Math.round((score / questions.length) * 100)}% correct • {passed ? 'You passed (70% required)' : 'You need 70% to pass'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={restart}>
              <RotateCcw className="w-4 h-4 mr-2" /> Retake
            </Button>
            {passed && (
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                Continue Learning <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
