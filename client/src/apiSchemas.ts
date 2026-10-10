import { z } from 'zod';

const PricingSchema = z.object({
  amount: z.number(),
  currency: z.string(),
}).passthrough();

const AgentImageSchema = z.object({
  fileId: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
  order: z.number(),
  isCover: z.boolean(),
  uploadedAt: z.string(),
  url: z.string(),
}).passthrough();

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  badges: z.array(z.string()),
  coverUrl: z.string().optional(),
  pricing: PricingSchema,
  images: z.array(AgentImageSchema),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough();

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['superAdmin', 'admin', 'agent', 'customer']),
  phone: z.string(),
  dob: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough();

const AvailabilitySchema = z.object({
  id: z.string(),
  date: z.string(),
  agentId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  purgeAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough();

const AvailabilityAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  badges: z.array(z.string()),
  pricing: PricingSchema,
  coverUrl: z.string().nullable(),
}).passthrough();

const AvailabilityItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  agentId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  agent: AvailabilityAgentSchema,
}).passthrough();

const AnalyticsPeriodSchema = z.object({
  pageViews: z.number(),
  sessions: z.number(),
}).passthrough();

export const AnalyticsSummarySchema = z.object({
  today: AnalyticsPeriodSchema,
  week: AnalyticsPeriodSchema,
  month: AnalyticsPeriodSchema,
  cached: z.boolean(),
}).passthrough();

export const UpcomingDatesSchema = z.object({
  from: z.string(),
  to: z.string(),
  dates: z.array(z.string()),
}).passthrough();

export const AgentListResponseSchema = z.object({ agents: z.array(AgentSchema) }).passthrough();
export const AgentResponseSchema = z.object({ agent: AgentSchema }).passthrough();
export const UserListResponseSchema = z.object({ users: z.array(UserSchema) }).passthrough();
export const UserResponseSchema = z.object({ user: UserSchema }).passthrough();
export const AvailabilityResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  items: z.array(AvailabilityItemSchema),
}).passthrough();
export const SlotResponseSchema = z.object({ slot: AvailabilitySchema }).passthrough();
export const OkResponseSchema = z.object({ ok: z.literal(true) }).passthrough();