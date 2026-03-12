
-- =============================================
-- BASE TABLES (existing schema)
-- =============================================

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);

-- Courses
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  trailer_bunny_id TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  category_id UUID REFERENCES public.categories(id),
  level TEXT DEFAULT 'beginner',
  language TEXT DEFAULT 'en',
  price DECIMAL(10,2) DEFAULT 0,
  original_price DECIMAL(10,2),
  duration_hours DECIMAL(5,1),
  status TEXT DEFAULT 'draft',
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  students_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published courses viewable by everyone" ON public.courses FOR SELECT USING (status = 'published');
CREATE POLICY "Instructors see own courses" ON public.courses FOR SELECT TO authenticated USING (instructor_id = auth.uid());
CREATE POLICY "Instructors create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (instructor_id = auth.uid());
CREATE POLICY "Instructors update own courses" ON public.courses FOR UPDATE TO authenticated USING (instructor_id = auth.uid());
CREATE POLICY "Instructors delete own courses" ON public.courses FOR DELETE TO authenticated USING (instructor_id = auth.uid());

-- Sections
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sections viewable by everyone" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Instructors manage sections" ON public.sections FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Lessons
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT DEFAULT 'video',
  bunny_video_id TEXT,
  duration_minutes INT,
  order_index INT NOT NULL DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons viewable by everyone" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Instructors manage lessons" ON public.lessons FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sections s JOIN public.courses c ON s.course_id = c.id WHERE s.id = section_id AND c.instructor_id = auth.uid())
);

-- Enrollments
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  progress DECIMAL(5,2) DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students can enroll" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own enrollments" ON public.enrollments FOR UPDATE TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Instructors see course enrollments" ON public.enrollments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Lesson Progress
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  watch_time_seconds INT DEFAULT 0,
  UNIQUE(student_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own progress" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students update own progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update progress" ON public.lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = student_id);

-- Reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Students create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System creates notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Certificates
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  certificate_number TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "System creates certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Quiz Questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INT NOT NULL DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quiz questions viewable" ON public.quiz_questions FOR SELECT USING (true);

-- Quiz Attempts
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id),
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students create attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Lesson Comments
CREATE TABLE public.lesson_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.lesson_comments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable" ON public.lesson_comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON public.lesson_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Instructor Applications
CREATE TABLE public.instructor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id),
  bio TEXT NOT NULL,
  expertise TEXT NOT NULL,
  experience_years INT DEFAULT 0,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own applications" ON public.instructor_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create applications" ON public.instructor_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins see all applications" ON public.instructor_applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update applications" ON public.instructor_applications FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- NEW FEATURE TABLES
-- =============================================

-- ASSIGNMENTS
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_attempts INT NOT NULL DEFAULT 3,
  max_score INT NOT NULL DEFAULT 100,
  sample_file_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors create assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Instructors update assignments" ON public.assignments FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Instructors delete assignments" ON public.assignments FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT,
  file_url TEXT,
  score INT,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'revision')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Instructors see course submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON a.course_id = c.id WHERE a.id = assignment_id AND c.instructor_id = auth.uid())
);
CREATE POLICY "Students submit" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Instructors grade" ON public.assignment_submissions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON a.course_id = c.id WHERE a.id = assignment_id AND c.instructor_id = auth.uid())
);

-- MESSAGING
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own convos" ON public.conversations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users create convos" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users see own participations" ON public.conversation_participants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users see co-participants" ON public.conversation_participants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Users add participants" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see convo messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users mark read" ON public.messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- WALLET
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own txns" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create txns" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- FORUMS
CREATE TABLE public.forum_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  category TEXT NOT NULL DEFAULT 'General',
  pinned BOOLEAN NOT NULL DEFAULT false,
  solved BOOLEAN NOT NULL DEFAULT false,
  views_count INT NOT NULL DEFAULT 0,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View topics" ON public.forum_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create topics" ON public.forum_topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own topics" ON public.forum_topics FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Delete own topics" ON public.forum_topics FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View replies" ON public.forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own replies" ON public.forum_replies FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- EVENTS
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  type TEXT NOT NULL DEFAULT 'live_class' CHECK (type IN ('live_class', 'webinar', 'in_person', 'recorded')),
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  duration_minutes INT,
  max_attendees INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled', 'recorded')),
  meeting_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Instructors create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "Instructors update events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = instructor_id);

CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own regs" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Instructors see event regs" ON public.event_registrations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND instructor_id = auth.uid())
);
CREATE POLICY "Users register" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel reg" ON public.event_registrations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- BLOG
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  likes_count INT NOT NULL DEFAULT 0,
  views_count INT NOT NULL DEFAULT 0,
  read_time_minutes INT DEFAULT 5,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View published posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authors view own posts" ON public.blog_posts FOR SELECT TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors create posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update posts" ON public.blog_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors delete posts" ON public.blog_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View blog comments" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Users create blog comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- SUPPORT
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'general' CHECK (department IN ('technical', 'billing', 'sales', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see ticket msgs" ON public.ticket_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users reply to tickets" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);

-- GAMIFICATION
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria_type TEXT NOT NULL DEFAULT 'manual',
  criteria_value INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View badges" ON public.badges FOR SELECT USING (true);

CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  badge_id UUID NOT NULL REFERENCES public.badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Award badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  points INT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own points" ON public.user_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Add points" ON public.user_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- COUPONS & BUNDLES
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_value DECIMAL(10,2) NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  description TEXT,
  usage_limit INT DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  applicable_to TEXT DEFAULT 'all',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View active coupons" ON public.coupons FOR SELECT USING (active = true);
CREATE POLICY "Admins insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update coupons" ON public.coupons FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE public.course_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bundles" ON public.course_bundles FOR SELECT USING (active = true);

CREATE TABLE public.bundle_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.course_bundles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  UNIQUE(bundle_id, course_id)
);
ALTER TABLE public.bundle_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bundle courses" ON public.bundle_courses FOR SELECT USING (true);

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_ts BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_ts BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_ts BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_ts BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_topics_ts BEFORE UPDATE ON public.forum_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_replies_ts BEFORE UPDATE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_ts BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_ts BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_ts BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_comments_ts BEFORE UPDATE ON public.lesson_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENABLE REALTIME for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
