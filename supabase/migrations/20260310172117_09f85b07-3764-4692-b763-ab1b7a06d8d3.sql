
-- Admin can see ALL courses
CREATE POLICY "Admins see all courses" ON public.courses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can update ANY course
CREATE POLICY "Admins update all courses" ON public.courses FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can delete ANY course
CREATE POLICY "Admins delete all courses" ON public.courses FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can see ALL enrollments
CREATE POLICY "Admins see all enrollments" ON public.enrollments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage events
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage blog posts
CREATE POLICY "Admins manage blog_posts" ON public.blog_posts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage coupons delete
CREATE POLICY "Admins delete coupons" ON public.coupons FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can see ALL support tickets
CREATE POLICY "Admins see all tickets" ON public.support_tickets FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can update ALL support tickets
CREATE POLICY "Admins update all tickets" ON public.support_tickets FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can see ALL ticket messages
CREATE POLICY "Admins see all ticket msgs" ON public.ticket_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can reply to any ticket
CREATE POLICY "Admins reply to tickets" ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage categories
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage badges
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can update any profile role
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can see all assignment submissions
CREATE POLICY "Admins see all submissions" ON public.assignment_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage quiz questions
CREATE POLICY "Admins manage quiz_questions" ON public.quiz_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage wallet_transactions (view all)
CREATE POLICY "Admins see all wallet txns" ON public.wallet_transactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage sections
CREATE POLICY "Admins manage sections" ON public.sections FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Admin can manage lessons
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
