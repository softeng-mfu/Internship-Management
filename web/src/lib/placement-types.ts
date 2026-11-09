export type Placement = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  category: string;
  work_mode: "remote" | "hybrid" | "on-site";
  skills: string[];
  allowance_thb: number | null;
  duration_weeks: number;
  application_deadline: string;
  status: "open";
  is_demo: boolean;
  published_at: string;
  updated_at: string;
  details_url: string;
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
  };
};
