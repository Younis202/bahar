
-- Add unique constraint on lesson_progress for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lesson_progress_student_lesson_unique'
  ) THEN
    ALTER TABLE public.lesson_progress 
      ADD CONSTRAINT lesson_progress_student_lesson_unique 
      UNIQUE (student_id, lesson_id);
  END IF;
END $$;
