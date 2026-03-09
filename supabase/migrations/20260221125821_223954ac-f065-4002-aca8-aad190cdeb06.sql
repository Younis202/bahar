
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('student', 'instructor', 'admin');

-- Create course_level enum
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create course_status enum
CREATE TYPE public.course_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');

-- Create instructor_status enum
CREATE TYPE public.instructor_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- 1. Profiles table
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  instructor_status instructor_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. User roles table (separate from profiles!)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. Categories table
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. Courses table
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  what_you_learn_ar TEXT[],
  what_you_learn_en TEXT[],
  requirements_ar TEXT[],
  requirements_en TEXT[],
  level course_level DEFAULT 'beginner',
  status course_status DEFAULT 'draft',
  price DECIMAL(10,2) DEFAULT 0,
  discount_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  trailer_url TEXT,
  thumbnail_url TEXT,
  duration_hours DECIMAL(5,1) DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (status = 'published' OR instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can insert own courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instructor_id AND public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors can update own courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = instructor_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 5. Topics (course sections/modules)
-- ============================================
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topics of visible courses"
  ON public.topics FOR SELECT
  USING (true);

CREATE POLICY "Instructors can manage own course topics"
  ON public.topics FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()
  ));

-- ============================================
-- 6. Lessons
-- ============================================
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  video_embed_code TEXT,
  duration_minutes INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson metadata"
  ON public.lessons FOR SELECT
  USING (true);

CREATE POLICY "Instructors can manage own lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.topics t
    JOIN public.courses c ON c.id = t.course_id
    WHERE t.id = topic_id AND c.instructor_id = auth.uid()
  ));

-- ============================================
-- 7. Enrollments
-- ============================================
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()
  ));

CREATE POLICY "Users can insert own enrollments"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. Lesson progress
-- ============================================
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON public.lesson_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 9. Reviews
-- ============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 10. Auto-create profile on signup trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Default role: student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 11. Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 12. Insert default categories
-- ============================================
INSERT INTO public.categories (name_ar, name_en, slug, icon, sort_order) VALUES
  ('الملاحة البحرية', 'Maritime Navigation', 'navigation', '🧭', 1),
  ('الهندسة البحرية', 'Marine Engineering', 'engineering', '⚙️', 2),
  ('السلامة البحرية', 'Maritime Safety', 'safety', '🛟', 3),
  ('القانون البحري', 'Maritime Law', 'law', '⚖️', 4),
  ('إدارة السفن', 'Ship Management', 'ship-management', '🚢', 5),
  ('اللوجستيات البحرية', 'Maritime Logistics', 'logistics', '📦', 6);
