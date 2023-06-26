export * from './dbWebhooks';
export * from './database.types';
export const SupportedProviders = ['google', 'github'] as const;
export type SupportedProvider = typeof SupportedProviders[number];