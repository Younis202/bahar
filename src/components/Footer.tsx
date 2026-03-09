import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="border-t bg-navy text-navy-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚓</span>
              <span className="text-xl font-bold">
                {language === 'ar' ? 'أكاديمية البحار' : 'Maritime Academy'}
              </span>
            </div>
            <p className="text-sm text-navy-foreground/70">
              {language === 'ar'
                ? 'منصة تعليمية متخصصة في العلوم البحرية، تقدم كورسات احترافية من أفضل المحاضرين.'
                : 'A specialized maritime education platform offering professional courses from top instructors.'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">{language === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h3>
            <ul className="space-y-2 text-sm text-navy-foreground/70">
              <li><Link to="/courses" className="hover:text-navy-foreground transition-colors">{t('nav.courses')}</Link></li>
              <li><Link to="/auth" className="hover:text-navy-foreground transition-colors">{t('nav.login')}</Link></li>
              <li><Link to="/auth?tab=signup" className="hover:text-navy-foreground transition-colors">{t('nav.signup')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-2 text-sm text-navy-foreground/70">
              <li>info@maritime-academy.com</li>
              <li>{language === 'ar' ? 'سوريا - الأردن' : 'Syria - Jordan'}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-foreground/10 mt-8 pt-8 text-center text-sm text-navy-foreground/50">
          © {new Date().getFullYear()} Maritime Academy. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
