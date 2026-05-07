/**
 * Integration test: concurrent enrollment race against capacity=1.
 *
 * Creates a session with capacity=1, then fires two enrollment POST requests
 * concurrently (different student tokens). Asserts that exactly ONE returns
 * 201 and the other returns 409 (Session is full). Also asserts that the
 * final `enrolledCount` is exactly 1 — proving the atomic capacity claim
 * closes the TOCTOU window that previously let both pass.
 *
 * Pre-req: dev server running on $HOST (default http://localhost:3789).
 *
 * Run: npx tsx scripts/test-capacity-race.ts
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import assert from 'node:assert/strict';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const HOST = process.env.HOST ?? 'http://localhost:3789';
const TS = Date.now();
const PASSWORD = 'testpass123';

interface CookieJar {
  cookie: string;
}

async function register(
  jar: CookieJar,
  email: string,
  role: 'teacher' | 'student'
) {
  const res = await fetch(`${HOST}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Race ${role} ${email}`,
      email,
      password: PASSWORD,
      role,
    }),
  });
  const setCookie = res.headers.get('set-cookie') ?? '';
  jar.cookie = setCookie.split(';')[0];
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`register ${role} ${email} failed: ${res.status} ${text}`);
  }
}

async function run() {
  const teacherJar: CookieJar = { cookie: '' };
  const studentAJar: CookieJar = { cookie: '' };
  const studentBJar: CookieJar = { cookie: '' };

  await register(teacherJar, `race-teacher-${TS}@example.com`, 'teacher');
  await register(studentAJar, `race-studentA-${TS}@example.com`, 'student');
  await register(studentBJar, `race-studentB-${TS}@example.com`, 'student');

  // Create a session with capacity=1.
  const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const createRes = await fetch(`${HOST}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherJar.cookie,
    },
    body: JSON.stringify({
      title: 'Capacity race',
      description: 'race test',
      subject: 'math',
      scheduledAt,
      durationMinutes: 60,
      meetingUrl: 'https://meet.example.com/race',
      capacity: 1,
      priceDA: 0,
      topics: [],
    }),
  });
  assert.equal(createRes.status, 201, 'session create should succeed');
  const created = (await createRes.json()) as { _id: string };
  const sessionId = created._id;
  console.log('Created session', sessionId, 'with capacity=1');

  // Fire two concurrent enrollment POSTs.
  const enroll = (jar: CookieJar) =>
    fetch(`${HOST}/api/sessions/${sessionId}/enroll`, {
      method: 'POST',
      headers: { Cookie: jar.cookie },
    });

  const [resA, resB] = await Promise.all([
    enroll(studentAJar),
    enroll(studentBJar),
  ]);

  console.log('Student A status:', resA.status);
  console.log('Student B status:', resB.status);

  const statuses = [resA.status, resB.status].sort();
  assert.deepEqual(
    statuses,
    [201, 409],
    `expected exactly one 201 and one 409, got ${JSON.stringify(statuses)}`
  );

  // Verify final enrolledCount is exactly 1, not 2.
  const finalRes = await fetch(`${HOST}/api/sessions/${sessionId}`, {
    headers: { Cookie: teacherJar.cookie },
  });
  const finalBody = (await finalRes.json()) as { enrolledCount: number };
  console.log('Final enrolledCount =', finalBody.enrolledCount);
  assert.equal(
    finalBody.enrolledCount,
    1,
    `enrolledCount should be exactly 1 after the race, got ${finalBody.enrolledCount}`
  );

  // Cleanup: cancel the session.
  await fetch(`${HOST}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Cookie: teacherJar.cookie },
  });

  console.log(
    '\nPASS: atomic capacity claim correctly serializes concurrent enrollers.'
  );
}

run().catch((err) => {
  console.error('\nFAIL:', err);
  process.exit(1);
});
