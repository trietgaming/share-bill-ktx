import { getAuthenticatedUser } from '@/lib/firebase/server';

export async function GET() {
    const user = await getAuthenticatedUser();

    if (user) {
        return new Response(JSON.stringify({ uid: user.uid }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}