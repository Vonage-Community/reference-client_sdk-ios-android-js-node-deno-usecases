import express, {Application } from 'express';
import  ExpressWS,{Application as WSApp} from 'express-ws';
const app = ExpressWS(express()).app;
const port = 3001;

app.use(express.json());

app.get('/ping', async (req, res) => {
    return res.status(200).json({
        status: 'ok'
    });
});

app.ws('/echo', async (ws, req) => {
    console.log('received ws connection echo');
    ws.on('message', (msg) => {
        setTimeout(() => {
            if (ws.readyState === ws.OPEN) ws.send(msg);
        }, 500); 
    });
  });

app.listen(port);