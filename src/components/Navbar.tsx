import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Menu, X, ChevronDown, BookOpen, LayoutDashboard, LogOut, User, Shield,
  Anchor, GraduationCap, PlusCircle, Briefcase, MessageSquare, Wallet,
  FileText, Calendar, MessagesSquare, Trophy, Tag, Headphones, Newspaper, Sun, Moon
} from 'lucide-react';

const navLinks = [
  { label: 'Courses', href: '/courses', icon: BookOpen },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Forums', href: '/forums', icon: MessagesSquare },
  { label: 'Blog', href: '/blog', icon: Newspaper },
  { label: 'Deals', href: '/deals', icon: Tag },
];

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardPath = profile?.role === 'admin' ? '/dashboard/admin'
    : profile?.role === 'instructor' ? '/dashboard/instructor'
    : '/dashboard/student';

  const logoHref = user ? dashboardPath : '/';
  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={logoHref} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Anchor className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              <span className="text-foreground">Bahria</span>
              <span className="gradient-gold-text">Acad</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <link.icon className="w-3.5 h-3.5" />{link.label}
              </Link>
            ))}
            {user && (profile?.role === 'instructor' || profile?.role === 'admin') && (
              <Link
                to="/instructor/create-course"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/instructor/create-course')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />Create
              </Link>
            )}
          </div>

          {/* Right section */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme} title="Toggle dark/light mode">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/messages')}>
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-9 px-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          profile?.full_name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <span className="text-sm font-medium max-w-[100px] truncate">{profile?.full_name}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" /> My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/assignments')}>
                      <FileText className="w-4 h-4 mr-2" /> Assignments
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wallet')}>
                      <Wallet className="w-4 h-4 mr-2" /> My Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/gamification')}>
                      <Trophy className="w-4 h-4 mr-2" /> Rewards
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/support')}>
                      <Headphones className="w-4 h-4 mr-2" /> Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {profile?.role === 'student' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/dashboard/student')}>
                          <GraduationCap className="w-4 h-4 mr-2" /> My Learning
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/become-instructor')}>
                          <Briefcase className="w-4 h-4 mr-2" /> Become Instructor
                        </DropdownMenuItem>
                      </>
                    )}
                    {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                      <DropdownMenuItem onClick={() => navigate('/instructor/create-course')}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Create Course
                      </DropdownMenuItem>
                    )}
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/dashboard/admin')}>
                        <Shield className="w-4 h-4 mr-2" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
                <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex items-center gap-2">
            {user && <NotificationBell />}
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link key={link.href} to={link.href}
                  className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <link.icon className="w-4 h-4" />{link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border flex flex-col gap-1">
                {user ? (
                  <>
                    <Link to={dashboardPath} className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/assignments" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                      <FileText className="w-4 h-4" /> Assignments
                    </Link>
                    <Link to="/messages" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                      <MessageSquare className="w-4 h-4" /> Messages
                    </Link>
                    <Link to="/wallet" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                      <Wallet className="w-4 h-4" /> Wallet
                    </Link>
                    <Link to="/gamification" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                      <Trophy className="w-4 h-4" /> Rewards
                    </Link>
                    <Link to="/support" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                      <Headphones className="w-4 h-4" /> Support
                    </Link>
                    <Link to="/profile" className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <button onClick={handleSignOut} className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 text-destructive hover:bg-destructive/10 text-left">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    <Link to="/register" className="px-4 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
