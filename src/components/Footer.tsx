import { Link } from 'react-router-dom';
import { Anchor, Mail, Phone, MapPin, Youtube, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-mid border-t border-border/50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Anchor className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                <span className="text-foreground">Bahria</span>
                <span className="gradient-gold-text">Acad</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              The premier maritime education platform for Gulf region professionals. Learn from certified captains and marine engineers.
            </p>
            <div className="flex gap-3">
              {[Youtube, Linkedin, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Courses</h4>
            <ul className="space-y-3">
              {['Navigation Systems', 'Marine Engineering', 'Maritime Safety', 'Port Operations', 'Bridge Management', 'Environmental Compliance'].map(item => (
                <li key={item}>
                  <Link to="/courses" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {[['About Us', '/about'], ['Our Instructors', '/instructors'], ['Careers', '#'], ['Press', '#'], ['Blog', '#'], ['Privacy Policy', '#']].map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Manama, Kingdom of Bahrain</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:info@bahriaacad.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">info@bahriaacad.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">+973 17 000 000</span>
              </li>
            </ul>
            <div className="mt-6 p-3 rounded-lg bg-secondary border border-border">
              <p className="text-xs text-muted-foreground">🌊 Serving maritime professionals across the Gulf region since 2020</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2025 BahriaAcad. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
