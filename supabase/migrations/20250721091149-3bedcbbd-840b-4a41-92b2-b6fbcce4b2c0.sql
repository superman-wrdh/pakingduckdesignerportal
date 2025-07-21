-- Create designer_profiles table
CREATE TABLE public.designer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.designer_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for designer_profiles
CREATE POLICY "Users can view their own designer profile" 
ON public.designer_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own designer profile" 
ON public.designer_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designer profile" 
ON public.designer_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designer profile" 
ON public.designer_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_designer_profiles_updated_at
BEFORE UPDATE ON public.designer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();