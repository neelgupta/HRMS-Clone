/**
 * Indian Professional Tax Slabs — FY 2025-26
 *
 * Basis: monthly gross salary (same wages used for ESI).
 * Annual PT ceiling is ₹2,500 for most states.
 * States without PT: DL, HR, RJ, UP, MP, BR, JH, HP, UK, AR, CH, etc.
 *
 * Key for each state = 2-letter ISO 3166-2:IN subdivision code.
 * Supported full-name aliases are resolved via STATE_CODE_MAP.
 */

export interface PTSlab {
  minSalary: number;
  maxSalary: number | null; // null = no upper limit
  monthlyPT: number;
  /** Override for February (Maharashtra makes annual total = ₹2,500). */
  febPT?: number;
}

// ---------------------------------------------------------------------------
// Statutory slabs per state
// ---------------------------------------------------------------------------

export const PT_SLABS: Record<string, PTSlab[]> = {
  // Karnataka — PT Act 1976
  // Annual ceiling ₹2,400 (₹200 × 12)
  KA: [
    { minSalary: 0,     maxSalary: 9999,  monthlyPT: 0   },
    { minSalary: 10000, maxSalary: 14999, monthlyPT: 150 },
    { minSalary: 15000, maxSalary: null,  monthlyPT: 200 },
  ],

  // Maharashtra — PT Act 1975
  // Annual ceiling ₹2,500 → top slab pays ₹200 × 11 months + ₹300 in February
  MH: [
    { minSalary: 0,     maxSalary: 7499,  monthlyPT: 0                   },
    { minSalary: 7500,  maxSalary: 9999,  monthlyPT: 175                 },
    { minSalary: 10000, maxSalary: null,  monthlyPT: 200, febPT: 300     },
  ],

  // West Bengal — PT Act 1979
  WB: [
    { minSalary: 0,     maxSalary: 8500,  monthlyPT: 0   },
    { minSalary: 8501,  maxSalary: 10000, monthlyPT: 90  },
    { minSalary: 10001, maxSalary: 15000, monthlyPT: 110 },
    { minSalary: 15001, maxSalary: 25000, monthlyPT: 130 },
    { minSalary: 25001, maxSalary: 40000, monthlyPT: 150 },
    { minSalary: 40001, maxSalary: null,  monthlyPT: 200 },
  ],

  // Andhra Pradesh
  AP: [
    { minSalary: 0,     maxSalary: 15000, monthlyPT: 0   },
    { minSalary: 15001, maxSalary: 20000, monthlyPT: 150 },
    { minSalary: 20001, maxSalary: null,  monthlyPT: 200 },
  ],

  // Telangana (mirrors AP)
  TS: [
    { minSalary: 0,     maxSalary: 15000, monthlyPT: 0   },
    { minSalary: 15001, maxSalary: 20000, monthlyPT: 150 },
    { minSalary: 20001, maxSalary: null,  monthlyPT: 200 },
  ],

  // Tamil Nadu
  TN: [
    { minSalary: 0,     maxSalary: 21000, monthlyPT: 0   },
    { minSalary: 21001, maxSalary: 30000, monthlyPT: 135 },
    { minSalary: 30001, maxSalary: null,  monthlyPT: 182 },
  ],

  // Gujarat
  GJ: [
    { minSalary: 0,     maxSalary: 5999,  monthlyPT: 0   },
    { minSalary: 6000,  maxSalary: 8999,  monthlyPT: 80  },
    { minSalary: 9000,  maxSalary: 11999, monthlyPT: 150 },
    { minSalary: 12000, maxSalary: null,  monthlyPT: 200 },
  ],

  // Punjab
  PB: [
    { minSalary: 0,     maxSalary: 24999, monthlyPT: 0   },
    { minSalary: 25000, maxSalary: null,  monthlyPT: 200 },
  ],

  // Assam
  AS: [
    { minSalary: 0,     maxSalary: 9999,  monthlyPT: 0   },
    { minSalary: 10000, maxSalary: 14999, monthlyPT: 150 },
    { minSalary: 15000, maxSalary: 24999, monthlyPT: 180 },
    { minSalary: 25000, maxSalary: null,  monthlyPT: 208 },
  ],

  // Odisha
  OR: [
    { minSalary: 0,     maxSalary: 9999,  monthlyPT: 0   },
    { minSalary: 10000, maxSalary: 14999, monthlyPT: 100 },
    { minSalary: 15000, maxSalary: 19999, monthlyPT: 150 },
    { minSalary: 20000, maxSalary: null,  monthlyPT: 200 },
  ],

  // Madhya Pradesh (has PT via MP Vritti Kar)
  MP: [
    { minSalary: 0,     maxSalary: 18749, monthlyPT: 0   },
    { minSalary: 18750, maxSalary: null,  monthlyPT: 208 },
  ],

  // Sikkim
  SK: [
    { minSalary: 0,     maxSalary: 19999, monthlyPT: 0   },
    { minSalary: 20000, maxSalary: null,  monthlyPT: 200 },
  ],

  // Kerala (no PT on salary, levy is per trade/profession — zero for employees)
  KL: [],

  // States / UTs with NO Professional Tax on salaried employees
  DL: [], // Delhi
  HR: [], // Haryana
  RJ: [], // Rajasthan
  UP: [], // Uttar Pradesh
  BR: [], // Bihar
  JH: [], // Jharkhand
  HP: [], // Himachal Pradesh
  UK: [], // Uttarakhand
  GA: [], // Goa
  CH: [], // Chandigarh
  PY: [], // Puducherry
  JK: [], // Jammu & Kashmir
  LA: [], // Ladakh
  MN: [], // Manipur
  ML: [], // Meghalaya
  MZ: [], // Mizoram
  NL: [], // Nagaland
  TR: [], // Tripura
  AR: [], // Arunachal Pradesh
};

