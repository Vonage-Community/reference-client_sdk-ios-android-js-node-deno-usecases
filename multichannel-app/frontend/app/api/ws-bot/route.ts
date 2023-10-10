function urlWss(url:string){
    if(url.includes('https://')){
        return url.replace('https://','wss://' );
    }else if(url.includes('://')){
        return url;
    } else {
        return `wss://${url}`;
    }
}


export const GET = async (req: Request) => {
    return new Response(JSON.stringify({
        ws_bot_url: urlWss(process.env.WS_BOT_URL as string)
    }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });

};