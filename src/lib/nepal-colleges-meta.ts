export interface UniversityInfo {
  code: string;
  name: string;
  isAutonomous: boolean;
  color: string;
}

export const UNIVERSITY_MAP: Record<string, UniversityInfo> = {
  // Autonomous Institutions
  "BP Koirala Institute of Health Sciences": {
    code: "BPKIHS",
    name: "BP Koirala Institute of Health Sciences",
    isAutonomous: true,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  "Patan Academy of Health Sciences": {
    code: "PAHS",
    name: "Patan Academy of Health Sciences",
    isAutonomous: true,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  "National Academy of Medical Sciences": {
    code: "NAMS",
    name: "National Academy of Medical Sciences (Bir Hospital)",
    isAutonomous: true,
    color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  },
  "National Academy Of Medical Sciences": {
    code: "NAMS",
    name: "National Academy of Medical Sciences",
    isAutonomous: true,
    color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  },
  "Karnali Academy of Health Sciences": {
    code: "KAHS",
    name: "Karnali Academy of Health Sciences",
    isAutonomous: true,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  "Madan Bhandari Academy of Health Sciences": {
    code: "MBAHS",
    name: "Madan Bhandari Academy of Health Sciences",
    isAutonomous: true,
    color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800",
  },
  "Madhesh Institute of Health Sciences": {
    code: "MIHS",
    name: "Madhesh Institute of Health Sciences",
    isAutonomous: true,
    color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  },
  "Pokhara Academy of Health Sciences": {
    code: "PoAHS",
    name: "Pokhara Academy of Health Sciences",
    isAutonomous: true,
    color: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  },
  "Rapti Academy of Health Sciences": {
    code: "RAHS",
    name: "Rapti Academy of Health Sciences",
    isAutonomous: true,
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
};

// Substring rules for University detection
export function getCollegeUniversity(collegeName: string): {
  code: string;
  name: string;
  badgeClass: string;
} {
  const norm = collegeName.trim();

  // Direct map check
  if (UNIVERSITY_MAP[norm]) {
    const u = UNIVERSITY_MAP[norm];
    return { code: u.code, name: u.name, badgeClass: u.color };
  }

  // KU affiliated colleges
  if (
    norm.includes("KU School") ||
    norm.includes("Kathmandu Medical College") ||
    norm.includes("Nepal Medical College") ||
    norm.includes("Manipal College") ||
    norm.includes("College of Medical Sciences") ||
    norm.includes("Nepalgunj Medical College") ||
    norm.includes("Nobel Medical College") ||
    norm.includes("Lumbini Medical College") ||
    norm.includes("Birat Medical College") ||
    norm.includes("Devdaha Medical College") ||
    norm.includes("Scheer Memorial") ||
    norm.includes("Kantipur Dental") ||
    norm.includes("B & C Medical")
  ) {
    return {
      code: "KU",
      name: "Kathmandu University",
      badgeClass:
        "bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    };
  }

  // TU affiliated colleges
  if (
    norm.includes("Maharajgunj") ||
    norm.includes("Nepalese Army") ||
    norm.includes("Chitwan Medical College") ||
    norm.includes("Universal College") ||
    norm.includes("KIST Medical") ||
    norm.includes("National Medical College") ||
    norm.includes("Gandaki Medical College") ||
    norm.includes("Janaki Medical College") ||
    norm.includes("Manmohan Memorial") ||
    norm.includes("JF Institute") ||
    norm.includes("Ayurveda Campus") ||
    norm.includes("Central Department of Public Health") ||
    norm.includes("Birgunj Nursing") ||
    norm.includes("Biratnagar Nursing") ||
    norm.includes("Pokhara Nursing") ||
    norm.includes("Lalitpur Nursing") ||
    norm.includes("Nepalgunj Nursing") ||
    norm.includes("Shree Medical") ||
    norm.includes("People")
  ) {
    return {
      code: "TU",
      name: "Tribhuvan University (IOM)",
      badgeClass:
        "bg-red-600/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    };
  }

  // Pokhara University
  if (
    norm.includes("School of Health And Allied Sciences") ||
    norm.includes("School of Health and Allied Sciences") ||
    norm.includes("Crimson College") ||
    norm.includes("Nobel College") ||
    norm.includes("CIST College") ||
    norm.includes("Himalaya Eye") ||
    norm.includes("Pokhara University")
  ) {
    return {
      code: "Pokhara Univ",
      name: "Pokhara University",
      badgeClass:
        "bg-violet-600/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    };
  }

  // Purbanchal University
  if (
    norm.includes("Purbanchal") ||
    norm.includes("B&B Medical") ||
    norm.includes("Chakrabarti") ||
    norm.includes("Charak") ||
    norm.includes("Everest College") ||
    norm.includes("Hamro School") ||
    norm.includes("Hope International") ||
    norm.includes("Kantipur Academy") ||
    norm.includes("Kathmandu Model") ||
    norm.includes("Krishna Medical") ||
    norm.includes("NPI Narayani") ||
    norm.includes("N.P.I.") ||
    norm.includes("Nagarik College") ||
    norm.includes("Norvic") ||
    norm.includes("Om Health") ||
    norm.includes("Birat Health") ||
    norm.includes("Koshi Health") ||
    norm.includes("Little Buddha") ||
    norm.includes("Oasis Medical") ||
    norm.includes("Sanjeevani") ||
    norm.includes("Yeti Health") ||
    norm.includes("SAAN Institute") ||
    norm.includes("National Open") ||
    norm.includes("Modern Technical") ||
    norm.includes("Sinha Health")
  ) {
    return {
      code: "Purbanchal Univ",
      name: "Purbanchal University",
      badgeClass:
        "bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    };
  }

  // Other Autonomous
  if (norm.includes("BP Koirala") || norm.includes("BPKIHS")) {
    return {
      code: "BPKIHS",
      name: "BP Koirala Institute of Health Sciences",
      badgeClass:
        "bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    };
  }

  if (norm.includes("Patan Academy") || norm.includes("PAHS")) {
    return {
      code: "PAHS",
      name: "Patan Academy of Health Sciences",
      badgeClass:
        "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    };
  }

  if (norm.includes("Karnali Academy") || norm.includes("KAHS")) {
    return {
      code: "KAHS",
      name: "Karnali Academy of Health Sciences",
      badgeClass:
        "bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    };
  }

  return {
    code: "Other",
    name: "Affiliated Institute",
    badgeClass:
      "bg-muted text-muted-foreground border-border",
  };
}

// Nepal Districts to Province Mapping
export const DISTRICT_PROVINCE_MAP: Record<string, string> = {
  // Bagmati
  Kathmandu: "Bagmati",
  Lalitpur: "Bagmati",
  Bhaktapur: "Bagmati",
  Kavrepalanchok: "Bagmati",
  Chitwan: "Bagmati",
  Makwanpur: "Bagmati",
  Dhading: "Bagmati",
  Nuwakot: "Bagmati",
  Sindhupalchok: "Bagmati",

  // Gandaki
  Kaski: "Gandaki",
  Tanahun: "Gandaki",
  Syangja: "Gandaki",
  Gorkha: "Gandaki",
  Lamjung: "Gandaki",
  Baglung: "Gandaki",
  Nawalpur: "Gandaki",

  // Koshi (Province 1)
  Morang: "Koshi",
  Sunsari: "Koshi",
  Jhapa: "Koshi",
  Ilam: "Koshi",
  Dhankuta: "Koshi",

  // Lumbini
  Rupandehi: "Lumbini",
  Banke: "Lumbini",
  Dang: "Lumbini",
  Palpa: "Lumbini",
  Kapilvastu: "Lumbini",
  Bardiya: "Lumbini",

  // Madhesh
  Dhanusa: "Madhesh",
  Parsa: "Madhesh",
  Bara: "Madhesh",
  Rautahat: "Madhesh",
  Sarlahi: "Madhesh",
  Mahottari: "Madhesh",
  Siraha: "Madhesh",
  Saptari: "Madhesh",

  // Karnali
  Jumla: "Karnali",
  Surkhet: "Karnali",

  // Sudurpashchim
  Kailali: "Sudurpashchim",
  Kanchanpur: "Sudurpashchim",
};

export function getProvince(district: string | null): string {
  if (!district) return "Other";
  return DISTRICT_PROVINCE_MAP[district] ?? "Other";
}

// MEC Official Quota Reservations
export interface QuotaBadgeInfo {
  key: string;
  label: string;
  labelNp: string;
  share: string;
  description: string;
  badgeClass: string;
}

export const MEC_QUOTAS: QuotaBadgeInfo[] = [
  {
    key: "Open",
    label: "Open",
    labelNp: "खुला",
    share: "55% of all seats",
    description: "General merit-based seats open to all qualified candidates.",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  {
    key: "Female",
    label: "Female",
    labelNp: "महिला",
    share: "33% of reserved",
    description: "Reserved for female candidates with Community School certificate.",
    badgeClass: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  },
  {
    key: "Aadibasi Janajati",
    label: "Janajati",
    labelNp: "आदिवासी जनजाति",
    share: "27% of reserved",
    description: "Indigenous nationalities certified by Nepal Janajati commission.",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  {
    key: "Madhesi",
    label: "Madhesi",
    labelNp: "मधेशी",
    share: "25% of reserved",
    description: "Certified Madhesi community candidates with quota documentation.",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  {
    key: "Khas Arya",
    label: "Khas Arya",
    labelNp: "खस आर्य",
    share: "17% of reserved",
    description: "Khas Arya community candidates from community/government schools.",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  {
    key: "Dalit",
    label: "Dalit",
    labelNp: "दलित",
    share: "9% of reserved",
    description: "Dalit candidates certified by National Dalit Commission.",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  {
    key: "Tharu",
    label: "Tharu",
    labelNp: "थारु",
    share: "4% of reserved",
    description: "Certified Tharu community candidates.",
    badgeClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  },
  {
    key: "Muslim",
    label: "Muslim",
    labelNp: "मुस्लिम",
    share: "2% of reserved",
    description: "Certified Nepali Muslim community candidates.",
    badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  {
    key: "Pichhadiyako Kshettra",
    label: "Backward Area",
    labelNp: "पिछडिएको क्षेत्र",
    share: "4% of reserved",
    description: "Candidates from 9 remote districts (Humla, Jumla, Mugu, Dolpa, Kalikot, Jajarkot, Bajhang, Bajura, Achham).",
    badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  {
    key: "Apanga",
    label: "Disabled",
    labelNp: "अपाङ्गता",
    share: "2% of reserved",
    description: "Persons with certified disabilities meeting MEC medical eligibility.",
    badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  },
];
