export type Language = 'ar' | 'en';

export const translations = {
  // Navigation
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.courses': { ar: 'الكورسات', en: 'Courses' },
  'nav.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'nav.signup': { ar: 'إنشاء حساب', en: 'Sign Up' },
  'nav.dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'nav.logout': { ar: 'تسجيل الخروج', en: 'Logout' },
  'nav.myCourses': { ar: 'كورساتي', en: 'My Courses' },
  'nav.profile': { ar: 'الملف الشخصي', en: 'Profile' },

  // Hero
  'hero.title': { ar: 'أكاديمية البحار', en: 'Maritime Academy' },
  'hero.subtitle': { ar: 'منصتك التعليمية المتخصصة في العلوم البحرية', en: 'Your Specialized Maritime Education Platform' },
  'hero.cta': { ar: 'تصفح الكورسات', en: 'Browse Courses' },
  'hero.cta2': { ar: 'سجّل كمحاضر', en: 'Become an Instructor' },

  // Categories
  'categories.title': { ar: 'التصنيفات', en: 'Categories' },
  'categories.subtitle': { ar: 'اختر المجال البحري الذي يناسبك', en: 'Choose your maritime specialty' },

  // Courses
  'courses.featured': { ar: 'كورسات مميزة', en: 'Featured Courses' },
  'courses.all': { ar: 'جميع الكورسات', en: 'All Courses' },
  'courses.search': { ar: 'ابحث عن كورس...', en: 'Search courses...' },
  'courses.level': { ar: 'المستوى', en: 'Level' },
  'courses.price': { ar: 'السعر', en: 'Price' },
  'courses.free': { ar: 'مجاني', en: 'Free' },
  'courses.enroll': { ar: 'اشترك الآن', en: 'Enroll Now' },
  'courses.students': { ar: 'طالب', en: 'students' },
  'courses.lessons': { ar: 'درس', en: 'lessons' },
  'courses.hours': { ar: 'ساعة', en: 'hours' },
  'courses.beginner': { ar: 'مبتدئ', en: 'Beginner' },
  'courses.intermediate': { ar: 'متوسط', en: 'Intermediate' },
  'courses.advanced': { ar: 'متقدم', en: 'Advanced' },
  'courses.whatYouLearn': { ar: 'ماذا ستتعلم', en: 'What You\'ll Learn' },
  'courses.requirements': { ar: 'المتطلبات', en: 'Requirements' },
  'courses.curriculum': { ar: 'محتوى الكورس', en: 'Course Curriculum' },
  'courses.reviews': { ar: 'التقييمات', en: 'Reviews' },
  'courses.instructor': { ar: 'المحاضر', en: 'Instructor' },
  'courses.noCourses': { ar: 'لا توجد كورسات حالياً', en: 'No courses available yet' },

  // Auth
  'auth.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'auth.signup': { ar: 'إنشاء حساب جديد', en: 'Create Account' },
  'auth.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'auth.password': { ar: 'كلمة المرور', en: 'Password' },
  'auth.confirmPassword': { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
  'auth.fullName': { ar: 'الاسم الكامل', en: 'Full Name' },
  'auth.loginBtn': { ar: 'دخول', en: 'Sign In' },
  'auth.signupBtn': { ar: 'إنشاء حساب', en: 'Sign Up' },
  'auth.noAccount': { ar: 'ليس لديك حساب؟', en: 'Don\'t have an account?' },
  'auth.hasAccount': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  'auth.forgotPassword': { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
  'auth.signupAs': { ar: 'سجّل كـ', en: 'Sign up as' },
  'auth.student': { ar: 'طالب', en: 'Student' },
  'auth.instructor': { ar: 'محاضر', en: 'Instructor' },
  'auth.instructorPending': { ar: 'سيتم مراجعة طلبك كمحاضر من قبل الإدارة', en: 'Your instructor application will be reviewed by admin' },
  'auth.checkEmail': { ar: 'تحقق من بريدك الإلكتروني لتأكيد حسابك', en: 'Check your email to confirm your account' },

  // Footer
  'footer.rights': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  'footer.about': { ar: 'عن المنصة', en: 'About' },
  'footer.contact': { ar: 'تواصل معنا', en: 'Contact Us' },
  'footer.terms': { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  'footer.privacy': { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },

  // General
  'general.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'general.error': { ar: 'حدث خطأ', en: 'An error occurred' },
  'general.save': { ar: 'حفظ', en: 'Save' },
  'general.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'general.delete': { ar: 'حذف', en: 'Delete' },
  'general.edit': { ar: 'تعديل', en: 'Edit' },
  'general.add': { ar: 'إضافة', en: 'Add' },
  'general.back': { ar: 'رجوع', en: 'Back' },
} as const;

export type TranslationKey = keyof typeof translations;
