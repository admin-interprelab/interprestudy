-- Create medications reference table
CREATE TABLE public.rx_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  direct_translation TEXT NOT NULL,
  generic_names TEXT[],
  brand_names TEXT[],
  alternative_names TEXT[],
  target_language TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rx_medications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own medications" 
ON public.rx_medications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medications" 
ON public.rx_medications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" 
ON public.rx_medications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" 
ON public.rx_medications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rx_medications_updated_at
BEFORE UPDATE ON public.rx_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();