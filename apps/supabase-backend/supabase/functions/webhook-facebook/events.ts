import { z } from 'zod';

export const messageAttachmentBaseSchema = z.object({
    type: z.enum(['audio', 'video', 'file']),
    payload: z.object({
        url: z.string(),
    }),
});

export const messageAttachmentImageSchema = z.object({
    type: z.literal('image'),
    payload: z.object({
        url: z.string(),
        sticker_id: z.string().optional(),
    }),
});

export const messageAttachmentFallbackSchema = z.object({
    type: z.literal('fallback'),
    payload: z.object({
        url: z.string(),
        title: z.string(),
    }).optional(),
});

export const messageAttachmentTemplateSchema = z.object({
    type: z.literal('template'),
    payload: z.object({
        product: z.object({}).passthrough(),
    }),
});

export const messageAttachmentSchema = z.discriminatedUnion('type', [
    messageAttachmentBaseSchema,
    messageAttachmentImageSchema,
    messageAttachmentFallbackSchema,
    messageAttachmentTemplateSchema,
]);

export const messageEventBaseSchema = z.object({
    mid: z.string(),
    text: z.string(),
    reply_to: z.object({
        mid: z.string(),
    }).optional(),
    quick_reply: z.object({
        payload: z.string(),
    }).optional(),
    attachments: z.array(messageAttachmentSchema).optional(),
});

export const textMessageEventSchema = messageEventBaseSchema.omit({
    attachments: true,
    reply_to: true,
});

export const replyMessageEventSchema = messageEventBaseSchema.omit({
    attachments: true,
    quick_reply: true,
});

export const attachmentMessageEventSchema = messageEventBaseSchema.extend({
    attachments: z.array(messageAttachmentSchema)
});


export const messagingBaseSchema = z.object({
    sender: z.object({
        id: z.string(),
        user_ref: z.string().optional(),
    }),
    recipient: z.object({
        id: z.string(),
    }),

});

export const messageMessagingSchema = messagingBaseSchema.extend({
    message: z.union([
        textMessageEventSchema,
        replyMessageEventSchema,
        attachmentMessageEventSchema,
        messageEventBaseSchema.passthrough(),
    ]),
});

export const postbackPayloadSchema = z.object({
    cid: z.string(),
    action: z.string()
});

export const postbackSchema = messagingBaseSchema.extend({
    postback: z.object({
        title: z.string(),
        payload: z.preprocess((val) => typeof val == 'string' ? JSON.parse(val) : val, postbackPayloadSchema),
    })
});

export const messagingSchema = z.union([
    messageMessagingSchema,
    postbackSchema
]);

export const enitySchema = z.object({
    id: z.string(),
    time: z.number(),
    messaging: z.array(messagingSchema).max(1).min(1),
});

export const eventSchema = z.object({
    object: z.literal('page'),
    entry: z.array(enitySchema),
});