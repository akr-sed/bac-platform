/**
 * Integration test: meetingUrl protocol allowlist.
 *
 * Asserts that POST /api/sessions rejects `javascript:` and `data:` schemes
 * (returns 400) but accepts a valid `https:` URL (returns 201).
 *
 * Pre-req: dev server running on $HOST (default http://localhost:3789).
 *
 * Run: npx tsx scripts/test-meeting-url-allowlist.ts
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import assert from 'node:assert/strict';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const HOST = process.env.HOST ?? 'http://localhost:3789';
const TS = Date.now();
const TEACHER_EMAIL = `xss-teacher-${TS}@example.com`;
const PASSWORD = 'testpass123';

interface CookieJar {
  cookie: string;
}

async function register(jar: CookieJar, role: 'teacher' | 'student'): Promise<string> {
  const res = await fetch(`${HOST}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `XSS ${role}`,
      email: role === 'teacher' ? TEACHER_EMAIL : `xss-student-${TS}@example.com`,
      password: PASSWORD,
      role,
    }),
  });
  const setCookie = res.headers.get('set-cookie') ?? '';
  jar.cookie = setCookie.split(';')[0];
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`register ${role} failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { user?: { _id?: string } };
  return data.user?._id ?? '';
}

async function postSession(jar: CookieJar, meetingUrl: string) {
  const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const res = await fetch(`${HOST}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: jar.cookie,
    },
    body: JSON.stringify({
      title: 'XSS allowlist test',
      description: 'allowlist test',
      subject: 'math',
      scheduledAt,
      durationMinutes: 60,
      meetingUrl,
      capacity: 5,
      priceDA: 0,
      topics: [],
    }),
  });
  return res;
}

async function run() {
  const teacherJar: CookieJar = { cookie: '' };
  await register(teacherJar, 'teacher');

  // 1. javascript: must be rejected
  const jsRes = await postSession(teacherJar, 'javascript:alert(1)');
  console.log('javascript: scheme →', jsRes.status);
  assert.equal(jsRes.status, 400, 'javascript: scheme MUST be rejected (400)');

  // 2. data: must be rejected
  const dataRes = await postSession(
    teacherJar,
    'data:text/html,<script>alert(1)</script>'
  );
  console.log('data: scheme →', dataRes.status);
  assert.equal(dataRes.status, 400, 'data: scheme MUST be rejected (400)');

  // 3. file: must be rejected
  const fileRes = await postSession(teacherJar, 'file:///etc/passwd');
  console.log('file: scheme →', fileRes.status);
  assert.equal(fileRes.status, 400, 'file: scheme MUST be rejected (400)');

  // 4. https: must succeed
  const httpsRes = await postSession(teacherJar, 'https://meet.example.com/abc');
  const httpsBody = await httpsRes.json();
  console.log('https: scheme →', httpsRes.status);
  assert.equal(httpsRes.status, 201, 'https: scheme should be accepted (201)');

  // Cleanup the created session via DELETE (soft cancel).
  if (httpsBody && typeof httpsBody._id === 'string') {
    await fetch(`${HOST}/api/sessions/${httpsBody._id}`, {
      method: 'DELETE',
      headers: { Cookie: teacherJar.cookie },
    });
  }

  // 5. http: must also succeed (allowlist permits both)
  const httpRes = await postSession(teacherJar, 'http://meet.example.com/abc');
  console.log('http: scheme →', httpRes.status);
  assert.equal(httpRes.status, 201, 'http: scheme should be accepted (201)');
  const httpBody = await httpRes.json();
  if (httpBody && typeof httpBody._id === 'string') {
    await fetch(`${HOST}/api/sessions/${httpBody._id}`, {
      method: 'DELETE',
      headers: { Cookie: teacherJar.cookie },
    });
  }

  console.log('\nPASS: meetingUrl allowlist correctly blocks non-http(s) schemes.');
}

run().catch((err) => {
  console.error('\nFAIL:', err);
  process.exit(1);
});
