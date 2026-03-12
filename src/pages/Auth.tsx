import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Anchor, GraduationCap, BookOpen } from 'lucide-react';

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [signupRole, setSignupRole] = useState<'student' | 'instructor'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, signup_role: signupRole },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account Created', description: 'Check your email to confirm your account' });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Anchor className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Maritime Academy</CardTitle>
          <CardDescription>Your Maritime Learning Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button type="button" className="text-primary hover:underline" onClick={() => setTab('signup')}>Sign Up</button>
                </p>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setSignupRole('student')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${signupRole === 'student' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <GraduationCap className={`h-6 w-6 ${signupRole === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Student</span>
                  </button>
                  <button type="button" onClick={() => setSignupRole('instructor')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${signupRole === 'instructor' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <BookOpen className={`h-6 w-6 ${signupRole === 'instructor' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Instructor</span>
                  </button>
                </div>
                {signupRole === 'instructor' && (
                  <p className="text-xs text-accent bg-accent/10 p-2 rounded-md">Your instructor application will be reviewed by admin</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button type="button" className="text-primary hover:underline" onClick={() => setTab('login')}>Login</button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
