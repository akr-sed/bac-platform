/**
 * Integration test for the SessionEnrollment counter contract.
 *
 * Counter contract (see src/models/SessionEnrollment.ts JSDoc):
 *   - INCREMENT: API route does an atomic findOneAndUpdate with $inc on
 *     Session BEFORE creating the enrollment. There is intentionally NO
 *     post('save') hook — that would double-count or break capacity
 *     enforcement under concurrency.
 *   - DECREMENT: post('findOneAndDelete') hook on SessionEnrollment.
 *
 * This test simulates the route-layer increment manually (atomic $inc) and
 * verifies the post-findOneAndDelete hook decrements correctly.
 *
 * Run: npx tsx scripts/test-session-enrollment-counter.ts
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import assert from 'node:assert/strict';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';
import Session from '../src/models/Session';
import SessionEnrollment from '../src/models/SessionEnrollment';

async function run() {
  await connectToDatabase();

  // Setup: ensure we have a teacher and a student
  let teacher = await User.findOne({ role: 'teacher' });
  let student = await User.findOne({ role: 'student' });

  let createdTeacher = false;
  let createdStudent = false;

  if (!teacher) {
    teacher = await User.create({
      name: 'Test Teacher',
      email: `test-teacher-${Date.now()}@example.com`,
      passwordHash: 'unused',
      role: 'teacher',
    });
    createdTeacher = true;
  }
  if (!student) {
    student = await User.create({
      name: 'Test Student',
      email: `test-student-${Date.now()}@example.com`,
      passwordHash: 'unused',
      role: 'student',
    });
    createdStudent = true;
  }

  // Create a fresh test session
  const session = await Session.create({
    title: 'TDD Counter Test Session',
    description: 'Temporary session for counter test',
    teacherId: teacher._id,
    subject: 'math',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    durationMinutes: 60,
    meetingUrl: 'https://meet.example.com/test',
  });

  console.log('Session created with enrolledCount =', session.enrolledCount);
  assert.equal(session.enrolledCount, 0, 'new session should start at 0');

  // ENROLL → simulate the route-layer atomic $inc, then create the record.
  // (The model no longer increments via post('save'); see contract JSDoc.)
  await Session.updateOne(
    { _id: session._id },
    { $inc: { enrolledCount: 1 } }
  );
  const enrollment = await SessionEnrollment.create({
    userId: student._id,
    sessionId: session._id,
  });

  let refreshed = await Session.findById(session._id);
  console.log('After enroll, enrolledCount =', refreshed?.enrolledCount);
  assert.equal(
    refreshed?.enrolledCount,
    1,
    'enrolledCount should be 1 after first enrollment'
  );

  // UNENROLL via findOneAndDelete → counter back to 0 via post-delete hook.
  await SessionEnrollment.findOneAndDelete({ _id: enrollment._id });
  refreshed = await Session.findById(session._id);
  console.log('After unenroll, enrolledCount =', refreshed?.enrolledCount);
  assert.equal(
    refreshed?.enrolledCount,
    0,
    'enrolledCount should be 0 after unenroll'
  );

  // Cleanup
  await Session.findByIdAndDelete(session._id);
  await SessionEnrollment.deleteMany({ sessionId: session._id });
  if (createdTeacher) await User.findByIdAndDelete(teacher._id);
  if (createdStudent) await User.findByIdAndDelete(student._id);

  console.log('\nPASS: SessionEnrollment counter hooks work correctly.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('\nFAIL:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
