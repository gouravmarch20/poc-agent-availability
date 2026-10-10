import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';
import { AnalyticsEvent } from '../../models/AnalyticsEvent.js';
import { Agent } from '../../models/Agent.js';
import { Availability } from '../../models/Availability.js';
import { User } from '../../models/User.js';
import { MigrationDefinition } from '../types.js';

const migration: MigrationDefinition = {
  version: 'v2',
  name: 'seed_test_data',
  async up() {
    const users = [
      { name: 'Agent John', email: 'agent.john@local.test', password: 'Agent@123', role: 'agent', phone: '+91-9876543210', dob: '1990-05-15' },
      { name: 'Agent Sarah', email: 'agent.sarah@local.test', password: 'Agent@123', role: 'agent', phone: '+91-9876543211', dob: '1992-08-22' },
      { name: 'Agent Mike', email: 'agent.mike@local.test', password: 'Agent@123', role: 'agent', phone: '+91-9876543212', dob: '1988-03-10' },
      { name: 'Customer Alice', email: 'customer.alice@local.test', password: 'Customer@123', role: 'customer', phone: '+91-9123456780', dob: '1995-12-25' },
      { name: 'Customer Bob', email: 'customer.bob@local.test', password: 'Customer@123', role: 'customer', phone: '+91-9123456781', dob: '1993-07-18' },
      { name: 'Admin User', email: 'admin.user@local.test', password: 'Admin@123', role: 'admin', phone: '+91-9876543213', dob: '1985-01-01' },
    ];

    for (const userData of users) {
      const email = userData.email.toLowerCase();
      const existing = await User.findOne({ email });
      if (!existing) {
        await User.create({
          name: userData.name,
          email,
          passwordHash: await bcrypt.hash(userData.password, 12),
          role: userData.role,
          phone: userData.phone,
          dob: userData.dob,
          isActive: true,
        });
      }
    }

    const agentData = [
      { name: 'Priya Sharma', phone: '+91-8800112233', address: '123 MG Road, Bangalore', badges: ['Certified', 'Top Rated'], pricing: { amount: 500, currency: 'INR' } },
      { name: 'Rajesh Kumar', phone: '+91-8800112234', address: '456 Indiranagar, Bangalore', badges: ['Experienced', 'Expert'], pricing: { amount: 750, currency: 'INR' } },
      { name: 'Sophia Patel', phone: '+91-8800112235', address: '789 Whitefield, Bangalore', badges: ['Certified', 'Recommended'], pricing: { amount: 600, currency: 'INR' } },
    ];

    const agents = [];
    for (const agentDataItem of agentData) {
      const existing = await Agent.findOne({ phone: agentDataItem.phone });
      agents.push(existing ?? await Agent.create(agentDataItem));
    }

    const today = DateTime.now().setZone('Asia/Kolkata');
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const date = today.plus({ days: dayOffset }).toISODate();
      if (!date) throw new Error('Could not create a test availability date');
      const purgeAt = today.plus({ days: dayOffset + 180 }).toJSDate();

      for (const agent of agents) {
        await Availability.updateOne(
          { agentId: agent._id, date },
          {
            $setOnInsert: {
              agentId: agent._id,
              date,
              startTime: '09:00',
              endTime: '18:00',
              purgeAt,
            },
          },
          { upsert: true }
        );
      }
    }

    const analyticsUsers = await User.find({
      email: { $in: ['agent.john@local.test', 'customer.alice@local.test', 'admin.user@local.test'] },
    });
    const userIdByEmail = new Map(analyticsUsers.map((user) => [user.email, user._id]));
    const eventDefinitions = [
      { email: 'agent.john@local.test', path: '/today', type: 'page_view' },
      { email: 'agent.john@local.test', path: '/account', type: 'page_view' },
      { email: 'customer.alice@local.test', path: '/', type: 'session_start' },
      { email: 'customer.alice@local.test', path: '/agents', type: 'page_view' },
      { email: 'customer.alice@local.test', path: '/agents/1', type: 'page_view' },
      { email: 'admin.user@local.test', path: '/admin', type: 'session_start' },
      { email: 'admin.user@local.test', path: '/admin/agents', type: 'page_view' },
      { email: 'admin.user@local.test', path: '/admin/availability', type: 'page_view' },
      { email: 'admin.user@local.test', path: '/admin/analytics', type: 'page_view' },
      { path: '/', type: 'session_start' },
      { path: '/agents', type: 'page_view' },
    ] as const;

    const analyticsEvents = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      for (let repeat = 0; repeat < 3; repeat += 1) {
        for (const event of eventDefinitions) {
          const eventDate = today.minus({ days: dayOffset }).toJSDate();
          analyticsEvents.push({
            userId: event.email ? userIdByEmail.get(event.email) ?? null : null,
            path: event.path,
            type: event.type,
            createdAt: new Date(eventDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
          });
        }
      }
    }
    await AnalyticsEvent.insertMany(analyticsEvents);
  },
};

export default migration;