import { z } from 'zod';

export const WhatsappMessageType = [
    'audio',
    'contacts',
    'document',
    'image',
    'interactive',
    'location',
    'sticker',
    'template',
    'text',
    'unknown',
    'system',
    'reply',
    'video',
    'unsupported',
] as const;

export const inboundMessageBaseSchema = z.object({
    to: z.string(),
    from: z.string(),
    channel: z.string(),
    message_uuid: z.string(),
    timestamp: z.string(),
    message_type: z.string(), // it image, text
    text: z.string().optional(),
}).passthrough();

export type InboundMessageBase = z.infer<typeof inboundMessageBaseSchema>;

export const inboundFacebookMessageSchema = inboundMessageBaseSchema.required({
    text: true,
}).extend({
    channel: z.literal('messenger'),
});

export type InboundFacebookMessage = z.infer<
    typeof inboundFacebookMessageSchema
>;

export const whatsappBaseSchema = inboundMessageBaseSchema.extend({
    channel: z.literal('whatsapp'),
    message_type: z.enum(WhatsappMessageType),
    profile: z.object({
        name: z.string().optional(),
    }).passthrough().optional(),
    context: z.object({
        message_from: z.string(),
        message_uuid: z.string(),
    }).optional(),
}).passthrough();

export type WhatsappBase = z.infer<typeof whatsappBaseSchema>;

export const inboundWhatsappMessageSchema = whatsappBaseSchema.required({
    text: true,
}).extend({
    message_type: z.literal('text'),
});

export const inboundWhatsappReplySchema = whatsappBaseSchema.required({
    context: true,
}).extend({
    message_type: z.literal('reply'),
    reply: z.object({
        id: z.string(),
        title: z.string(),
    }),
});

export const inboundWhatsAppScema = z.discriminatedUnion('message_type', [
    inboundWhatsappReplySchema,
    inboundWhatsappMessageSchema,
]);

// SMS objects

export const smsSchema = inboundMessageBaseSchema.extend({
    channel: z.literal('sms'),
    message_type: z.string(),
}).passthrough();

export type InboundSMS = z.infer<typeof smsSchema>;

export const inboundMessageSchema = z.discriminatedUnion('channel', [
    inboundFacebookMessageSchema,
    whatsappBaseSchema,
    smsSchema,
]);

export type InboundMessage = z.infer<typeof inboundMessageSchema>;
