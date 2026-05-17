import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Report from '@/models/Report';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [totalUsers, totalExercises, totalSolutions, pendingReports] =
      await Promise.all([
        User.countDocuments(),
        Exercise.countDocuments(),
        Solution.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
      ]);

    return NextResponse.json({
      totalUsers,
      totalExercises,
      totalSolutions,
      pendingReports,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
