import type { HydratedDocument } from 'mongoose';
import { Agent, AgentRecord } from '../models/Agent.js';

export type NewAgent = Pick<AgentRecord, 'name' | 'phone' | 'address' | 'badges' | 'pricing'>;

export function listAgents(includeDeleted: boolean) {
  return Agent.find(includeDeleted ? {} : { isDeleted: false }).sort({ name: 1 });
}

export function findAgentById(id: string) {
  return Agent.findById(id);
}

export function findActiveAgentsByIds(ids: string[]) {
  return Agent.find({ _id: { $in: ids }, isDeleted: false });
}

export function createAgent(agent: NewAgent) {
  return Agent.create(agent);
}

export function saveAgent(agent: HydratedDocument<AgentRecord>) {
  return agent.save();
}