import type { Agent, Availability, User } from '../types';

export type DemoUser = User & { password: string };

export interface DailyStat {
  date: string;
  pageViews: number;
  sessions: number;
}

export interface DemoDb {
  users: DemoUser[];
  agents: Agent[];
  availability: Availability[];
  stats: DailyStat[];
}

const TZ = 'Asia/Kolkata';

export function ymd(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
}

export function todayYmd(): string {
  return ymd(new Date());
}

export function addDays(day: string, days: number): string {
  const base = new Date(`${day}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function user(
  id: string, name: string, email: string, password: string, role: User['role'], phone: string, dob: string,
  { daysAgo = 0, isActive = true } = {},
): DemoUser {
  const created = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { id, name, email, password, role, phone, dob, isActive, createdAt: created, updatedAt: created };
}

// 800px portraits so the full-screen preview stays sharp.
const PORTRAIT = (face: number) => `https://i.pravatar.cc/800?img=${face}`;

interface Profile {
  bio: string;
  experienceYears: number;
  languages: string[];
}

function agent(id: string, name: string, phone: string, address: string, badges: string[], amount: number, photos: number[], profile: Profile): Agent {
  const now = new Date().toISOString();
  const urls = photos.map(PORTRAIT);
  return {
    id,
    name,
    phone,
    address,
    badges,
    ...profile,
    pricing: { amount, currency: 'INR' },
    coverUrl: urls[0],
    images: urls.map((url, order) => ({
      fileId: `${id}-img${order + 1}`,
      filename: `${name} ${order + 1}.jpg`,
      contentType: 'image/jpeg',
      size: 0,
      order,
      isCover: order === 0,
      uploadedAt: now,
      url,
    })),
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

const DEFAULT_ON_DUTY = 3;

export function buildSeed(): DemoDb {
  const today = todayYmd();
  const agents = [
    agent('a1', 'Priya Sharma', '+91-8800112233', '123 MG Road, Bangalore', ['Certified', 'Top Rated', 'Verified'], 500, [44, 5, 16, 27], {
      bio: 'Calm and detail-oriented, Priya has guided hundreds of clients from their first consultation to a confident decision. She keeps every session practical, clear and unhurried.',
      experienceYears: 8,
      languages: ['English', 'Hindi', 'Kannada'],
    }),
    agent('a2', 'Rajesh Kumar', '+91-8800112234', '456 Indiranagar, Bangalore', ['Experienced', 'Expert', 'Premium'], 750, [59, 18, 53, 13], {
      bio: 'A senior specialist known for straight answers and thorough preparation. Rajesh works best with clients who want a structured plan and honest advice.',
      experienceYears: 12,
      languages: ['English', 'Hindi', 'Tamil'],
    }),
    agent('a3', 'Sophia Patel', '+91-8800112235', '789 Whitefield, Bangalore', ['Certified', 'Recommended', 'Intermediate'], 600, [32, 26, 36, 28, 45], {
      bio: 'Friendly and approachable, Sophia is a client favourite for making complex topics easy to follow. She is flexible with timings and happy to answer follow-up questions.',
      experienceYears: 5,
      languages: ['English', 'Gujarati', 'Hindi'],
    }),
    agent('a4', 'Arjun Mehta', '+91-8800112236', '12 Koramangala, Bangalore', ['New', 'Intermediate'], 400, [12, 60, 68], {
      bio: 'Recently certified and full of energy. Arjun is building his client list and brings fresh ideas and plenty of time for every session.',
      experienceYears: 2,
      languages: ['English', 'Hindi'],
    }),
    agent('a5', 'Neha Verma', '+91-8800112237', '88 HSR Layout, Bangalore', ['New', 'Beginner', 'Budget Friendly'], 300, [25, 42, 47], {
      bio: 'New to the platform with a gentle, patient style. Neha is a great first choice if you are trying this for the first time and want a low-pressure start.',
      experienceYears: 1,
      languages: ['English', 'Hindi', 'Bengali'],
    }),
    agent('a6', 'Kavya Nair', '+91-8800112238', '5 Jayanagar 4th Block, Bangalore', ['Certified', 'Expert'], 850, [9, 23, 49], {
      bio: 'A seasoned practitioner who explains every step before she begins. Kavya is popular with clients who value a thorough, well-documented process.',
      experienceYears: 9,
      languages: ['English', 'Malayalam', 'Hindi'],
    }),
    agent('a7', 'Vikram Singh', '+91-8800112239', '27 Malleshwaram, Bangalore', ['Experienced', 'Top Rated'], 900, [52, 14, 33], {
      bio: 'With over a decade in the field, Vikram is the one people ask for by name. Direct, reliable and always prepared.',
      experienceYears: 14,
      languages: ['English', 'Hindi', 'Punjabi'],
    }),
    agent('a8', 'Ananya Iyer', '+91-8800112240', '9 JP Nagar 2nd Phase, Bangalore', ['Verified', 'Recommended', 'Intermediate'], 550, [38, 43, 31], {
      bio: 'Warm, organised and quick to put people at ease. Ananya offers evening slots that suit busy working schedules.',
      experienceYears: 4,
      languages: ['English', 'Tamil', 'Kannada'],
    }),
    agent('a9', 'Karan Malhotra', '+91-8800112241', '1 UB City Road, Bangalore', ['Premium', 'Expert'], 1200, [54, 55, 57, 11], {
      bio: 'Our most senior specialist, trusted for complex cases and high-stakes decisions. Karan offers a premium, one-to-one experience.',
      experienceYears: 15,
      languages: ['English', 'Hindi'],
    }),
    agent('a10', 'Meera Reddy', '+91-8800112242', '63 Electronic City Phase 1, Bangalore', ['New', 'Budget Friendly', 'Beginner'], 350, [20, 29, 30], {
      bio: 'Just starting out and keen to prove herself. Meera keeps her rates low and gives every client her full attention.',
      experienceYears: 1,
      languages: ['English', 'Telugu', 'Hindi'],
    }),
  ];

  const now = new Date().toISOString();
  const availability: Availability[] = [];
  for (let offset = -1; offset <= 6; offset += 1) {
    const date = addDays(today, offset);
    // Only the first three agents are on duty by default; the rest are assigned manually from the admin Availability page.
    agents.slice(0, DEFAULT_ON_DUTY).forEach((item) => {
      availability.push({
        id: `s-${item.id}-${date}`,
        date,
        agentId: item.id,
        startTime: '09:00',
        endTime: '18:00',
        purgeAt: addDays(date, 180),
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  const stats: DailyStat[] = [];
  for (let offset = -34; offset <= 0; offset += 1) {
    const sessions = 6 + ((offset * offset + 7) % 9);
    stats.push({ date: addDays(today, offset), sessions, pageViews: sessions * 4 + ((offset * 3 + 100) % 7) });
  }

  return {
    users: [
      user('u1', 'Super Admin', 'superadmin@gmail.com', 'supper@123', 'superAdmin', '+91-9876543200', '1985-01-01'),
      user('u2', 'Admin', 'admin@local.test', 'Admin@123', 'admin', '+91-9876543201', '1988-02-02'),
      user('u3', 'Admin User', 'admin.user@local.test', 'Admin@123', 'admin', '+91-9876543213', '1989-04-04'),
      { ...user('u4', 'Priya Sharma', 'agent.priya@local.test', 'Agent@123', 'agent', '+91-8800112233', '1990-05-15'), agentId: 'a1' },
      { ...user('u5', 'Rajesh Kumar', 'agent.rajesh@local.test', 'Agent@123', 'agent', '+91-8800112234', '1986-08-22'), agentId: 'a2' },
      { ...user('u6', 'Sophia Patel', 'agent.sophia@local.test', 'Agent@123', 'agent', '+91-8800112235', '1992-03-10'), agentId: 'a3' },
      user('u7', 'Demo Customer', 'customer@local.test', 'Customer@123', 'customer', '+91-9123456789', '1994-06-06', { daysAgo: 62 }),
      user('u8', 'Alice Fernandes', 'customer.alice@local.test', 'Customer@123', 'customer', '+91-9123456780', '1995-12-25', { daysAgo: 45 }),
      user('u9', 'Bob Thomas', 'customer.bob@local.test', 'Customer@123', 'customer', '+91-9123456781', '1993-07-18', { daysAgo: 38 }),
      user('u10', 'Riya Kapoor', 'riya.kapoor@gmail.com', 'Customer@123', 'customer', '+91-9123456782', '1996-03-14', { daysAgo: 27 }),
      user('u11', 'Sameer Joshi', 'sameer.joshi@gmail.com', 'Customer@123', 'customer', '+91-9123456783', '1991-11-02', { daysAgo: 19 }),
      user('u12', 'Divya Menon', 'divya.menon@gmail.com', 'Customer@123', 'customer', '+91-9123456784', '1998-01-29', { daysAgo: 12 }),
      user('u13', 'Rohan Das', 'rohan.das@gmail.com', 'Customer@123', 'customer', '+91-9123456785', '1990-09-09', { daysAgo: 8, isActive: false }),
      user('u14', 'Isha Gupta', 'isha.gupta@gmail.com', 'Customer@123', 'customer', '+91-9123456786', '1997-05-21', { daysAgo: 3 }),
      user('u15', 'Aman Verma', 'aman.verma@gmail.com', 'Customer@123', 'customer', '+91-9123456787', '1994-12-12', { daysAgo: 1 }),
    ],
    agents,
    availability,
    stats,
  };
}

export const DEMO_ACCOUNTS = [
  { tone: 'admin', label: 'Admin', description: 'Manage agents, availability and customers', email: 'admin@local.test', password: 'Admin@123' },
  { tone: 'agent', label: 'Agent', description: 'Edit your profile and see other agents', email: 'agent.priya@local.test', password: 'Agent@123' },
  { tone: 'customer', label: 'Customer', description: 'Browse agents and their availability', email: 'customer@local.test', password: 'Customer@123' },
] as const;
