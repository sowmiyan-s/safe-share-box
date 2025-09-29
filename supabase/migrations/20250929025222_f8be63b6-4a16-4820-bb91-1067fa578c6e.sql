-- Add expiration and access limit features to shared_links table
ALTER TABLE public.shared_links 
ADD COLUMN IF NOT EXISTS max_access_count integer,
ADD COLUMN IF NOT EXISTS has_access_limit boolean DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_links_expires_at ON public.shared_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_links_accessed_count ON public.shared_links(accessed_count);