import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Anchor, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { signIn, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Sign In Failed', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
    // Navigation handled by useEffect above after profile loads
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
        <div className="absolute inset-0 flex flex-col justify-center p-16 relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Anchor className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">
              <span className="text-foreground">Bahria</span><span className="gradient-gold-text">Acad</span>
            </span>
          </Link>
          <h2 className="font-display text-4xl font-bold mb-4">Welcome back, Navigator</h2>
          <p className="text-muted-foreground text-lg mb-10">Continue your maritime education journey where you left off.</p>
          <div className="space-y-4">
            {[
              { icon: '🎓', text: 'Expert maritime courses' },
              { icon: '🛡️', text: 'DRM-protected HD video content' },
              { icon: '📜', text: 'Industry-recognized certifications' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-muted-foreground">
                <span className="text-xl">{icon}</span>
                <span>{text}</span>
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
            <h1 className="font-display text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="captain@bahriaacad.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">Create one free</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
