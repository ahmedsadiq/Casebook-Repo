-- =============================================================
-- Fix FK constraints to reference public.profiles instead of auth.users
-- This allows PostgREST to resolve the profiles join correctly.
-- =============================================================

-- cases.client_id → public.profiles(id)
ALTER TABLE public.cases
  DROP CONSTRAINT IF EXISTS cases_client_id_fkey,
  ADD CONSTRAINT cases_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- case_updates.author_id → public.profiles(id)
ALTER TABLE public.case_updates
  DROP CONSTRAINT IF EXISTS case_updates_author_id_fkey,
  ADD CONSTRAINT case_updates_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- case_documents.uploader_id → public.profiles(id)
ALTER TABLE public.case_documents
  DROP CONSTRAINT IF EXISTS case_documents_uploader_id_fkey,
  ADD CONSTRAINT case_documents_uploader_id_fkey
    FOREIGN KEY (uploader_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
