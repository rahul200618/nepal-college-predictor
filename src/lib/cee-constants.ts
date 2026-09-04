export const COURSES = [
  "MBBS",
  "BDS",
  "BSc Nursing",
  "BNS",
  "BAMS",
  "BPH",
  "B. Pharm",
  "BPT",
  "B. Optometry",
  "BSc MIT",
  "BSc MLT",
  "BASLP",
  "BSc Midwifery",
  "B. Perfusion Technology",
  "BSc Radiotherapy Technology",
  "Midwifery Science (BMS)",
] as const;

export const CATEGORIES = [
  "Open",
  "Female",
  "Dalit",
  "Dalit Female",
  "Muslim Female",
  "Aadibasi Janajati",
  "Khas Arya",
  "Madhesi",
  "Madhesi Dalit",
  "Tharu",
  "Muslim",
  "Pichhadiyako Kshettra",
  "Apangata",
  "Shahid",
] as const;

export type Course = (typeof COURSES)[number];
export type Category = (typeof CATEGORIES)[number];

export const MARKS_MIN = 0;
export const MARKS_MAX = 200;
export const MARKS_STEP = 0.25;

export const DATA_NOTE =
  "Predictions based on 2024–2025 MEC official admission lists.";
