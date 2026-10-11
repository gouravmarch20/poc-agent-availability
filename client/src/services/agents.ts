import { api } from '../api';
import { AgentListResponseSchema, AgentResponseSchema, OkResponseSchema } from '../apiSchemas';
import { Agent } from '../types';

export type AgentPayload = Pick<Agent, 'name' | 'phone' | 'address' | 'badges' | 'pricing'>
  & Partial<Pick<Agent, 'bio' | 'experienceYears' | 'languages'>>;

export function listAgents(signal?: AbortSignal) {
  return api('/api/agents', { signal, responseSchema: AgentListResponseSchema });
}

export function getAgent(id: string | undefined, signal?: AbortSignal) {
  return api(`/api/agents/${id}`, { signal, responseSchema: AgentResponseSchema });
}

export function createAgent(payload: AgentPayload, photos: File[]) {
  const formData = new FormData();
  formData.append('agent', JSON.stringify(payload));
  photos.forEach((photo) => formData.append('images', photo));
  return api('/api/agents', { method: 'POST', formData, responseSchema: AgentResponseSchema });
}

export function updateAgent(id: string, payload: AgentPayload) {
  return api(`/api/agents/${id}`, { method: 'PATCH', json: payload, responseSchema: AgentResponseSchema });
}

export function deleteAgent(id: string) {
  return api(`/api/agents/${id}`, { method: 'DELETE', responseSchema: OkResponseSchema });
}

export function uploadAgentImages(id: string, files: FormData) {
  return api(`/api/agents/${id}/images`, { method: 'POST', formData: files, responseSchema: AgentResponseSchema });
}

export function deleteAgentImage(agentId: string, fileId: string) {
  return api(`/api/agents/${agentId}/images/${fileId}`, {
    method: 'DELETE',
    responseSchema: AgentResponseSchema,
  });
}

export function updateAgentImages(agentId: string, images: { fileId: string; order: number; isCover: boolean }[]) {
  return api(`/api/agents/${agentId}/images`, {
    method: 'PATCH',
    json: { images },
    responseSchema: AgentResponseSchema,
  });
}

export type MyProfilePayload = Pick<Agent, 'name' | 'phone'> & { bio: string };

// The agent profile linked to the signed-in agent account.
export function getMyAgent(signal?: AbortSignal) {
  return api('/api/agents/me', { signal, responseSchema: AgentResponseSchema });
}

export function updateMyAgent(payload: MyProfilePayload) {
  return api('/api/agents/me', { method: 'PATCH', json: payload, responseSchema: AgentResponseSchema });
}
