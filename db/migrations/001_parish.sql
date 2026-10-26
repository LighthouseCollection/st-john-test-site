-- St. John the Beloved test site · the parish database (PostgreSQL 16). Every row is made up (db/generate.js).
-- There is no table for sacrament records, on purpose: the site never stores them. People who serve are servants.

CREATE TABLE settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE clergy (
  id   text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL
);

CREATE TABLE ministries (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  icon           text NOT NULL,
  lead           text NOT NULL,
  meets          text NOT NULL,
  area           text NOT NULL,
  member_count   integer NOT NULL DEFAULT 0,
  servant_count  integer NOT NULL DEFAULT 0
);

CREATE TABLE families (
  id        text PRIMARY KEY,
  name      text NOT NULL,
  last_name text NOT NULL,
  address   jsonb NOT NULL,
  phone     text NOT NULL DEFAULT '',
  since     integer NOT NULL,
  district  text NOT NULL
);

CREATE TABLE members (
  id         text PRIMARY KEY,
  family_id  text NOT NULL REFERENCES families (id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name  text NOT NULL,
  sex        text NOT NULL DEFAULT '',
  role       text NOT NULL,
  born       date,
  email      text NOT NULL DEFAULT '',
  phone      text NOT NULL DEFAULT '',
  status     text NOT NULL CHECK (status IN ('active', 'visitor', 'moved', 'inactive')),
  joined     date,
  servant    boolean NOT NULL DEFAULT false,
  district   text NOT NULL,
  giving     integer NOT NULL DEFAULT 0,
  position   serial
);
CREATE INDEX members_family ON members (family_id);

CREATE TABLE member_ministries (
  member_id   text NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  ministry_id text NOT NULL REFERENCES ministries (id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, ministry_id)
);

CREATE TABLE services (
  id       text PRIMARY KEY,
  title    text NOT NULL,
  day      text NOT NULL,
  starts   text NOT NULL,
  ends     text NOT NULL,
  place    text NOT NULL
);

CREATE TABLE feasts (
  id    text PRIMARY KEY,
  title text NOT NULL,
  day   date NOT NULL,
  kind  text NOT NULL CHECK (kind IN ('feast', 'fast', 'season', 'patron'))
);

CREATE TABLE events (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  starts_at   timestamp NOT NULL,
  ends_at     timestamp NOT NULL,
  place       text NOT NULL,
  ministry_id text REFERENCES ministries (id),
  color       text NOT NULL,
  rsvp_count  integer NOT NULL DEFAULT 0
);

CREATE TABLE rsvps (
  id         serial PRIMARY KEY,
  event_id   text NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  answer     text NOT NULL CHECK (answer IN ('yes', 'maybe', 'no')),
  guests     integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE funds (
  id     text PRIMARY KEY,
  name   text NOT NULL,
  goal   integer NOT NULL,
  raised integer NOT NULL
);

CREATE TABLE gifts (
  id        text PRIMARY KEY,
  member_id text NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  fund_id   text NOT NULL REFERENCES funds (id),
  amount    numeric(10, 2) NOT NULL,
  method    text NOT NULL,
  given_on  date NOT NULL,
  position  integer NOT NULL
);
CREATE INDEX gifts_member ON gifts (member_id);

CREATE TABLE giving_months (
  month    integer PRIMARY KEY,
  label    text NOT NULL,
  general  integer NOT NULL,
  building integer NOT NULL,
  pantry   integer NOT NULL
);

CREATE TABLE pledges (
  id        text PRIMARY KEY,
  member_id text NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  fund_id   text NOT NULL REFERENCES funds (id),
  amount    integer NOT NULL,
  paid      integer NOT NULL DEFAULT 0,
  frequency text NOT NULL,
  status    text NOT NULL,
  position  serial
);

CREATE TABLE serving_slots (
  id          text PRIMARY KEY,
  role        text NOT NULL,
  ministry_id text NOT NULL REFERENCES ministries (id),
  day         date NOT NULL,
  starts      text NOT NULL,
  needed      integer NOT NULL
);

CREATE TABLE signups (
  slot_id   text NOT NULL REFERENCES serving_slots (id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  position  serial,
  PRIMARY KEY (slot_id, member_id)
);

CREATE TABLE announcements (
  id       text PRIMARY KEY,
  title    text NOT NULL,
  body     text NOT NULL,
  author   text NOT NULL,
  day      date NOT NULL,
  status   text NOT NULL,
  audience text NOT NULL
);

CREATE TABLE documents (
  id       text PRIMARY KEY,
  name     text NOT NULL,
  folder   text NOT NULL,
  size     integer NOT NULL,
  modified timestamp NOT NULL,
  owner    text NOT NULL,
  version  integer NOT NULL
);

CREATE TABLE media (
  id       text PRIMARY KEY,
  title    text NOT NULL,
  kind     text NOT NULL,
  speaker  text NOT NULL,
  day      date NOT NULL,
  duration integer NOT NULL
);

CREATE TABLE bookstore_items (
  id       text PRIMARY KEY,
  name     text NOT NULL,
  price    integer NOT NULL,
  category text NOT NULL,
  stock    integer NOT NULL
);
