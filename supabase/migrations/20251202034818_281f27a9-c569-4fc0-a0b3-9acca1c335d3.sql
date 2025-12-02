-- Drop existing policies on connections table
DROP POLICY IF EXISTS "Students can create connection requests" ON public.connections;
DROP POLICY IF EXISTS "Alumni can update connection status" ON public.connections;
DROP POLICY IF EXISTS "Connections are viewable by involved users" ON public.connections;

-- Add flexible columns for bidirectional connections
ALTER TABLE public.connections 
  DROP CONSTRAINT IF EXISTS connections_student_id_fkey,
  DROP CONSTRAINT IF EXISTS connections_alumni_id_fkey;

-- Rename columns to be more generic
ALTER TABLE public.connections 
  RENAME COLUMN student_id TO requester_id;
ALTER TABLE public.connections 
  RENAME COLUMN alumni_id TO receiver_id;

-- Create new RLS policies for bidirectional connections
CREATE POLICY "Users can create connection requests"
ON public.connections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Receivers can update connection status"
ON public.connections
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can view their connections"
ON public.connections
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id OR 
  auth.uid() = receiver_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);