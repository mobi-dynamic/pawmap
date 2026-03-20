import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/api/client';
import { rejectAdminReport } from '@/lib/admin-moderation-repository';

export async function POST(request: Request, { params }: { params: { reportId: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { reviewNotes?: string };
    const reviewNotes = body.reviewNotes?.trim() ?? '';

    if (reviewNotes.length < 3) {
      return NextResponse.json(
        { error: 'Add a short rejection reason so the decision is traceable.', code: 'INVALID_REVIEW_NOTES' },
        { status: 400 },
      );
    }

    const result = await rejectAdminReport(params.reportId, reviewNotes);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status || 500 });
    }

    return NextResponse.json({ error: 'Moderation action failed.' }, { status: 500 });
  }
}
