'use client';
import React from 'react';
import { VonageClient, ConfigRegion, ClientConfig, setVonageClientLoggingLevel, LoggingLevel, User } from '@vonage/client-sdk';

export const VonageRegion = {
    US: ConfigRegion.US,
    EU: ConfigRegion.EU,
    AP: ConfigRegion.AP,
} as const;

export type VonageClientContextType = {
    client: VonageClient | null;
    session: string | null;
    user: User | null;
} | null;

export const VonageClientContext = React.createContext<VonageClientContextType>(null);

export interface VonageClientOptions {
    region?:keyof typeof VonageRegion;
    websocketUrl?: string;
    apiURL?: string;
};

const logLevelMap = {
    info: LoggingLevel.Info,
    warn: LoggingLevel.Warn,
    error: LoggingLevel.Warn,
    debug: LoggingLevel.Debug,
    verbose: LoggingLevel.Verbose,
    assert: LoggingLevel.Assert
};

export type VonageClientProviderProps = {
    token: string;
    options?: VonageClientOptions;
    logLevel?: keyof typeof logLevelMap;
    children: React.ReactNode;
};

export const VonageClientProvider = ({ token, options, children, logLevel = 'error' }: VonageClientProviderProps) => {
    const [config] = React.useState<ClientConfig>(() => {
        const clientConfig = new ClientConfig(options?.region ? VonageRegion[options.region] : VonageRegion.US);
        if (options?.websocketUrl) clientConfig.websocketUrl = options.websocketUrl;
        if (options?.apiURL) clientConfig.apiUrl = options.apiURL;
        return clientConfig;
    });
    const [client] = React.useState<VonageClient>(() => {
        setVonageClientLoggingLevel(logLevelMap[logLevel]);
        const client = new VonageClient();
        client.setConfig(config);
        return client;
    });
    const [session, setSession] = React.useState<string | null>(null);
    const [user, setUser] = React.useState<User | null>(null);

    React.useEffect(() => {
        if (!client) return;
        client.createSession(token)
            .then((session) => {
                setSession(session);
            })
            .catch((error) => {
                console.error(error);
            });
    }, [client, token]);

    React.useEffect(() => {
        if (!client || !session) return;
        client.getUser('me').then((user) => {
            setUser(user);
        }).catch((error) => {
            console.error(error);
        });
    }, [client, session]);

    return (
        <VonageClientContext.Provider value={{ client, session, user }}>
            {children}
        </VonageClientContext.Provider>
    );
};

export const useVonageClient = () => {
    const context = React.useContext(VonageClientContext);

    if (!context) {
        throw new Error('useVonageClient must be used within a VonageClientProvider');
    }
    if (!context.client) {
        throw new Error('useVonageClient must be used within a VonageClientProvider');
    }
    return context.client;
};

export const useVonageSession = () => {
    const context = React.useContext(VonageClientContext);
    if (!context) {
        throw new Error('useVonageSession must be used within a VonageClientProvider');
    }
    return context.session;
};

export const useVonageUser = () => {
    const context = React.useContext(VonageClientContext);
    if (!context) {
        throw new Error('useVonageUser must be used within a VonageClientProvider');
    }
    return context.user;
};