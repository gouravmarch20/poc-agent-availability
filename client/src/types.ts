export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superAdmin' | 'admin' | 'agent' | 'customer';
  // For agent logins: the agent profile this account manages.
  agentId?: string;
  phone: string;
  dob: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  address: string;
  badges: string[];
  bio?: string;
  experienceYears?: number;
  languages?: string[];
  coverUrl?: string;
  pricing: {
    amount: number;
    currency: string;
  };
  images: AgentImage[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentImage {
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  order: number;
  isCover: boolean;
  uploadedAt: string;
  url?: string;
}

export interface Availability {
  id: string;
  date: string;
  agentId: string;
  startTime: string;
  endTime: string;
  purgeAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityItem {
  id: string;
  date: string;
  agentId: string;
  startTime: string;
  endTime: string;
  agent: AvailabilityAgent;
}

export interface AvailabilityAgent {
  id: string;
  name: string;
  phone: string;
  address: string;
  badges: string[];
  pricing: Agent['pricing'];
  coverUrl: string | null;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  path: string;
  type: 'page_view' | 'session_start';
  createdAt: string;
}

export interface AnalyticsSummary {
  today: {
    pageViews: number;
    sessions: number;
  };
  week: {
    pageViews: number;
    sessions: number;
  };
  month: {
    pageViews: number;
    sessions: number;
  };
  cached: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  ready: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export interface UpcomingDates {
  from: string;
  to: string;
  dates: string[];
}


export interface AvailabilityResponse {
  from: string;
  to: string;
  items: AvailabilityItem[];
}