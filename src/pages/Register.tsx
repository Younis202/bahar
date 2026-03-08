import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Anchor, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roles: { value: UserRole; label: string; desc: string; emoji: string }[] = [
  { value: 'student', label: 'Student', desc: 'Enroll in courses & earn certificates', emoji: '🎓' },
  { value: 'instructor', label: 'Instructor', desc: 'Create and sell maritime courses', emoji: '👨‍🏫' },
];

export default function Register() {
  const { signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      const path = profile.role === 'admin' ? '/dashboard/admin'
        : profile.role === 'instructor' ? '/dashboard/instructor'
        : '/dashboard/student';
      navigate(path, { replace: true });
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    if (error) {
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      toast({ title: '🎉 Account Created!', description: 'Welcome to BahriaAcad! Logging you in...' });
      // Navigation handled by useEffect after profile loads
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/20" />
        <div className="absolute inset-0 flex flex-col justify-center p-16 relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Anchor className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">
              <span className="text-foreground">Bahria</span><span className="gradient-gold-text">Acad</span>
            </span>
          </Link>
          <h2 className="font-display text-4xl font-bold mb-4">Begin Your Journey</h2>
          <p className="text-muted-foreground text-lg mb-10">Join the leading maritime education community in the Gulf.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '12k+', label: 'Active students' },
              { num: '85+', label: 'Expert courses' },
              { num: '18+', label: 'Instructors' },
              { num: '4.9', label: 'Avg. rating' },
            ].map(({ num, label }) => (
              <div key={label} className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="font-display text-2xl font-bold gradient-text">{num}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Anchor className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              <span className="text-foreground">Bahria</span><span className="gradient-gold-text">Acad</span>
            </span>
          </Link>

          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join the maritime education revolution</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === r.value
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className="text-2xl block mb-1">{r.emoji}</span>
                <span className="font-semibold text-sm text-foreground block">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Capt. Ahmed Al-Rashidi" className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ahmed@example.com" className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className="pl-10 pr-10" required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow mt-2" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By registering, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
