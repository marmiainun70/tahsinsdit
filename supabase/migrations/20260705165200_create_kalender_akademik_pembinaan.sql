create table academic_years (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  status text not null default 'draft' check (status in ('draft', 'aktif', 'selesai')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table academic_calendar_days (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null unique,
  status text not null check (status in ('efektif', 'tidak_efektif', 'menunggu_konfirmasi')),
  jenis text not null check (jenis in (
    'reguler', 'weekend', 'libur_nasional', 'cuti_bersama',
    'pts', 'pas', 'kegiatan_khusus'
  )),
  keterangan text,
  source text not null check (source in (
    'sistem_default', 'api_libur', 'admin_override', 'sistem_fallback'
  )),
  is_override boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_calendar_days_tanggal on academic_calendar_days (tanggal);
create index idx_calendar_days_status on academic_calendar_days (status);

create table academic_calendar_settings (
  id int primary key default 1,
  cutover_date date,
  last_api_sync_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

create table academic_calendar_sync_history (
  id uuid primary key default gen_random_uuid(),
  triggered_by uuid references auth.users(id),
  triggered_by_role text not null check (triggered_by_role in ('koordinator', 'kepala_sekolah', 'system')),
  trigger_type text not null check (trigger_type in ('manual', 'auto_generate_tahun_ajaran')),
  tahun_yang_disync text not null,
  status text not null check (status in ('sukses', 'gagal', 'sebagian_gagal')),
  jumlah_ditambah int not null default 0,
  jumlah_diupdate int not null default 0,
  jumlah_dilewati int not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table config_audit_log (
  id uuid primary key default gen_random_uuid(),
  modul text not null,
  entity_id text not null,
  field_changed text not null,
  old_value text,
  new_value text,
  changed_by uuid references auth.users(id),
  changed_by_role text not null check (changed_by_role in ('koordinator', 'kepala_sekolah', 'system')),
  alasan text,
  batch_id uuid,
  changed_at timestamptz not null default now()
);

create index idx_audit_log_modul_entity on config_audit_log (modul, entity_id);
create index idx_audit_log_batch on config_audit_log (batch_id);

-- Enable RLS
alter table academic_years enable row level security;
alter table academic_calendar_days enable row level security;
alter table academic_calendar_settings enable row level security;
alter table academic_calendar_sync_history enable row level security;
alter table config_audit_log enable row level security;

-- Setup basic policies
-- For now, allow authenticated users to read everything, and authenticated users to write (assuming admin checks happen at app level or can be added later if needed).
create policy "Enable read access for authenticated users" on academic_years for select to authenticated using (true);
create policy "Enable insert for authenticated users" on academic_years for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on academic_years for update to authenticated using (true);
create policy "Enable delete for authenticated users" on academic_years for delete to authenticated using (true);

create policy "Enable read access for authenticated users" on academic_calendar_days for select to authenticated using (true);
create policy "Enable insert for authenticated users" on academic_calendar_days for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on academic_calendar_days for update to authenticated using (true);
create policy "Enable delete for authenticated users" on academic_calendar_days for delete to authenticated using (true);

create policy "Enable read access for authenticated users" on academic_calendar_settings for select to authenticated using (true);
create policy "Enable insert for authenticated users" on academic_calendar_settings for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on academic_calendar_settings for update to authenticated using (true);
create policy "Enable delete for authenticated users" on academic_calendar_settings for delete to authenticated using (true);

create policy "Enable read access for authenticated users" on academic_calendar_sync_history for select to authenticated using (true);
create policy "Enable insert for authenticated users" on academic_calendar_sync_history for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on academic_calendar_sync_history for update to authenticated using (true);
create policy "Enable delete for authenticated users" on academic_calendar_sync_history for delete to authenticated using (true);

create policy "Enable read access for authenticated users" on config_audit_log for select to authenticated using (true);
create policy "Enable insert for authenticated users" on config_audit_log for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on config_audit_log for update to authenticated using (true);
create policy "Enable delete for authenticated users" on config_audit_log for delete to authenticated using (true);
