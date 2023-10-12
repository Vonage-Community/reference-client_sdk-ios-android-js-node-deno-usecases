#!/usr/bin/env node

import { Vonage } from '@vonage/server-sdk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { TunnelTypes, getTunnelUrl } from 'local-portal';
import { setupFacebook } from './facebookSetup.js';
import { createBot } from './botSetup.js';
import fs from 'node:fs/promises';
import path from 'node:path';


const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID;
const VONAGE_APPLICATION_NAME = process.env.VONAGE_APPLICATION_NAME || 'Vonage Node Quickstart';

const argv = yargs(hideBin(process.argv))
    .env(true)
    .option('webhook-path', {
        alias: 'w',
        description: 'The path to use for the webhook',
        type: 'string',
        default: 'functions/v1/'
    })
    .option('webhook-http-method', {
        alias: 'm',
        description: 'The HTTP method to use for the webhook',
        type: 'string',
        choices: ['POST', 'GET'],
        default: 'POST'
    })
    .option('voice-answer-webhook-path', {
        description: 'The path to use for the voice answer webhook',
        type: 'string',
        default: 'webhook-voice-answer'
    })
    .option('voice-answer-webhook-http-method', {
        description: 'The HTTP method to use for the voice answer webhook',
        type: 'string',
        choices: ['POST', 'GET'],
    })
    .option('voice-event-webhook-path', {
        description: 'The path to use for the voice event webhook',
        type: 'string',
        default: 'webhook-voice-event'
    })
    .option('voice-event-webhook-http-method', {
        description: 'The HTTP method to use for the voice event webhook',
        type: 'string',
        choices: ['POST', 'GET'],
    })
    .option('message-status-webhook-path', {
        description: 'The path to use for the message status webhook',
        type: 'string',
        default: 'webhook-message-status'
    })
    .option('message-status-webhook-http-method', {
        description: 'The HTTP method to use for the message status webhook',
        type: 'string',
        choices: ['POST', 'GET'],
    })
    .option('message-inbound-webhook-path', {
        description: 'The path to use for the message inbound webhook',
        type: 'string',
        default: 'webhook-message-inbound'
    })
    .option('message-inbound-webhook-http-method', {
        description: 'The HTTP method to use for the message inbound webhook',
        type: 'string',
        choices: ['POST', 'GET'],
    })
    .option('rtc-event-webhook-path', {
        description: 'The path to use for the RTC event webhook',
        type: 'string',
        default: 'webhook-rtc-event'
    })
    .option('rtc-event-webhook-http-method', {
        description: 'The HTTP method to use for the RTC event webhook',
        type: 'string',
        choices: ['POST', 'GET'],
    })
    .option('enable-facebook', {
        description: 'A flag to enable facebook event webhook',
        type: 'boolean',
        default: false
    })
    .option('facebook-webhook-path', {
        description: 'The HTTP method to use for the facebook event webhook',
        type: 'string',
        default: 'webhook-facebook'
    })
    .option('bot-name', {
        description: 'The user name for the bot',
        type: 'string',
        default: 'bot:vonage'
    })
    .option('endpoint', {
        alias: 'e',
        description: 'The endpoint to use for the Vonage application',
        type: 'string',
    })
    .option('tunnel', {
        alias: 'T',
        type: 'boolean',
        description: 'Use a tunnel to expose the server',
        default: true,
    })
    .option('tunnel-type', {
        description: 'The type of tunnel to use',
        choices: Object.values(TunnelTypes),
        default: TunnelTypes.ngrok,
        type: 'string',
    })
    .option('ngrok', {
        description: 'Use ngrok to expose the server',
        boolean: true,
        conflicts: 'localtunnel',
    })
    .option('localtunnel', {
        description: 'Use localtunnel to expose the server',
        boolean: true,
        conflicts: 'ngrok',
    })
    .option('tunnel-port', {
        alias: 'p',
        description: 'The port to use for the tunnel',
        default: 54321,
        type: 'number',
    })
    .middleware(async (argv) => {
        if (argv.ngrok && argv.localtunnel) {
            throw new Error('Only one tunnel type can be specified');
        }
        if (!argv.tunnel && !argv.endpoint) {
            throw new Error('An endpoint is required if not using a tunnel');
        }

        if(process.env.ENDPOINT){
            argv.endpoint = process.env.ENDPOINT;
        }else if (argv.tunnel) {
            const tunnelType = argv.ngrok ? TunnelTypes.ngrok : argv.localtunnel ? TunnelTypes.localtunnel : argv.tunnelType;
            argv.endpoint = await getTunnelUrl(argv.tunnelPort, tunnelType);
            console.log(`Tunneled endpoint: ${argv.endpoint}`);
        }

        argv.voiceAnswerUrl = new URL(`${argv.webhookPath}${argv.voiceAnswerWebhookPath}`, argv.endpoint).href;
        argv.voiceAnswerHttpMethod = argv.voiceAnswerWebhookHttpMethod || argv.webhookHttpMethod;
        argv.voiceEventUrl = new URL(`${argv.webhookPath}${argv.voiceEventWebhookPath}`, argv.endpoint).href;
        argv.voiceEventHttpMethod = argv.voiceEventWebhookHttpMethod || argv.webhookHttpMethod;
        argv.messageStatusUrl = new URL(`${argv.webhookPath}${argv.messageStatusWebhookPath}`, argv.endpoint).href;
        argv.messageStatusHttpMethod = argv.messageStatusWebhookHttpMethod || argv.webhookHttpMethod;
        argv.messageInboundUrl = new URL(`${argv.webhookPath}${argv.messageInboundWebhookPath}`, argv.endpoint).href;
        argv.messageInboundHttpMethod = argv.messageInboundWebhookHttpMethod || argv.webhookHttpMethod;
        argv.rtcEventUrl = new URL(`${argv.webhookPath}${argv.rtcEventWebhookPath}`, argv.endpoint).href;
        argv.rtcEventHttpMethod = argv.rtcEventWebhookHttpMethod || argv.webhookHttpMethod;
        argv.facebookEventUrl = new URL(`${argv.webhookPath}${argv.facebookWebhookPath}`, argv.endpoint).href;

        return argv;
    })
    .middleware(async (argv) => {
        if (!argv.tunnel) return argv; // don't save the endpoint if we're not using a tunnel
        // save the endpoint to the .env.local file
        // if the file doesn't exist, create it
        const envLocalPath = path.join(process.cwd(), '..', '..', '.env.local');
        const envLocalExists = await fs.access(envLocalPath).then(() => true).catch(() => false);
        if (!envLocalExists) {
            await fs.writeFile(envLocalPath, '');
        }
        const envLocal = await fs.readFile(envLocalPath, 'utf-8');
        const envLocalLines = envLocal.split('\n');
        const envLocalVars = envLocalLines.reduce((acc, line) => {
            const [key, value] = line.split('=');
            acc.set(key, value);
            return acc;
        }, new Map());

        envLocalVars.set('ENDPOINT', argv.endpoint);

        const envLocalUpdated = [...envLocalVars.entries()].reduce((acc, [key, value]) => {
            if (!value && !key) return acc;
            return `${acc}${key}=${value}\n`;
        }, []);

        await fs.writeFile(envLocalPath, envLocalUpdated);
        return argv;
    })
    .help()
    .alias('help', 'h')
    .argv;

