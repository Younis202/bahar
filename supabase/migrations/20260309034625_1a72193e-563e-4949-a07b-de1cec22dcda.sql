
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '📚',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  trailer_bunny_id TEXT,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) DEFAULT 0,
  original_price DECIMAL(10,2),
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  language TEXT DEFAULT 'Arabic',
  duration_hours DECIMAL(5,1) DEFAULT 0,
  students_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (
  status = 'published' OR instructor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Instructors can create courses" ON public.courses FOR INSERT WITH CHECK (
  auth.uid() = instructor_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin'))
);
CREATE POLICY "Instructors can update own courses" ON public.courses FOR UPDATE USING (
  auth.uid() = instructor_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE public.sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sections" ON public.sections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (
    status = 'published' OR instructor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
  ))
);
CREATE POLICY "Instructors can manage sections" ON public.sections FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin'))
);
CREATE POLICY "Students can enroll" ON public.enrollments FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own enrollment" ON public.enrollments FOR UPDATE USING (student_id = auth.uid());

CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  bunny_video_id TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_preview BOOLEAN DEFAULT FALSE,
  lesson_type TEXT DEFAULT 'video' CHECK (lesson_type IN ('video', 'quiz', 'document')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable lessons policy" ON public.lessons FOR SELECT USING (
  is_preview = true OR
  EXISTS (
    SELECT 1 FROM public.sections s
    JOIN public.enrollments e ON e.course_id = s.course_id
    WHERE s.id = section_id AND e.student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.sections s
    JOIN public.courses c ON c.id = s.course_id
    WHERE s.id = section_id AND c.instructor_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Instructors can manage lessons" ON public.lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.sections s
    JOIN public.courses c ON c.id = s.course_id
    WHERE s.id = section_id AND c.instructor_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE public.lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  watch_time_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own lesson progress" ON public.lesson_progress FOR ALL USING (student_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
