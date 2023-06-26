import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';
import { z } from 'zod';
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts';

const ACLSchema = z.object({
    paths: z.record(z.object({})),
});

export type ACL = z.infer<typeof ACLSchema>;

export type TokenOptions = {
    alg: string,
    acl: ACL,
    exp: number,
};

const defaultACL = {
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
} satisfies ACL;

const defaultExp = 60 * 60 * 24; // 24 hours

const defaultOptions = {
    alg: 'RS256',
    acl: defaultACL,
    exp: defaultExp,
} satisfies TokenOptions;

class MintTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MintTokenError';
    }
}

export const mintVonageToken = async (privateKey: string, applicationId: string, sub?: string, options: TokenOptions = defaultOptions) => {
    console.log(`Minting token for application ${applicationId} with options ${JSON.stringify(options)} and sub ${sub}`);
    try {
        const key = await jose.importPKCS8(privateKey, options.alg);
        const acl = ACLSchema.parse(options.acl);
        const payload = {
            application_id: applicationId,
            sub,
            acl
        };

        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: options.alg })
            .setIssuedAt()
            .setExpirationTime(Math.floor(Date.now() / 1000) + options.exp)
            .setJti(nanoid())
            .sign(key);

        return token;
    } catch (e) {
        console.error(`Error minting token: ${JSON.stringify(e)}`);
        if (e instanceof z.ZodError) {
            console.error(e.errors);
            throw new MintTokenError('Invalid ACL');
        } else if (e instanceof Error) {
            throw new MintTokenError(`Error minting token: ${e.message}`);
        } else {
            throw new MintTokenError('Unknown error minting token');
        }
    }
};
const deviceRefreshTokenSchema = z.object({
    deviceId: z.string(),
    userId: z.string(),
});

export type RefreshTokentPayload = z.infer<typeof deviceRefreshTokenSchema>;
export const mintDeviceRefreshToken = async (secret: string, payload: RefreshTokentPayload) => {
    console.log(`Minting refresh token for device ${payload.deviceId} and user ${payload.userId}`);

    const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 90); // 90 days
    try {
        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(expirationTime)
            .setJti(nanoid())
            .sign(new TextEncoder().encode(secret));
        return token;
    } catch (e) {
        console.dir(e);
        console.error(`Error minting refresh token: ${JSON.stringify(e)}`);
        if (e instanceof Error) {
            throw new MintTokenError(`Error minting refresh token: ${e.message}`);
        } else {
            throw new MintTokenError('Unknown error minting refresh token');
        }
    }
};

export const verifyDeviceRefreshToken = async (secret: string, token: string): Promise<RefreshTokentPayload | null> => {
    try {
        const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
        return deviceRefreshTokenSchema.parse(payload);
    } catch (e) {
        console.error(`Error verifying refresh token: ${JSON.stringify(e)}`);
        return null;
    }
};