const vonage = new Vonage({
    apiKey: VONAGE_API_KEY,
    apiSecret: VONAGE_API_SECRET,
});

(async () => {
    console.log('Updating Vonage application...');

    const {
        voiceAnswerUrl,
        voiceAnswerHttpMethod,
        voiceEventUrl,
        voiceEventHttpMethod,
        messageStatusUrl,
        messageStatusHttpMethod,
        messageInboundUrl,
        messageInboundHttpMethod,
        rtcEventUrl,
        rtcEventHttpMethod,
        facebookEventUrl,
        enableFacebook,
        botName
    } = await argv;

    console.table({
        'Voice Answer Webhook': {
            url: voiceAnswerUrl,
            http_method: voiceAnswerHttpMethod,
        },
        'Voice Event Webhook': {
            url: voiceEventUrl,
            http_method: voiceEventHttpMethod,
        },
        'Message Status Webhook': {
            url: messageStatusUrl,
            http_method: messageStatusHttpMethod,
        },
        'Message Inbound Webhook': {
            url: messageInboundUrl,
            http_method: messageInboundHttpMethod,
        },
        'RTC Event Webhook': {
            url: rtcEventUrl,
            http_method: rtcEventHttpMethod,
        },
    });

    console.log('Updating application with new webhook URLs...');
    if (enableFacebook) {
        console.log(`Facebook Event Url: ${facebookEventUrl}`);
        try {
            setTimeout(async () => {
                await setupFacebook(facebookEventUrl);
            }, 10 * 1000);
        } catch (error) {
            console.error(error);
        }
    }

    if (botName) {
        console.log('Creating Bot User...');
        try {
            await createBot();
        } catch (e) {
            console.error('Error in creating Bot User', e);
        }
    }

    try {
        await vonage.applications.updateApplication({
            id: VONAGE_APPLICATION_ID,
            name: VONAGE_APPLICATION_NAME,
            capabilities: {
                voice: {
                    webhooks: {
                        answer_url: {
                            address: voiceAnswerUrl,
                            http_method: voiceAnswerHttpMethod
                        },
                        event_url: {
                            address: voiceEventUrl,
                            http_method: voiceEventHttpMethod,
                        },
                    },
                },
                messages: {
                    webhooks: {
                        status_url: {
                            address: messageStatusUrl,
                            http_method: messageStatusHttpMethod,
                        },
                        inbound_url: {
                            address: messageInboundUrl,
                            http_method: messageInboundHttpMethod,
                        },
                    },
                },
                rtc: {
                    webhooks: {
                        event_url: {
                            address: rtcEventUrl,
                            http_method: rtcEventHttpMethod,
                        },
                    },
                },
            },
        });
        console.log('Application updated.');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();