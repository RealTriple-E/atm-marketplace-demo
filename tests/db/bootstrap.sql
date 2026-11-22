-- Minimal local Auth API emulation for PostgreSQL integration checks.
-- Used only in the GitHub Actions ephemeral PostgreSQL service.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create table auth.users (id uuid primary key,email text);
create function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
  $$;
grant usage on schema public to anon,authenticated,service_role;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
insert into auth.users(id,email) values
('11111111-1111-4111-8111-111111111111','seller@example.test'),
('22222222-2222-4222-8222-222222222222','buyer1@example.test'),
('33333333-3333-4333-8333-333333333333','buyer2@example.test'),
('44444444-4444-4444-8444-444444444444','outsider@example.test');
