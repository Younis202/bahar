import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Globe, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin, isInstructor, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">⚓</span>
          <span className="text-xl font-bold text-ocean">
            {language === 'ar' ? 'أكاديمية البحار' : 'Maritime Academy'}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.home')}
          </Link>
          <Link to="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.courses')}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  {t('nav.dashboard')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-courses')}>
                  {t('nav.myCourses')}
                </DropdownMenuItem>
                {isInstructor && (
                  <DropdownMenuItem onClick={() => navigate('/instructor')}>
                    {language === 'ar' ? 'لوحة المحاضر' : 'Instructor Panel'}
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    {language === 'ar' ? 'لوحة الأدمن' : 'Admin Panel'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 me-2" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                {t('nav.login')}
              </Button>
              <Button size="sm" className="bg-ocean hover:bg-ocean-dark" onClick={() => navigate('/auth?tab=signup')}>
                {t('nav.signup')}
              </Button>
            </div>
          )}

          {/* Language Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            title={language === 'ar' ? 'English' : 'العربية'}
          >
            <Globe className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
            <Globe className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <Link to="/" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
            {t('nav.home')}
          </Link>
          <Link to="/courses" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
            {t('nav.courses')}
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {t('nav.dashboard')}
              </Link>
              <button onClick={handleSignOut} className="block text-sm font-medium text-destructive">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {t('nav.login')}
              </Link>
              <Link to="/auth?tab=signup" className="block text-sm font-medium text-ocean" onClick={() => setMobileOpen(false)}>
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
