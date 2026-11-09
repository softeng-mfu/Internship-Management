export type Placement = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  category: string;
  work_mode: "remote" | "hybrid" | "on-site" | "unspecified";
  skills: string[];
  allowance_thb: number | null;
  duration_weeks: number | null;
  application_deadline: string | null;
  status: "open";
  is_demo: boolean;
  published_at: string;
  updated_at: string;
  details_url: string;
  source?: "team18-job-board";
  source_job_id?: number;
  salary_text?: string | null;
  required_skills?: string | null;
  responsibilities?: string | null;
  qualifications?: string | null;
  benefits?: string | null;
};
export type PlacementList = {
  success: true;
  data: Placement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
  };
  meta: {
    api_version: string;
    request_id: string;
    timestamp: string;
    data_source: string;
    categories?: string[];
  };
};
