'use client';
import React from 'react';
import { VonageClient, ConfigRegion, ClientConfig, setVonageClientLoggingLevel, LoggingLevel } from '@vonage/client-sdk';

export const VonageRegion = {
    US: ConfigRegion.US,
    EU: ConfigRegion.EU,
    AP: ConfigRegion.AP,
} as const;

export type VonageClientContextType = {
    client: VonageClient | null;
    session: string | null;
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

export const VonageClientProvider = ({ token, options, children, logLevel ='error' }: VonageClientProviderProps) => {
    const [client, setClient] = React.useState<VonageClient>(()=> {
        setVonageClientLoggingLevel(logLevelMap[logLevel]);
        return new VonageClient();
    });
    const [session, setSession] = React.useState<string | null>(null);
    const [pending, setPending] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (!client) return;
        const config: ClientConfig = new ClientConfig(options?.region ? VonageRegion[options.region] : VonageRegion.US);
        if (options?.websocketUrl) config.websocketUrl = options.websocketUrl;
        if (options?.apiURL) config.apiUrl = options.apiURL;
        client.setConfig(config);
    }, [client, options]);

    React.useEffect(() => {
        if (!client) return;
        client.createSession(token)
            .then((session) => {
                setSession(session);
                setPending(false);
            })
            .catch((error) => {
                console.error(error);
                setPending(false);
            });
    }, [client, token]);

    return (
        <VonageClientContext.Provider value={ { client, session}}>
            {children}
        </VonageClientContext.Provider>
    );
};

export const useVonageClient = () => {
    const context = React.useContext(VonageClientContext);
    if (!context?.client) {
        throw new Error('useVonageClient must be used within a VonageClientProvider');
    }
    return context.client;
};

export const useVonageSession = () => {
    const context = React.useContext(VonageClientContext);
    if (!context?.session) {
        throw new Error('useVonageSession must be used within a VonageClientProvider');
    }
    return context.session;
};