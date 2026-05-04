CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO site_settings (key, value) VALUES
  ('films_hero_eyebrow', '2ND GENOVA AI FILM COMPETITION')
ON CONFLICT (key) DO NOTHING;
