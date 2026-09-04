
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  colleges_count integer NOT NULL DEFAULT 0,
  total_seats integer NOT NULL DEFAULT 0,
  prediction_coverage text NOT NULL DEFAULT 'None',
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs are publicly readable" ON public.programs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.marks_rank_curves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course text NOT NULL,
  marks numeric(6,2) NOT NULL,
  estimated_rank integer NOT NULL,
  curve_quality text NOT NULL DEFAULT 'Unverified',
  source_url text
);
CREATE INDEX marks_rank_curves_course_idx ON public.marks_rank_curves (course, marks);
GRANT SELECT ON public.marks_rank_curves TO anon, authenticated;
GRANT ALL ON public.marks_rank_curves TO service_role;
ALTER TABLE public.marks_rank_curves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Curves are publicly readable" ON public.marks_rank_curves FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.historical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  course text NOT NULL,
  category text NOT NULL,
  seat_type text NOT NULL,
  round text NOT NULL,
  college text NOT NULL,
  university text,
  opening_rank integer,
  closing_rank integer NOT NULL,
  closing_marks numeric(6,2),
  source_url text
);
CREATE INDEX historical_data_lookup_idx ON public.historical_data (course, category, seat_type);
GRANT SELECT ON public.historical_data TO anon, authenticated;
GRANT ALL ON public.historical_data TO service_role;
ALTER TABLE public.historical_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Historical data is publicly readable" ON public.historical_data FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.college_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college text NOT NULL,
  program text NOT NULL,
  type text NOT NULL DEFAULT 'Private',
  district text,
  seats_total integer NOT NULL DEFAULT 0,
  historical_cutoff_loaded boolean NOT NULL DEFAULT false
);
CREATE INDEX college_seats_program_idx ON public.college_seats (program);
GRANT SELECT ON public.college_seats TO anon, authenticated;
GRANT ALL ON public.college_seats TO service_role;
ALTER TABLE public.college_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "College seats are publicly readable" ON public.college_seats FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.programs (name, colleges_count, total_seats, prediction_coverage, sort_order) VALUES
('MBBS', 22, 2160, 'Strong', 1),
('BDS', 12, 700, 'Partial', 2),
('BSc Nursing', 38, 1520, 'Strong', 3),
('BNS', 21, 640, 'Partial', 4),
('BAMS', 6, 250, 'Partial', 5),
('BPH', 14, 520, 'Partial', 6),
('B.Pharm', 11, 430, 'Partial', 7),
('BPT', 5, 130, 'Partial', 8),
('B.Optometry', 4, 70, 'None', 9),
('BSc MIT', 6, 120, 'None', 10),
('BSc MLT', 9, 210, 'Partial', 11),
('BASLP', 3, 40, 'None', 12),
('BSc Midwifery', 4, 60, 'None', 13),
('B.Perfusion Technology', 2, 20, 'None', 14),
('BSc Radiotherapy Technology', 2, 20, 'None', 15),
('Midwifery Science (BMS)', 3, 45, 'None', 16);

INSERT INTO public.marks_rank_curves (course, marks, estimated_rank, curve_quality, source_url) VALUES
('BSc Nursing', 40, 6400, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 50, 4800, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 60, 3200, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 70, 2100, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 75, 1560, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 80, 1029, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 90, 520, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 100, 240, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 120, 60, 'Verified', 'https://mecee.edu.np/'),
('BSc Nursing', 150, 10, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 80, 14500, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 100, 9000, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 120, 5200, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 140, 2600, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 150, 1800, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 160, 1100, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 170, 600, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 180, 220, 'Verified', 'https://mecee.edu.np/'),
('MBBS', 190, 60, 'Verified', 'https://mecee.edu.np/'),
('BDS', 90, 11000, 'Partial', 'https://mecee.edu.np/'),
('BDS', 120, 6000, 'Partial', 'https://mecee.edu.np/'),
('BDS', 150, 2200, 'Partial', 'https://mecee.edu.np/'),
('BDS', 175, 500, 'Partial', 'https://mecee.edu.np/'),
('BNS', 40, 5200, 'Partial', 'https://mecee.edu.np/'),
('BNS', 70, 2400, 'Partial', 'https://mecee.edu.np/'),
('BNS', 100, 700, 'Partial', 'https://mecee.edu.np/'),
('BPH', 50, 4200, 'Partial', 'https://mecee.edu.np/'),
('BPH', 80, 1800, 'Partial', 'https://mecee.edu.np/'),
('BPH', 110, 450, 'Partial', 'https://mecee.edu.np/');

