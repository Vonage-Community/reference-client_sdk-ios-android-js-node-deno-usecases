import { getToken } from '../../token';

export const GET = async (req: Request, { params: { name } }: { params: { name: string } }) => {
    return new Response(JSON.stringify({ token: await getToken(name) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};