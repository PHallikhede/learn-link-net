-- Create messages table for chat functionality
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages are viewable by connection participants
CREATE POLICY "Users can view their connection messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.connections
    WHERE connections.id = messages.connection_id
    AND (connections.student_id = auth.uid() OR connections.alumni_id = auth.uid())
  )
);

-- Users can send messages in their connections
CREATE POLICY "Users can send messages in their connections"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.connections
    WHERE connections.id = connection_id
    AND connections.status = 'accepted'
    AND (connections.student_id = auth.uid() OR connections.alumni_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;