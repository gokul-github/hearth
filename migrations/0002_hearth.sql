-- Hearth household companion schema (per-user).

create table if not exists profiles (
  user_id text primary key,
  display_name text,
  seeded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists routines (
  id serial primary key,
  user_id text not null,
  title text not null,
  category text not null,
  weekdays text not null default '0,1,2,3,4,5,6',
  time_of_day text not null default 'morning',
  estimated_minutes int not null default 15,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists routines_user_id_idx on routines (user_id);

create table if not exists tasks (
  id serial primary key,
  user_id text not null,
  routine_id int,
  title text not null,
  category text not null,
  due_date date not null,
  time_of_day text not null default 'morning',
  estimated_minutes int not null default 15,
  notes text,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_date_idx on tasks (user_id, due_date);
create index if not exists tasks_user_id_idx on tasks (user_id);

create table if not exists coach_messages (
  id serial primary key,
  user_id text not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists coach_messages_user_id_idx on coach_messages (user_id, id);
