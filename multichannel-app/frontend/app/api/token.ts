import { nanoid } from 'nanoid';
import * as jose from 'jose';

const applicationId = process.env.VONAGE_APPLICATION_ID;
const privateKey = process.env.VONAGE_PRIVATE_KEY;

const acl = {
    'paths': {
        '/*/users/**': {},
        '/*/conversations/**': {},
        '/*/sessions/**': {},
        '/*/devices/**': {},
        '/*/image/**': {},
        '/*/media/**': {},
        '/*/applications/**': {},
        '/*/push/**': {},
        '/*/knocking/**': {},
        '/*/legs/**': {}
    }
};

export const revalidate = 0;


export const getToken = async (sub?: string) => {

    const key = await jose.importPKCS8(privateKey!, '');
    const payload = {
        application_id: applicationId,
        sub,
        acl
    };

    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + 3600) // 1 hour
        .setJti(nanoid())
        .sign(key);


    return token;
};