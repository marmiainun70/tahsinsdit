
-- Create exam_participants table
CREATE TABLE public.exam_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, student_id)
);

-- Enable RLS
ALTER TABLE public.exam_participants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Exam participants viewable by authenticated users"
  ON public.exam_participants FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert exam participants"
  ON public.exam_participants FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete exam participants"
  ON public.exam_participants FOR DELETE
  TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_participants;
