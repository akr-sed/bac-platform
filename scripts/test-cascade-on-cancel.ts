/**
 * Integration test: enrollment cascade on Session cancellation.
 *
 * Creates a session, enrolls 3 students, then cancels the session via the
 * DELETE endpoint (which performs a soft-delete: status='cancelled' +
 * sessionDoc.save()). Asserts:
 *   - all 3 SessionEnrollment records are gone after cancellation
 *   - enrolledCount on the Session is 0
 *
 * Then repeats the test, but cancels via PATCH (status='cancelled') to
 * verify the `pre('findOneAndUpdate')` hook also cascades.
 *
 * Run: npx tsx scripts/test-cascade-on-cancel.ts
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import assert from 'node:assert/strict';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose, { Types } from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';
import Session from '../src/models/Session';
import SessionEnrollment from '../src/models/SessionEnrollment';

interface TestUser {
  _id: Types.ObjectId;
}

async function ensureUser(
  role: 'teacher' | 'student',
  tag: string
): Promise<{ user: TestUser; created: boolean }> {
  const email = `cascade-${role}-${tag}-${Date.now()}@example.com`;
  const user = await User.create({
    name: `Cascade ${role} ${tag}`,
    email,
    passwordHash: 'unused',
    role,
  });
  return { user: user as unknown as TestUser, created: true };
}

async function setupSessionWithEnrollments(
  teacherId: Types.ObjectId,
  studentIds: Types.ObjectId[]
) {
  const session = await Session.create({
    title: 'Cascade test session',
    description: 'cascade',
    teacherId,
    subject: 'math',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    durationMinutes: 60,
    meetingUrl: 'https://meet.example.com/cascade',
  });

  // Mirror the route-layer increment + create pattern.
  for (const sid of studentIds) {
    await Session.updateOne(
      { _id: session._id },
      { $inc: { enrolledCount: 1 } }
    );
    await SessionEnrollment.create({
      userId: sid,
      sessionId: session._id,
    });
  }

  const refreshed = await Session.findById(session._id);
  assert.equal(
    refreshed?.enrolledCount,
    studentIds.length,
    'pre-cancel enrolledCount must equal #students'
  );
  const enrollCount = await SessionEnrollment.countDocuments({
    sessionId: session._id,
  });
  assert.equal(
    enrollCount,
    studentIds.length,
    'pre-cancel enrollment doc count must equal #students'
  );

  return session;
}

async function run() {
  await connectToDatabase();

  const createdUserIds: Types.ObjectId[] = [];
  const createdSessionIds: Types.ObjectId[] = [];

  try {
    const { user: teacher } = await ensureUser('teacher', 'A');
    createdUserIds.push(teacher._id);

    const studentIds: Types.ObjectId[] = [];
    for (let i = 0; i < 3; i++) {
      const { user: s } = await ensureUser('student', `A${i}`);
      studentIds.push(s._id);
      createdUserIds.push(s._id);
    }

    // ----- Path 1: cancel via document.save() (mirrors DELETE route) -----
    const sess1 = await setupSessionWithEnrollments(teacher._id, studentIds);
    createdSessionIds.push(sess1._id as Types.ObjectId);

    sess1.status = 'cancelled';
    await sess1.save();

    const remaining1 = await SessionEnrollment.countDocuments({
      sessionId: sess1._id,
    });
    const refreshed1 = await Session.findById(sess1._id);
    console.log(
      `[doc.save() cancel] enrollments=${remaining1}, enrolledCount=${refreshed1?.enrolledCount}`
    );
    assert.equal(
      remaining1,
      0,
      'all enrollments should be cascade-deleted on doc.save() cancel'
    );
    assert.equal(
      refreshed1?.enrolledCount,
      0,
      'enrolledCount should reset to 0 on doc.save() cancel'
    );

    // ----- Path 2: cancel via findOneAndUpdate (mirrors PATCH route) -----
    const sess2 = await setupSessionWithEnrollments(teacher._id, studentIds);
    createdSessionIds.push(sess2._id as Types.ObjectId);

    await Session.findByIdAndUpdate(sess2._id, { status: 'cancelled' });

    const remaining2 = await SessionEnrollment.countDocuments({
      sessionId: sess2._id,
    });
    const refreshed2 = await Session.findById(sess2._id);
    console.log(
      `[findOneAndUpdate cancel] enrollments=${remaining2}, enrolledCount=${refreshed2?.enrolledCount}`
    );
    assert.equal(
      remaining2,
      0,
      'all enrollments should be cascade-deleted on findOneAndUpdate cancel'
    );
    assert.equal(
      refreshed2?.enrolledCount,
      0,
      'enrolledCount should reset to 0 on findOneAndUpdate cancel'
    );

    console.log(
      '\nPASS: cancellation cascades enrollment cleanup and resets the counter.'
    );
  } finally {
    // Cleanup
    for (const sid of createdSessionIds) {
      await SessionEnrollment.deleteMany({ sessionId: sid });
      await Session.findByIdAndDelete(sid);
    }
    for (const uid of createdUserIds) {
      await User.findByIdAndDelete(uid);
    }
    await mongoose.disconnect();
  }
}

run().catch(async (err) => {
  console.error('\nFAIL:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
