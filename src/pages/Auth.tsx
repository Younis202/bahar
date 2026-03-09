import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Anchor, GraduationCap, BookOpen } from 'lucide-react';

const Auth = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [signupRole, setSignupRole] = useState<'student' | 'instructor'>('student');

  // Form state
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
      toast({ title: t('general.error'), description: error.message, variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, signup_role: signupRole },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: t('general.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: language === 'ar' ? 'تم إنشاء الحساب' : 'Account Created',
        description: t('auth.checkEmail'),
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-ocean/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ocean/10">
            <Anchor className="h-7 w-7 text-ocean" />
          </div>
          <CardTitle className="text-2xl">
            {language === 'ar' ? 'أكاديمية البحار' : 'Maritime Academy'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'منصتك التعليمية البحرية' : 'Your Maritime Learning Platform'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.password')}</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
                </div>
                <Button type="submit" className="w-full bg-ocean hover:bg-ocean-dark" disabled={loading}>
                  {loading ? t('general.loading') : t('auth.loginBtn')}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.noAccount')}{' '}
                  <button type="button" className="text-ocean hover:underline" onClick={() => setTab('signup')}>
                    {t('auth.signup')}
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSignupRole('student')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      signupRole === 'student' ? 'border-ocean bg-ocean/5' : 'border-border hover:border-ocean/40'
                    }`}
                  >
                    <GraduationCap className={`h-6 w-6 ${signupRole === 'student' ? 'text-ocean' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{t('auth.student')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('instructor')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      signupRole === 'instructor' ? 'border-ocean bg-ocean/5' : 'border-border hover:border-ocean/40'
                    }`}
                  >
                    <BookOpen className={`h-6 w-6 ${signupRole === 'instructor' ? 'text-ocean' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{t('auth.instructor')}</span>
                  </button>
                </div>

                {signupRole === 'instructor' && (
                  <p className="text-xs text-gold-foreground bg-gold/10 p-2 rounded-md">
                    {t('auth.instructorPending')}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                  <Input id="signup-name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" minLength={6} />
                </div>
                <Button type="submit" className="w-full bg-ocean hover:bg-ocean-dark" disabled={loading}>
                  {loading ? t('general.loading') : t('auth.signupBtn')}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.hasAccount')}{' '}
                  <button type="button" className="text-ocean hover:underline" onClick={() => setTab('login')}>
                    {t('auth.login')}
                  </button>
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
