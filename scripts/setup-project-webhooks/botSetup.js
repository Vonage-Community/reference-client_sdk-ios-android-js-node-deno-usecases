import { tokenGenerate } from '@vonage/jwt';

const BOT_NAME = process.env.BOT_NAME || 'bot:vonage';
const BOT_DISPLAY_NAME = process.env.BOT_DISPLAY_NAME || 'Vonage Bot';
const APP_ID = process.env.VONAGE_APPLICATION_ID || '';
const PRIVATE_KEY = process.env.VONAGE_PRIVATE_KEY || '';
const VONAGE_ENDPOINT = process.env.VONAGE_ENDPOINT || '';

export const createBot = async () => {
    const jwtToken = tokenGenerate(APP_ID, PRIVATE_KEY, null);
    const csHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/json'
    };
    const userRes = await fetch(`${VONAGE_ENDPOINT}/users/${BOT_NAME}`, {
        method: 'GET',
        headers: csHeaders,
    });

    if (userRes.status == 200) {
        console.log(`'${BOT_NAME}' User already exists`);
        return;
    }

    if (userRes.status == 404) {
        const createUserRes = await fetch(`${VONAGE_ENDPOINT}/users`, {
            method: 'POST',
            headers: csHeaders,
            body: JSON.stringify({
                name: BOT_NAME,
                display_name: BOT_DISPLAY_NAME
            })
        });

        if (!createUserRes.ok) {
            throw new Error(`Invalid User Create response: ${createUserRes.status}:${createUserRes.statusText}`);
        }

        console.log(`'${BOT_NAME}' User successfully created`);
        return;
    }

    throw new Error(`Invalid User response: ${userRes.status}:${userRes.statusText}`);
};