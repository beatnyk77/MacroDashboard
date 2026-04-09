-- Add 20 additional countries to bring g20_countries from ~20 → 40 total
-- This extends the country list for the vw_country_terminal and SEO pages
INSERT INTO public.g20_countries (code, name, is_major, region) VALUES
  ('SG','Singapore', FALSE, 'Asia'),
  ('CH','Switzerland', FALSE, 'Europe'),
  ('TH','Thailand', FALSE, 'Asia'),
  ('MY','Malaysia', FALSE, 'Asia'),
  ('AE','United Arab Emirates', FALSE, 'Middle East'),
  ('QA','Qatar', FALSE, 'Middle East'),
  ('IL','Israel', FALSE, 'Middle East'),
  ('CL','Chile', FALSE, 'South America'),
  ('NL','Netherlands', FALSE, 'Europe'),
  ('ES','Spain', FALSE, 'Europe'),
  ('VN','Vietnam', FALSE, 'Asia'),
  ('PH','Philippines', FALSE, 'Asia'),
  ('EG','Egypt', FALSE, 'Africa'),
  ('NG','Nigeria', FALSE, 'Africa'),
  ('KW','Kuwait', FALSE, 'Middle East'),
  ('NO','Norway', FALSE, 'Europe'),
  ('SE','Sweden', FALSE, 'Europe'),
  ('PL','Poland', FALSE, 'Europe'),
  ('GR','Greece', FALSE, 'Europe'),
  ('IE','Ireland', FALSE, 'Europe')
ON CONFLICT (code) DO NOTHING;
