-- Create design_versions table
CREATE TABLE public.design_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create version_files table for storing files per version
CREATE TABLE public.version_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create annotations table
CREATE TABLE public.annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID NOT NULL,
  file_id UUID NOT NULL,
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for design_versions
CREATE POLICY "Users can view their own design versions" 
ON public.design_versions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own design versions" 
ON public.design_versions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own design versions" 
ON public.design_versions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own design versions" 
ON public.design_versions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for version_files
CREATE POLICY "Users can view their own version files" 
ON public.version_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own version files" 
ON public.version_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own version files" 
ON public.version_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own version files" 
ON public.version_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for annotations
CREATE POLICY "Users can view their own annotations" 
ON public.annotations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own annotations" 
ON public.annotations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations" 
ON public.annotations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations" 
ON public.annotations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for feedback
CREATE POLICY "Users can view their own feedback" 
ON public.feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
ON public.feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" 
ON public.feedback 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key relationships
ALTER TABLE public.design_versions 
ADD CONSTRAINT design_versions_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.version_files 
ADD CONSTRAINT version_files_version_id_fkey 
FOREIGN KEY (version_id) REFERENCES public.design_versions(id) ON DELETE CASCADE;

ALTER TABLE public.annotations 
ADD CONSTRAINT annotations_version_id_fkey 
FOREIGN KEY (version_id) REFERENCES public.design_versions(id) ON DELETE CASCADE;

ALTER TABLE public.annotations 
ADD CONSTRAINT annotations_file_id_fkey 
FOREIGN KEY (file_id) REFERENCES public.version_files(id) ON DELETE CASCADE;

ALTER TABLE public.feedback 
ADD CONSTRAINT feedback_version_id_fkey 
FOREIGN KEY (version_id) REFERENCES public.design_versions(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_design_versions_updated_at
BEFORE UPDATE ON public.design_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at
BEFORE UPDATE ON public.annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_design_versions_project_id ON public.design_versions(project_id);
CREATE INDEX idx_version_files_version_id ON public.version_files(version_id);
CREATE INDEX idx_annotations_version_id ON public.annotations(version_id);
CREATE INDEX idx_annotations_file_id ON public.annotations(file_id);
CREATE INDEX idx_feedback_version_id ON public.feedback(version_id);