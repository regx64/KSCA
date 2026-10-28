-- Fixes from the Supabase security advisor on the production project.
--
-- 1. Pin search_path on helper/trigger functions so a caller can't shadow
--    the tables they reference with objects in another schema.
alter function public.is_end_user_context() set search_path = public;
alter function public.reports_force_pending() set search_path = public;
alter function public.protect_profiles_columns() set search_path = public;
alter function public.protect_papers_columns() set search_path = public;
alter function public.protect_posts_columns() set search_path = public;
alter function public.reset_moderation_fields_on_insert() set search_path = public;

-- 2. Trigger functions are not API endpoints. Revoking EXECUTE removes them
--    from /rest/v1/rpc; triggers still fire (EXECUTE is only checked when a
--    trigger is created, not when it runs).
--    Intentionally left callable: generate_concept_id (signed-in uploads),
--    increment_paper_view (view counter), is_admin (used inside RLS policies).
revoke execute on function public.check_report_threshold() from public, anon, authenticated;
revoke execute on function public.comments_before_insert() from public, anon, authenticated;
revoke execute on function public.enforce_paper_versioning() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.paper_comments_before_insert() from public, anon, authenticated;
revoke execute on function public.reports_force_pending() from public, anon, authenticated;
revoke execute on function public.protect_profiles_columns() from public, anon, authenticated;
revoke execute on function public.protect_papers_columns() from public, anon, authenticated;
revoke execute on function public.protect_posts_columns() from public, anon, authenticated;
revoke execute on function public.reset_moderation_fields_on_insert() from public, anon, authenticated;
