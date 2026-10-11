import type { Agent, AgentImage, Availability } from '../types';
import { bumpStats, currentUser, loadDb, saveDb, setSession } from './db';
import { addDays, todayYmd, type DemoUser } from './seed';

interface DemoInit {
  method?: string;
  body?: BodyInit | null;
}

interface Result {
  status: number;
  body: unknown;
}

const MAX_IMAGES = 10;
const ok = (body: unknown, status = 200): Result => ({ status, body });
const fail = (status: number, error: string): Result => ({ status, body: { error } });
const uid = () => Math.random().toString(36).slice(2, 10);
const delay = () => new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 180));

function publicUser({ password: _password, ...rest }: DemoUser) {
  return rest;
}

function touch<T extends { updatedAt: string }>(item: T): T {
  item.updatedAt = new Date().toISOString();
  return item;
}

function normalizeAgent(agent: Agent): Agent {
  agent.images.sort((a, b) => a.order - b.order);
  const cover = agent.images.find((image) => image.isCover) ?? agent.images[0];
  agent.images.forEach((image) => { image.isCover = image === cover; });
  agent.coverUrl = cover?.url;
  return touch(agent);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();
      image.onerror = () => resolve(source);
      image.onload = () => {
        // Shrink so several photos fit within sessionStorage's quota.
        const scale = Math.min(1, 800 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

async function buildImages(files: File[], startOrder: number, hasCover: boolean): Promise<AgentImage[]> {
  const images: AgentImage[] = [];
  for (const [index, file] of files.entries()) {
    images.push({
      fileId: uid(),
      filename: file.name || 'image',
      contentType: 'image/jpeg',
      size: file.size,
      order: startOrder + index,
      isCover: !hasCover && index === 0,
      uploadedAt: new Date().toISOString(),
      url: await fileToDataUrl(file),
    });
  }
  return images;
}

function parseJson(body: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof body !== 'string') return {};
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function route(method: string, url: URL, body: BodyInit | null | undefined): Promise<Result> {
  const db = loadDb();
  const parts = url.pathname.replace(/^\/api\//, '').split('/');
  const [resource, id, sub, subId] = parts;
  const json = parseJson(body);

  if (resource === 'auth') {
    if (id === 'login') {
      const email = String(json.email ?? '').toLowerCase();
      const found = db.users.find((item) => item.email.toLowerCase() === email);
      if (!found || !found.isActive || found.password !== json.password) return fail(401, 'Invalid credentials');
      setSession(found.id);
      bumpStats('sessions');
      return ok({ user: publicUser(found) });
    }
    if (id === 'logout') {
      setSession(null);
      return ok({ ok: true });
    }
  }

  const me = currentUser();
  if (!me?.isActive) return fail(401, 'Unauthorized');
  const isStaff = me.role === 'admin' || me.role === 'superAdmin';

  if (resource === 'auth') {
    if (id === 'me') return ok({ user: publicUser(me) });
    if (id === 'change-password') {
      if (json.currentPassword !== me.password) return fail(400, 'Current password is incorrect');
      me.password = String(json.newPassword);
      saveDb();
      return ok({ ok: true });
    }
  }

  // Only staff and the agent themself see an agent's phone number.
  const visible = (agent: Agent): Agent => (isStaff || agent.id === me.agentId ? agent : { ...agent, phone: '' });

  if (resource === 'agents') {
    if (id === 'me') {
      const mine = db.agents.find((item) => item.id === me.agentId && !item.isDeleted);
      if (!mine) return fail(404, 'No agent profile is linked to this account');
      if (method === 'GET') return ok({ agent: mine });
      if (method !== 'PATCH') return fail(405, 'Method not allowed');
      // Agents may change only their name, phone and bio. ID, price and the rest are admin-only.
      const name = String(json.name ?? mine.name).trim();
      const phone = String(json.phone ?? mine.phone).trim();
      const bio = String(json.bio ?? mine.bio ?? '').trim();
      const details: { path: string; message: string }[] = [];
      if (!name || name.length > 80) details.push({ path: 'name', message: 'Name must be 1 to 80 characters.' });
      if (phone.length < 5 || phone.length > 20) details.push({ path: 'phone', message: 'Phone must be 5 to 20 characters.' });
      if (bio.length > 600) details.push({ path: 'bio', message: 'Bio must be 600 characters or fewer.' });
      if (details.length) return { status: 400, body: { error: 'Some submitted values are invalid.', details } };
      Object.assign(mine, { name, phone, bio });
      touch(mine);
      me.name = name;
      saveDb();
      return ok({ agent: mine });
    }
    if (method === 'GET' && !id) return ok({ agents: db.agents.filter((item) => !item.isDeleted).map(visible) });
    if (method === 'GET') {
      const found = db.agents.find((item) => item.id === id);
      return found ? ok({ agent: visible(found) }) : fail(404, 'Agent not found');
    }
    if (!isStaff) return fail(403, 'Forbidden');

    if (method === 'POST' && !id) {
      const form = body instanceof FormData ? body : new FormData();
      const payload = parseJson(String(form.get('agent') ?? ''));
      const files = form.getAll('images').filter((item): item is File => item instanceof File);
      if (!files.length) return fail(400, 'Add at least one photo for the new agent.');
      const now = new Date().toISOString();
      const created = normalizeAgent({
        id: `a-${uid()}`,
        name: String(payload.name ?? ''),
        phone: String(payload.phone ?? ''),
        address: String(payload.address ?? ''),
        badges: (payload.badges as string[]) ?? [],
        bio: payload.bio as string | undefined,
        experienceYears: payload.experienceYears as number | undefined,
        languages: payload.languages as string[] | undefined,
        pricing: (payload.pricing as Agent['pricing']) ?? { amount: 0, currency: 'INR' },
        images: await buildImages(files, 0, false),
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
      db.agents.unshift(created);
      saveDb();
      return ok({ agent: created }, 201);
    }

    const target = db.agents.find((item) => item.id === id && !item.isDeleted);
    if (!target) return fail(404, 'Agent not found');

    if (method === 'PATCH' && !sub) {
      Object.assign(target, json);
      touch(target);
      saveDb();
      return ok({ agent: target });
    }
    if (method === 'DELETE' && !sub) {
      target.isDeleted = true;
      touch(target);
      saveDb();
      return ok({ ok: true });
    }
    if (sub === 'images') {
      if (method === 'POST') {
        const form = body instanceof FormData ? body : new FormData();
        const files = form.getAll('images').filter((item): item is File => item instanceof File);
        if (!files.length) return fail(400, 'No images uploaded');
        if (target.images.length + files.length > MAX_IMAGES) return fail(400, `Maximum ${MAX_IMAGES} images per agent`);
        const added = await buildImages(files, target.images.length, target.images.some((image) => image.isCover));
        target.images.push(...added);
      } else if (method === 'DELETE') {
        if (!target.images.some((image) => image.fileId === subId)) return fail(404, 'Image not found');
        if (target.images.length === 1) return fail(409, 'Each agent must keep at least one photo.');
        target.images = target.images.filter((image) => image.fileId !== subId);
        target.images.forEach((image, order) => { image.order = order; });
      } else if (method === 'PATCH') {
        const items = (json.images as { fileId: string; order: number; isCover: boolean }[]) ?? [];
        items.forEach((item) => {
          const image = target.images.find((entry) => entry.fileId === item.fileId);
          if (image) Object.assign(image, { order: item.order, isCover: Boolean(item.isCover) });
        });
      }
      normalizeAgent(target);
      saveDb();
      return ok({ agent: target }, method === 'POST' ? 201 : 200);
    }
  }

  if (resource === 'availability') {
    if (id === 'upcoming') {
      const from = todayYmd();
      const dates = [...new Set(db.availability.map((slot) => slot.date))].sort();
      return ok({ from, to: addDays(from, 14), dates });
    }
    if (method === 'GET') {
      const from = url.searchParams.get('date') || url.searchParams.get('from') || todayYmd();
      const to = url.searchParams.get('to') || from;
      const items = db.availability
        .filter((slot) => slot.date >= from && slot.date <= to)
        .flatMap((slot) => {
          const found = db.agents.find((item) => item.id === slot.agentId && !item.isDeleted);
          if (!found) return [];
          const { id: agentId, name, phone, address, badges, pricing, coverUrl } = visible(found);
          return [{ ...slot, agent: { id: agentId, name, phone, address, badges, pricing, coverUrl: coverUrl ?? null } }];
        });
      return ok({ from, to, items });
    }
    if (!isStaff) return fail(403, 'Forbidden');

    const conflict = (date: string, agentId: string, ignoreId?: string) => db.availability
      .some((slot) => slot.date === date && slot.agentId === agentId && slot.id !== ignoreId);
    const badRange = (start: string, end: string) => !start || !end || start >= end;

    if (method === 'POST') {
      const { date, agentId, startTime, endTime } = json as Record<string, string>;
      if (badRange(startTime, endTime)) return fail(400, 'Invalid time range');
      if (!db.agents.some((item) => item.id === agentId && !item.isDeleted)) return fail(404, 'Agent not found');
      if (conflict(date, agentId)) return fail(409, 'Agent already assigned on this date');
      const now = new Date().toISOString();
      const slot: Availability = {
        id: `s-${uid()}`, date, agentId, startTime, endTime, purgeAt: addDays(date, 180), createdAt: now, updatedAt: now,
      };
      db.availability.push(slot);
      saveDb();
      return ok({ slot }, 201);
    }
    const slot = db.availability.find((item) => item.id === id);
    if (!slot) return fail(404, 'Slot not found');
    if (method === 'PATCH') {
      const next = { ...slot, ...json } as Availability;
      if (badRange(next.startTime, next.endTime)) return fail(400, 'Invalid time range');
      if (conflict(next.date, next.agentId, slot.id)) return fail(409, 'Agent already assigned on this date');
      Object.assign(slot, next);
      touch(slot);
      saveDb();
      return ok({ slot });
    }
    if (method === 'DELETE') {
      db.availability = db.availability.filter((item) => item.id !== id);
      saveDb();
      return ok({ ok: true });
    }
  }

  if (resource === 'users') {
    if (!isStaff) return fail(403, 'Forbidden');
    if (method === 'GET') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const role = url.searchParams.get('role');
      const users = db.users
        .filter((item) => !role || item.role === role)        .filter((item) => me.role === 'superAdmin' || item.role !== 'superAdmin')
        .filter((item) => !q || [item.name, item.email, item.phone].some((field) => field.toLowerCase().includes(q)));
      return ok({ users: users.map(publicUser) });
    }
    if (method === 'POST') {
      const email = String(json.email ?? '').toLowerCase();
      if (db.users.some((item) => item.email.toLowerCase() === email)) return fail(409, 'Email already exists');
      const now = new Date().toISOString();
      const created: DemoUser = {
        id: `u-${uid()}`,
        name: String(json.name ?? ''),
        email,
        password: String(json.password ?? ''),
        role: json.role as DemoUser['role'],
        phone: String(json.phone ?? ''),
        dob: String(json.dob ?? ''),
        isActive: json.isActive !== false,
        createdAt: now,
        updatedAt: now,
      };
      db.users.unshift(created);
      saveDb();
      return ok({ user: publicUser(created) }, 201);
    }
    const target = db.users.find((item) => item.id === id);
    if (!target) return fail(404, 'User not found');
    if (method === 'PATCH') {
      if (json.isActive === false && target.id === me.id) return fail(409, 'You cannot soft-delete your own account');
      if (typeof json.isActive === 'boolean') target.isActive = json.isActive;
      touch(target);
      saveDb();
      return ok({ user: publicUser(target) });
    }
    if (method === 'DELETE') {
      if (me.role !== 'superAdmin') return fail(403, 'Forbidden');
      if (target.id === me.id) return fail(409, 'You cannot permanently delete your own account');
      db.users = db.users.filter((item) => item.id !== id);
      saveDb();
      return ok({ ok: true });
    }
  }

  if (resource === 'analytics') {
    if (id === 'events' && method === 'POST') {
      bumpStats('pageViews');
      return ok({ ok: true }, 201);
    }
    if (id === 'stats') {
      const today = todayYmd();
      const monthStart = `${today.slice(0, 8)}01`;
      const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
      const weekStart = addDays(today, -weekday);
      const sum = (from: string) => db.stats
        .filter((row) => row.date >= from)
        .reduce((acc, row) => ({ pageViews: acc.pageViews + row.pageViews, sessions: acc.sessions + row.sessions }), { pageViews: 0, sessions: 0 });
      return ok({ today: sum(today), week: sum(weekStart), month: sum(monthStart), cached: false });
    }
  }

  return fail(404, 'Not found');
}

export async function demoFetch(path: string, init: DemoInit): Promise<Response> {
  await delay();
  const result = await route((init.method ?? 'GET').toUpperCase(), new URL(path, window.location.origin), init.body);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
