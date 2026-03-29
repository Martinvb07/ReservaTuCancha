export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const res = await fetch(`http://127.0.0.1:4000/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error('Backend login error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
