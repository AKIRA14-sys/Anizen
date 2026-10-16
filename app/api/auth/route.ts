import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, email, password } = body;

    if (action === 'register') {
      if (!username || !email || !password) {
        return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
      }

      const session = {
        id: `usr_${Date.now()}`,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role: email.trim().toLowerCase().includes('admin') ? 'admin' : 'user',
        createdAt: Date.now(),
      };

      return NextResponse.json({ success: true, message: 'Registration successful', session });
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ success: false, message: 'Email and password required.' }, { status: 400 });
      }

      const derivedUsername = email.split('@')[0];
      const session = {
        id: `usr_${Date.now()}`,
        username: derivedUsername,
        email: email.trim().toLowerCase(),
        role: email.trim().toLowerCase().includes('admin') ? 'admin' : 'user',
        createdAt: Date.now(),
      };

      return NextResponse.json({ success: true, message: 'Login successful', session });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Auth server error' }, { status: 500 });
  }
}
