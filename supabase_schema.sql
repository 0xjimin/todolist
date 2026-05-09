-- Create Folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#ffffff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('쉬움', '중간', '어려움')),
    is_completed BOOLEAN DEFAULT false NOT NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optional: Create some default folders
INSERT INTO public.folders (name, color) VALUES 
('Personal', '#FF5C5C'),
('Work', '#5C85FF'),
('Shopping', '#5CFF85')
ON CONFLICT DO NOTHING;
