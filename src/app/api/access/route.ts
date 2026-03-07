import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { userId, lessonId } = await request.json();

    if (!userId || !lessonId) {
      return NextResponse.json({ error: 'userId and lessonId required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('purchases')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        granted_by: user.id,
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Access already granted' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { userId, lessonId } = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('purchases')
      .delete()
      .eq('user_id', userId)
      .eq('lesson_id', lessonId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
