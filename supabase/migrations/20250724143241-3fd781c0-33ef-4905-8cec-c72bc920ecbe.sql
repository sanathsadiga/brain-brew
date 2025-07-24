-- Create a table to store links between notes and commands
CREATE TABLE public.note_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_id UUID NOT NULL,
  from_type TEXT NOT NULL CHECK (from_type IN ('note', 'command')),
  to_id UUID NOT NULL,
  to_type TEXT NOT NULL CHECK (to_type IN ('note', 'command')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_id, to_id, from_type, to_type)
);

-- Enable Row Level Security
ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own links" 
ON public.note_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links" 
ON public.note_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
ON public.note_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_note_links_from ON public.note_links(from_id, from_type);
CREATE INDEX idx_note_links_to ON public.note_links(to_id, to_type);
CREATE INDEX idx_note_links_user ON public.note_links(user_id);