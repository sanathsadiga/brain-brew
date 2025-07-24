-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_create_note_version ON public.notes;
DROP TRIGGER IF EXISTS trigger_create_command_version ON public.commands;
DROP TRIGGER IF EXISTS create_version_on_notes_update ON public.notes;
DROP TRIGGER IF EXISTS create_version_on_commands_update ON public.commands;

-- Now drop the function
DROP FUNCTION IF EXISTS public.create_version_on_update() CASCADE;

-- Recreate the trigger function with proper logic
CREATE OR REPLACE FUNCTION public.create_version_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Handle notes table
    IF TG_TABLE_NAME = 'notes' THEN
        -- Only create version if content actually changed
        IF (OLD.title != NEW.title OR OLD.content != NEW.content OR OLD.tags IS DISTINCT FROM NEW.tags) THEN
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
                'note',
                COALESCE((
                    SELECT MAX(version_number) + 1 
                    FROM public.versions 
                    WHERE item_id = OLD.id
                ), 1),
                OLD.title,
                OLD.content,
                NULL,
                OLD.tags,
                OLD.updated_at,
                false
            );
        END IF;
    END IF;
    
    -- Handle commands table
    IF TG_TABLE_NAME = 'commands' THEN
        -- Only create version if content actually changed
        IF (OLD.title != NEW.title OR OLD.command != NEW.command OR OLD.description IS DISTINCT FROM NEW.description OR OLD.tags IS DISTINCT FROM NEW.tags) THEN
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
                'command',
                COALESCE((
                    SELECT MAX(version_number) + 1 
                    FROM public.versions 
                    WHERE item_id = OLD.id
                ), 1),
                OLD.title,
                OLD.command,
                OLD.description,
                OLD.tags,
                OLD.updated_at,
                false
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create triggers for both tables
CREATE TRIGGER create_version_on_notes_update
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.create_version_on_update();

CREATE TRIGGER create_version_on_commands_update
    BEFORE UPDATE ON public.commands
    FOR EACH ROW
    EXECUTE FUNCTION public.create_version_on_update();