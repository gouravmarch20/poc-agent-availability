import type { HydratedDocument } from 'mongoose';
import { Availability, AvailabilityRecord } from '../models/Availability.js';

export type NewAvailability = Pick<AvailabilityRecord, 'date' | 'agentId' | 'startTime' | 'endTime' | 'purgeAt'>;

export function listAvailability(from: string, to: string) {
  return Availability.find({ date: { $gte: from, $lte: to } }).sort({ date: 1, startTime: 1 });
}

export function findAvailabilityById(id: string) {
  return Availability.findById(id);
}

export function createAvailability(slot: NewAvailability) {
  return Availability.create(slot);
}

export function saveAvailability(slot: HydratedDocument<AvailabilityRecord>) {
  return slot.save();
}

export function deleteAvailability(id: string) {
  return Availability.findByIdAndDelete(id);
}