// ---------------------------------------------------------------------------
// Full-name → code resolver (HR admins may type full state names)
// ---------------------------------------------------------------------------

export const STATE_CODE_MAP: Record<string, string> = {
  karnataka: "KA",
  maharashtra: "MH",
  "west bengal": "WB",
  "andhra pradesh": "AP",
  telangana: "TS",
  "tamil nadu": "TN",
  gujarat: "GJ",
  punjab: "PB",
  assam: "AS",
  odisha: "OR",
  orissa: "OR",
  "madhya pradesh": "MP",
  sikkim: "SK",
  kerala: "KL",
  delhi: "DL",
  haryana: "HR",
  rajasthan: "RJ",
  "uttar pradesh": "UP",
  bihar: "BR",
  jharkhand: "JH",
  "himachal pradesh": "HP",
  uttarakhand: "UK",
  goa: "GA",
  chandigarh: "CH",
  puducherry: "PY",
  pondicherry: "PY",
  "jammu and kashmir": "JK",
  "jammu & kashmir": "JK",
  ladakh: "LA",
  manipur: "MN",
  meghalaya: "ML",
  mizoram: "MZ",
  nagaland: "NL",
  tripura: "TR",
  "arunachal pradesh": "AR",
};

// ---------------------------------------------------------------------------
// Lookup function
// ---------------------------------------------------------------------------

/**
 * Returns the monthly Professional Tax amount for a given gross salary,
 * state, and month.
 *
 * @param grossSalary  Monthly gross salary (same as ESI wage basis)
 * @param state        2-letter state code (e.g. "KA") or full state name
 * @param month        Month number 1–12 (affects February override in MH)
 */
export function getProfessionalTax(
  grossSalary: number,
  state: string,
  month: number
): number {
  if (!state) return 0;

  // Resolve to 2-letter code
  const raw = state.trim();
  const code =
    raw.length === 2
      ? raw.toUpperCase()
      : STATE_CODE_MAP[raw.toLowerCase()] ?? raw.toUpperCase();

  const slabs = PT_SLABS[code];
  if (!slabs || slabs.length === 0) return 0;

  const slab = slabs.find(
    (s) =>
      grossSalary >= s.minSalary &&
      (s.maxSalary === null || grossSalary <= s.maxSalary)
  );

  if (!slab) return 0;

  // Maharashtra top-slab February override
  if (code === "MH" && month === 2 && slab.febPT !== undefined) {
    return slab.febPT;
  }

  return slab.monthlyPT;
}
