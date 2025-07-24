-- Fix search path security issue in the version function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';