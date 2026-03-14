create extension if not exists pgcrypto;

create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  formatted_address text not null,
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  category text,
  website_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table place_provider_refs (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  provider text not null check (provider = 'google_places'),
  provider_place_id text not null,
  provider_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_place_id)
);

create index idx_place_provider_refs_place_id on place_provider_refs(place_id);

create table pet_rules (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null unique references places(id) on delete cascade,
  dog_policy_status text not null check (dog_policy_status in ('allowed', 'restricted', 'not_allowed', 'unknown')),
  indoor_allowed boolean,
  outdoor_allowed boolean,
  leash_required boolean,
  size_restriction text,
  breed_restriction text,
  service_dog_only boolean,
  notes text,
  confidence_score integer not null check (confidence_score between 0 and 100),
  verification_source_type text not null check (
    verification_source_type in ('official_website', 'google_places', 'user_report', 'staff_confirmation', 'onsite_signage', 'other')
  ),
  verification_source_url text,
  verified_at timestamptz,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  reporter_user_id uuid not null,
  status text not null check (status in ('submitted', 'under_review', 'approved', 'rejected')),
  proposed_dog_policy_status text check (proposed_dog_policy_status in ('allowed', 'restricted', 'not_allowed', 'unknown')),
  proposed_indoor_allowed boolean,
  proposed_outdoor_allowed boolean,
  proposed_leash_required boolean,
  proposed_size_restriction text,
  proposed_breed_restriction text,
  proposed_service_dog_only boolean,
  proposed_notes text,
  evidence_url text,
  reporter_comment text,
  review_notes text,
  reviewed_by_user_id uuid,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (
    proposed_dog_policy_status is not null
    or proposed_indoor_allowed is not null
    or proposed_outdoor_allowed is not null
    or proposed_leash_required is not null
    or proposed_size_restriction is not null
    or proposed_breed_restriction is not null
    or proposed_service_dog_only is not null
    or proposed_notes is not null
    or evidence_url is not null
    or reporter_comment is not null
  )
);

create index idx_user_reports_place_id on user_reports(place_id);
create index idx_user_reports_status_created_at on user_reports(status, created_at desc);
