-- Add policy to allow public/anon users to count accepted connections for stats
CREATE POLICY "Anyone can count accepted connections" 
ON public.connections 
FOR SELECT 
USING (status = 'accepted');