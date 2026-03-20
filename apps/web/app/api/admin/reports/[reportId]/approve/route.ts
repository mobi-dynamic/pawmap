import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/api/client';
import { approveAdminReport } from '@/lib/admin-moderation-repository';

export async function POST(_: Request, { params }: { params: { reportId: string } }) {
  try {
    const result = await approveAdminReport(params.reportId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status || 500 });
    }

    return NextResponse.json({ error: 'Moderation action failed.' }, { status: 500 });
  }
}
