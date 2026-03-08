
-- ============================================================
-- MIGRATION: Full Platform Features
-- reviews, quiz_questions, quiz_attempts, certificates,
-- notifications, comments, instructor_applications
-- ============================================================

-- 1. REVIEWS TABLE
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Students can create own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own review" ON public.reviews FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can delete own review" ON public.reviews FOR DELETE USING (auth.uid() = student_id);
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. QUIZ QUESTIONS TABLE
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled users and instructors can view quiz questions" ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.sections s ON s.id = l.section_id
      JOIN public.courses c ON c.id = s.course_id
      LEFT JOIN public.enrollments e ON e.course_id = c.id AND e.student_id = auth.uid()
      WHERE l.id = quiz_questions.lesson_id
        AND (c.instructor_id = auth.uid() OR e.student_id IS NOT NULL
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );
CREATE POLICY "Instructors can manage quiz questions" ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.sections s ON s.id = l.section_id
      JOIN public.courses c ON c.id = s.course_id
      WHERE l.id = quiz_questions.lesson_id
        AND (c.instructor_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );

-- 3. QUIZ ATTEMPTS TABLE
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own quiz attempts" ON public.quiz_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Instructors can view quiz attempts for their courses" ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.sections s ON s.id = l.section_id
      JOIN public.courses c ON c.id = s.course_id
      WHERE l.id = quiz_attempts.lesson_id AND c.instructor_id = auth.uid()
    )
  );

-- 4. CERTIFICATES TABLE
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE DEFAULT 'CERT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can verify certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "System can issue certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 6. LESSON COMMENTS TABLE
CREATE TABLE public.lesson_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled users can view comments" ON public.lesson_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.sections s ON s.id = l.section_id
      LEFT JOIN public.enrollments e ON e.course_id = s.course_id AND e.student_id = auth.uid()
      LEFT JOIN public.courses c ON c.id = s.course_id
      WHERE l.id = lesson_comments.lesson_id
        AND (e.student_id IS NOT NULL OR c.instructor_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );
CREATE POLICY "Enrolled users can add comments" ON public.lesson_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.sections s ON s.id = l.section_id
      LEFT JOIN public.enrollments e ON e.course_id = s.course_id AND e.student_id = auth.uid()
      LEFT JOIN public.courses c ON c.id = s.course_id
      WHERE l.id = lesson_comments.lesson_id
        AND (e.student_id IS NOT NULL OR c.instructor_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );
CREATE POLICY "Users can update own comments" ON public.lesson_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.lesson_comments FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_lesson_comments_updated_at BEFORE UPDATE ON public.lesson_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. INSTRUCTOR APPLICATIONS TABLE
CREATE TABLE public.instructor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  expertise TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own application" ON public.instructor_applications FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Users can submit application" ON public.instructor_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage applications" ON public.instructor_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
