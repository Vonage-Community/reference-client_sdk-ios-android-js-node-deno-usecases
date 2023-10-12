import { createClient } from '@vercel/kv';
import { kv } from '@vercel/kv';


export const GET = async (req: Request) => {
    const oldCounter = await kv.get('assistant');
    const newVal = (parseInt(oldCounter as string) || 0) + 1;
    await kv.set('counter', newVal);


     return new Response(JSON.stringify({
           text:'yolloe',
           counter: newVal
            
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

};

