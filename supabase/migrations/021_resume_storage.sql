-- Create resumes bucket for storing user resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for resumes bucket
-- Users can only access their own folder (userId/filename)

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own resumes
CREATE POLICY "Users can read own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own resumes
CREATE POLICY "Users can update own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