INSERT INTO public.historical_data (year, course, category, seat_type, round, college, university, opening_rank, closing_rank, closing_marks, source_url) VALUES
(2025, 'BSc Nursing', 'Open', 'Scholarship', 'First Matching', 'Maharajgunj Nursing Campus, TUIOM', 'TU', 12, 210, 118.50, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Open', 'Scholarship', 'First Matching', 'BPKIHS, Dharan', 'BPKIHS', 45, 480, 101.25, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Open', 'Scholarship', '1st Re-Matching', 'Pokhara Nursing Campus', 'TU', 320, 940, 84.75, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Open', 'Scholarship', '1st Re-Matching', 'Nepalgunj Nursing Campus', 'TU', 700, 1180, 77.50, 'https://mecee.edu.np/'),
(2024, 'BSc Nursing', 'Open', 'Scholarship', 'First Matching', 'Birgunj Nursing Campus', 'TU', 810, 1420, 72.25, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Open', 'Paying', 'First Matching', 'KIST Medical College', 'TU', 900, 2450, 63.00, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Open', 'Paying', 'First Matching', 'Manmohan Memorial Institute', 'KU', 1400, 3100, 58.25, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Open', 'Paying', '1st Re-Matching', 'Nobel College, Sinamangal', 'PU', 2600, 4200, 51.50, 'https://mecee.edu.np/'),
(2024, 'BSc Nursing', 'Open', 'Paying', '2nd Re-Matching', 'Little Buddha College of Health Science', 'PU', 3900, 5600, 45.00, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Female', 'Scholarship', 'First Matching', 'Maharajgunj Nursing Campus, TUIOM', 'TU', 30, 340, 110.00, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Female', 'Scholarship', '1st Re-Matching', 'Pokhara Nursing Campus', 'TU', 480, 1290, 75.50, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Female', 'Paying', 'First Matching', 'KIST Medical College', 'TU', 1200, 2900, 59.75, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Dalit', 'Scholarship', 'First Matching', 'Maharajgunj Nursing Campus, TUIOM', 'TU', 640, 1850, 68.00, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Dalit', 'Paying', '1st Re-Matching', 'Nobel College, Sinamangal', 'PU', 3100, 5100, 47.25, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Aadibasi Janajati', 'Scholarship', 'First Matching', 'BPKIHS, Dharan', 'BPKIHS', 260, 1120, 78.50, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Madhesi', 'Scholarship', 'First Matching', 'Birgunj Nursing Campus', 'TU', 400, 1490, 71.00, 'https://mecee.edu.np/'),
(2025, 'BSc Nursing', 'Khas Arya', 'Scholarship', 'First Matching', 'Pokhara Nursing Campus', 'TU', 210, 860, 86.25, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Open', 'Scholarship', 'First Matching', 'Institute of Medicine, Maharajgunj', 'TU', 1, 62, 186.50, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Open', 'Scholarship', 'First Matching', 'BPKIHS, Dharan', 'BPKIHS', 40, 154, 174.25, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Open', 'Scholarship', 'First Matching', 'Patan Academy of Health Sciences', 'PAHS', 90, 310, 165.00, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Open', 'Scholarship', '1st Re-Matching', 'Nepalgunj Medical College', 'KU', 350, 720, 152.75, 'https://mecee.edu.np/'),
(2024, 'MBBS', 'Open', 'Scholarship', '1st Re-Matching', 'Chitwan Medical College', 'KU', 600, 1050, 145.50, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Open', 'Paying', 'First Matching', 'Kathmandu Medical College', 'KU', 800, 2600, 132.00, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Open', 'Paying', 'First Matching', 'Nepal Medical College', 'KU', 1500, 3400, 124.25, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Open', 'Paying', '1st Re-Matching', 'Universal College of Medical Sciences', 'TU', 2900, 5200, 111.50, 'https://mecee.edu.np/'),
(2024, 'MBBS', 'Open', 'Paying', '2nd Re-Matching', 'Devdaha Medical College', 'KU', 4800, 7600, 98.75, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Female', 'Scholarship', 'First Matching', 'Institute of Medicine, Maharajgunj', 'TU', 20, 145, 176.00, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Female', 'Paying', 'First Matching', 'Kathmandu Medical College', 'KU', 1100, 3000, 128.50, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Dalit', 'Scholarship', 'First Matching', 'Institute of Medicine, Maharajgunj', 'TU', 320, 980, 148.25, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Aadibasi Janajati', 'Scholarship', 'First Matching', 'BPKIHS, Dharan', 'BPKIHS', 180, 640, 156.00, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Madhesi', 'Scholarship', 'First Matching', 'Janaki Medical College', 'TU', 500, 1240, 141.00, 'https://mecee.edu.np/'),
(2025, 'MBBS', 'Khas Arya', 'Scholarship', 'First Matching', 'Patan Academy of Health Sciences', 'PAHS', 150, 520, 160.25, 'https://mecee.edu.np/'),
(2025, 'BDS', 'Open', 'Scholarship', 'First Matching', 'Institute of Medicine, Maharajgunj', 'TU', 60, 420, 158.50, 'https://mecee.edu.np/'),
(2025, 'BDS', 'Open', 'Paying', 'First Matching', 'Kantipur Dental College', 'KU', 2100, 4800, 112.00, 'https://mecee.edu.np/'),
(2025, 'BPH', 'Open', 'Scholarship', 'First Matching', 'Institute of Medicine, Maharajgunj', 'TU', 40, 380, 96.50, 'https://mecee.edu.np/'),
(2025, 'BPH', 'Open', 'Paying', 'First Matching', 'Nobel College, Sinamangal', 'PU', 900, 2400, 62.25, 'https://mecee.edu.np/'),
(2025, 'BNS', 'Open', 'Scholarship', 'First Matching', 'Maharajgunj Nursing Campus, TUIOM', 'TU', 5, 180, 104.00, 'https://mecee.edu.np/'),
(2025, 'BNS', 'Open', 'Paying', 'First Matching', 'Manmohan Memorial Institute', 'KU', 1000, 2700, 58.50, 'https://mecee.edu.np/');

INSERT INTO public.college_seats (college, program, type, district, seats_total, historical_cutoff_loaded) VALUES
('Institute of Medicine, Maharajgunj', 'MBBS', 'Public', 'Kathmandu', 100, true),
('BPKIHS, Dharan', 'MBBS', 'Public', 'Sunsari', 100, true),
('Patan Academy of Health Sciences', 'MBBS', 'Public', 'Lalitpur', 65, true),
('Nepalgunj Medical College', 'MBBS', 'Private', 'Banke', 100, true),
('Chitwan Medical College', 'MBBS', 'Private', 'Chitwan', 100, true),
('Kathmandu Medical College', 'MBBS', 'Private', 'Kathmandu', 100, true),
('Nepal Medical College', 'MBBS', 'Private', 'Kathmandu', 100, true),
('Universal College of Medical Sciences', 'MBBS', 'Private', 'Rupandehi', 100, true),
('Devdaha Medical College', 'MBBS', 'Private', 'Rupandehi', 100, true),
('Janaki Medical College', 'MBBS', 'Private', 'Dhanusha', 100, true),
('Karnali Academy of Health Sciences', 'MBBS', 'Public', 'Jumla', 40, false),
('Gandaki Medical College', 'MBBS', 'Private', 'Kaski', 100, false),
('Maharajgunj Nursing Campus, TUIOM', 'BSc Nursing', 'Public', 'Kathmandu', 40, true),
('BPKIHS, Dharan', 'BSc Nursing', 'Public', 'Sunsari', 40, true),
('Pokhara Nursing Campus', 'BSc Nursing', 'Public', 'Kaski', 40, true),
('Nepalgunj Nursing Campus', 'BSc Nursing', 'Public', 'Banke', 40, true),
('Birgunj Nursing Campus', 'BSc Nursing', 'Public', 'Parsa', 40, true),
('KIST Medical College', 'BSc Nursing', 'Private', 'Lalitpur', 40, true),
('Manmohan Memorial Institute', 'BSc Nursing', 'Private', 'Kathmandu', 40, true),
('Nobel College, Sinamangal', 'BSc Nursing', 'Private', 'Kathmandu', 40, true),
('Little Buddha College of Health Science', 'BSc Nursing', 'Private', 'Kathmandu', 40, true),
('Chitwan Medical College', 'BSc Nursing', 'Private', 'Chitwan', 40, false),
('Lumbini Medical College', 'BSc Nursing', 'Private', 'Palpa', 40, false),
('Institute of Medicine, Maharajgunj', 'BDS', 'Public', 'Kathmandu', 25, true),
('Kantipur Dental College', 'BDS', 'Private', 'Kathmandu', 60, true),
('College of Dental Surgery, BPKIHS', 'BDS', 'Public', 'Sunsari', 40, false),
('Institute of Medicine, Maharajgunj', 'BPH', 'Public', 'Kathmandu', 30, true),
('Nobel College, Sinamangal', 'BPH', 'Private', 'Kathmandu', 50, true),
('Manmohan Memorial Institute', 'BPH', 'Private', 'Kathmandu', 40, false),
('Maharajgunj Nursing Campus, TUIOM', 'BNS', 'Public', 'Kathmandu', 30, true),
('Manmohan Memorial Institute', 'BNS', 'Private', 'Kathmandu', 30, true),
('Pokhara Nursing Campus', 'BNS', 'Public', 'Kaski', 30, false);
