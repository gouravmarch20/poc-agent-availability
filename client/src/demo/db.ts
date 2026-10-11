import { buildSeed, todayYmd, type DemoDb, type DemoUser } from './seed';

const DB_KEY = 'demo:db:v10';
const SESSION_KEY = 'demo:session';

let memory: DemoDb | null = null;

export function loadDb(): DemoDb {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(DB_KEY);
    if (raw) {
      memory = JSON.parse(raw) as DemoDb;
      return memory;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  memory = buildSeed();
  saveDb();
  return memory;
}

export function saveDb(): void {
  if (!memory) return;
  try {
    sessionStorage.setItem(DB_KEY, JSON.stringify(memory));
  } catch {
    /* storage full or blocked: keep working from memory */
  }
}

export function resetDemo(): void {
  memory = null;
  try {
    // Clears the data, the signed-in session and the dismissed welcome tips.
    Object.keys(sessionStorage).filter((key) => key.startsWith('demo:')).forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function currentUser(): DemoUser | null {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    return id ? loadDb().users.find((item) => item.id === id) ?? null : null;
  } catch {
    return null;
  }
}

export function setSession(userId: string | null): void {
  try {
    if (userId) sessionStorage.setItem(SESSION_KEY, userId);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function bumpStats(type: 'pageViews' | 'sessions'): void {
  const db = loadDb();
  const today = todayYmd();
  let row = db.stats.find((item) => item.date === today);
  if (!row) {
    row = { date: today, pageViews: 0, sessions: 0 };
    db.stats.push(row);
  }
  row[type] += 1;
  saveDb();
}
