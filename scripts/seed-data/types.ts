export interface SeedCampus {
  name: string;
  city?: string;
  isMain: boolean;
}

export interface SeedDepartment {
  name: string;
  faculty?: string;
}

export interface SeedUniversity {
  seedKey: string;
  name: string;
  shortName?: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  city: string;
  state?: string;
  website?: string;
  domain?: string;
  timezone: string;
  isVerified: boolean;
  campuses: SeedCampus[];
  departments: SeedDepartment[];
}
