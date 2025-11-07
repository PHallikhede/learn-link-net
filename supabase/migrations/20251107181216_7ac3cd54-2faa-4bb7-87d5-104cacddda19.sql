-- Add file attachment support to messages table
ALTER TABLE public.messages 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT,
ADD COLUMN attachment_type TEXT;

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS policies for chat attachments
CREATE POLICY "Users can view attachments from their connections"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.connections c ON m.connection_id = c.id
    WHERE (c.student_id = auth.uid() OR c.alumni_id = auth.uid())
    AND (storage.foldername(name))[1] = m.connection_id::text
  )
);

CREATE POLICY "Users can upload attachments to their connections"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM public.connections
    WHERE id::text = (storage.foldername(name))[1]
    AND (student_id = auth.uid() OR alumni_id = auth.uid())
    AND status = 'accepted'
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.sender_id = auth.uid()
    AND (storage.foldername(name))[1] = m.connection_id::text
  )
);