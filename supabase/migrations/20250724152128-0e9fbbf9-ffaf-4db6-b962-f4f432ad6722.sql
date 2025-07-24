-- Create versions table to store historical versions of notes and commands
CREATE TABLE public.versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('note', 'command')),
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- stores 'command' field for commands, 'content' field for notes
    description TEXT, -- only used for commands, null for notes
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_current BOOLEAN NOT NULL DEFAULT false,
    
    -- Ensure unique version numbers per item
    UNIQUE(item_id, version_number),
    -- Ensure only one current version per item
    UNIQUE(item_id, is_current) DEFERRABLE INITIALLY DEFERRED
);

-- Enable Row Level Security
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for versions
CREATE POLICY "Users can view their own versions" 
ON public.versions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own versions" 
ON public.versions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own versions" 
ON public.versions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own versions" 
ON public.versions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_versions_user_id ON public.versions(user_id);
CREATE INDEX idx_versions_item_id ON public.versions(item_id);
CREATE INDEX idx_versions_item_type ON public.versions(item_type);
CREATE INDEX idx_versions_created_at ON public.versions(created_at DESC);

-- Create function to automatically create version when notes/commands are updated
CREATE OR REPLACE FUNCTION public.create_version_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if content actually changed
    IF (TG_TABLE_NAME = 'notes' AND (OLD.title != NEW.title OR OLD.content != NEW.content OR OLD.tags IS DISTINCT FROM NEW.tags)) OR
       (TG_TABLE_NAME = 'commands' AND (OLD.title != NEW.title OR OLD.command != NEW.command OR OLD.description IS DISTINCT FROM NEW.description OR OLD.tags IS DISTINCT FROM NEW.tags)) THEN
        
        -- Insert the old version into versions table
        INSERT INTO public.versions (
            user_id, 
            item_id, 
            item_type, 
            version_number, 
            title, 
            content, 
            description, 
            tags,
            created_at,
            is_current
        ) VALUES (
            OLD.user_id,
            OLD.id,
            CASE WHEN TG_TABLE_NAME = 'notes' THEN 'note' ELSE 'command' END,
            COALESCE((
                SELECT MAX(version_number) + 1 
                FROM public.versions 
                WHERE item_id = OLD.id
            ), 1),
            OLD.title,
            CASE WHEN TG_TABLE_NAME = 'notes' THEN OLD.content ELSE OLD.command END,
            CASE WHEN TG_TABLE_NAME = 'commands' THEN OLD.description ELSE NULL END,
            OLD.tags,
            OLD.updated_at,
            false
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically version notes and commands on update
CREATE TRIGGER trigger_create_note_version
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.create_version_on_update();

CREATE TRIGGER trigger_create_command_version
    BEFORE UPDATE ON public.commands
    FOR EACH ROW
    EXECUTE FUNCTION public.create_version_on_update();