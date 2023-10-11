import { getToken } from '../token';

export const GET = async (_req: Request) => {
    return new Response(JSON.stringify({ token: await getToken() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};