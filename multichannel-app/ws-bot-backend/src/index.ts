import express, {Application } from 'express';
import  ExpressWS,{Application as WSApp} from 'express-ws';
import axios from 'axios';

import { Readable } from 'stream';
import isBuffer from 'is-buffer';
import chunkingStreams from 'chunking-streams';
import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';

// import openapi from 'openai';
// Configuration, OpenAIApi
// openapi.OpenAI
import OpenAI from 'openai';


const app = ExpressWS(express()).app;
const port = process.env.WS_BOT_PORT;

const speechToTextClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();

const SizeChunker = chunkingStreams.SizeChunker;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());

app.get('/ping', async (req, res) => {
    return res.status(200).json({
        status: 'ok',
        url: process.env.WS_BOT_URL,
        url_endpont: process.env.ENDPOINT
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

//TRANSCRIBE REAL TIME
app.ws('/transcribe', async (ws, req) => {
    const {webhook_url, webhook_method} = req.query;

    console.log('received ws connection transcribe', {webhook_method, webhook_url});
   
    const gRecognizeStream = speechToTextClient
        .streamingRecognize({
            config:{
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
            },
            interimResults: false,
        })
        .on('error', (err) => {
            console.error('speechToTextClient on error:', err);
        })
        .on('data', (data: any) => {
            // console.log('streaming rec res',data);
            console.log('TRANSCRIBE> ',data.results[0].alternatives[0].transcript);
            if (webhook_url){
                http_callback(webhook_url.toString(), webhook_method?.toString(), data);     
            }
        });

    ws.on('message', (msg) => {
        console.log('on message');
        if (ws.readyState === ws.OPEN) {
            if (typeof msg !== 'string'){
                console.log('gRecognizeStream.write');
                gRecognizeStream.write(msg);
            }
        }
    });

    ws.on('close', () => {
        console.log('ws on close');

        gRecognizeStream.destroy();
    });

});

// ASSISTANT
app.ws('/assistant', async (ws, req) => {
    const {webhook_url, webhook_method, webhook_param_name, webhook_param_value} = req.query;
    console.log('received ws connection transcribe', {webhook_method, webhook_url, webhook_param_name, webhook_param_value});

    const gRecognizeStream = speechToTextClient
        .streamingRecognize({
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
            },
            interimResults: false,
        })
        .on('error', console.error)
        .on('data', async (data: any) => {
            console.log('streaming rec res',data);

            const prompt = data.results[0].alternatives[0].transcript;
            console.log('TRANSCRIBE> ',prompt);
            if (webhook_url){
                http_callback(webhook_url.toString(), webhook_method?.toString(),  {
                    type: 'transcript',
                    data
                }, webhook_param_name?.toString(), webhook_param_value?.toString());     
            }

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo', 
                messages: [
                    {
                        role: 'system',
                        content: 'You\'re an unhelpful assistant'
                    },
                    {
                        role: 'user', 
                        content: prompt
                    }
                ]
            });
            const completition_text = completion.choices[0].message.content;
            // const completition_text = completion.data.choices[0].text;

            if (webhook_url){
                http_callback(webhook_url.toString(), webhook_method?.toString(), {
                    type: 'assistant_response',
                    data:completion
                }, webhook_param_name?.toString(), webhook_param_value?.toString());     
            }
            console.log(`completition_text ${completition_text}`)
            const [ttsResponse] = await ttsClient.synthesizeSpeech({
                input: {text: completition_text},
                voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
                audioConfig: {
                    audioEncoding: 'LINEAR16',
                    sampleRateHertz: 16000
                },
            });

            // console.log(`ttsResponse`, ttsResponse)
            var chunker = new SizeChunker({
                chunkSize: 640 // must be a number greater than zero. 
            });
            
            // @ts-ignore
            const audioStream = Readable.from(ttsResponse.audioContent);
            audioStream.pipe(chunker);

            chunker.on('data', function(chunk: any) {
                const data = chunk.data;
                let buf: any;
                if (data.length == 640){
                    try {
                       ws.send(data);
                    }
                    catch (e) {
                    };
                }
                else{
                    buf += data;
                    if (buf.length == 640){
                        try {
                           ws.send(data);
                        }
                        catch (e) {
                        };
                        buf = null;
                    }
                }
            });
        
        });

    ws.on('message', (msg: any) => {
        if (ws.readyState === ws.OPEN) {
            if (typeof msg !== 'string'){
                gRecognizeStream.write(msg);
            }
        }
    });

    ws.on('close', () => {
        gRecognizeStream.destroy();
    });

})



async function http_callback(webhook_url:string,webhook_method:string ='GET', data:any, webhook_param_name?: string, webhook_param_value?: string) {
    let webhook_request:any = {
        url: webhook_url,
        method: webhook_method,
    };

    if (webhook_param_name) {
        data[webhook_param_name] = webhook_param_value;
    }

    if (webhook_method === 'POST'){
        webhook_request.data = data; 
    }else if (webhook_method === 'GET'){
        webhook_request.params = data;
    }
    // console.log(`<- webhook_request`, webhook_request)
    //hit back the webhook in background
    axios(webhook_request)
        .then((res) => {
            // console.log(``)
            // console.log(`<-  request ${res.status}statusCode: ${res.status}`)
            // console.log(res)
        })
        .catch((error) => {
            // console.error(error)
        });
}

app.listen(port);