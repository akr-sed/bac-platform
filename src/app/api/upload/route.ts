import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/cloudinary';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFile(file, 'bac-platform');
    urls.push(url);
  }

  return NextResponse.json({ urls });
}
