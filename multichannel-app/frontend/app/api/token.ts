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

/**
 * Generate a Vonage JWT token
 * @param sub - user name
 * @param exp - expiration time in seconds
 * @returns 
 */
export const getToken = async (sub?: string, exp: number = 3600) => {

    const key = await jose.importPKCS8(privateKey!, '');
    const payload = {
        application_id: applicationId,
        sub,
        acl
    };

    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + exp) // 1 hour
        .setJti(nanoid())
        .sign(key);


    return token;
};