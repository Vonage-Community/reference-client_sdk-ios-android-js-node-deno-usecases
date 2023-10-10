import { z } from 'zod';
import {
    channelSchema,
    conversationSchema,
    mediaSchema,
    userSchema,
    reasonSchema
} from './schemas';


const timestampSchema = z.string().datetime({ offset: true });

export const RTCEventBaseNoConv = z.object({
    type: z.string(),
    timestamp: timestampSchema,
    application_id: z.string(),
    from: z.string().optional(),
    params: z.object({}).passthrough().optional(),
    body: z.object({}).passthrough(),
}).passthrough();


export const RTCEventBase = RTCEventBaseNoConv.extend({
    // type: z.string(),
    // timestamp: timestampSchema,
    // application_id: z.string(),
    // from: z.string().optional(),
    // params: z.object({}).passthrough().optional(),
    // body: z.object({}).passthrough(),
    id: z.number(),
    conversation_id: z.string().optional(),
    cid: z.string().optional(),
    _embedded: z.object({
        from_user: z.object({
            id: z.string(),
            name: z.string(),
            display_name: z.string().optional(),
            image_url: z.string().optional(),
            custom_data: z.object({}).passthrough().optional(),
        }).passthrough().optional(),
        from_member: z.object({
            id: z.string(),
        }).passthrough().optional(),
    }).passthrough().optional(),

});

export const unsupportedEvent = RTCEventBase.extend({
    type: z.string().transform(() => 'unsupported').pipe(
        z.literal('unsupported'),
    ),
    id: z.number().optional(),
}).passthrough();

export const memberMessageStatusEvent = RTCEventBase.extend({
    type: z.literal('member:message:status'),
});

export const memberMediaEvent = RTCEventBase.extend({
    type: z.literal('member:media'),
    body: z.object({
        audio: z.boolean(),
        media: mediaSchema,
        channel: channelSchema,
    }).optional(),
});

export const memberInvitedEvent = RTCEventBase.extend({
    type: z.literal('member:invited'),
    body: z.object({
        cname: z.string(),
        user: userSchema,
        channel: channelSchema,
        conversation: conversationSchema,
        media: mediaSchema,
        invied_by: z.string(),
        member_id: z.string(),
        sdp: z.string(),
        timestamp: z.record(z.string().datetime({ offset: true })),
        initiator: z.object({}).passthrough(),
        invited_by_member: z.object({
            channel: channelSchema,
            media: mediaSchema,
            member_id: z.string(),
            name: z.string(),
            state: z.string(),
            timestamp: z.record(z.string().datetime({ offset: true })),
            user_id: z.string(),
        }),
    }),
});

export const memberJoinedEvent = RTCEventBase.extend({
    type: z.literal('member:joined'),
    body: z.object({
        cname: z.string().optional(),
        user: userSchema,
        channel: channelSchema,
        conversation: conversationSchema.optional(),
        media: mediaSchema.optional(),
        member_id: z.string(),
        sdp: z.string().optional(),
        timestamp: z.record(z.string().datetime({ offset: true })),
    }).passthrough(),
});

export const memberLeftEvent = RTCEventBase.extend({
    type: z.literal('member:left'),
    body: z.object({
        cname: z.string().optional(),
        user: userSchema,
        channel: channelSchema,
        conversation: conversationSchema.optional(),
        media: mediaSchema.optional(),
        member_id: z.string(),
        sdp: z.string().optional(),
        timestamp: z.record(z.string().datetime({ offset: true })),
        reason: reasonSchema.optional()
    }).passthrough(),
});




export const rtcHangupEvent = RTCEventBase.extend({
    type: z.literal('rtc:hangup'),
    body: z.object({
        channel: channelSchema,
        direction: z.enum(['inbound', 'outbound']),
        bandwidth: z.object({
            bytes_in: z.number(),
            bytes_out: z.number(),
        }),
        reason: z.object({
            code: z.string(),
            text: z.string(),
            sip_code: z.number(),
        }),
        quality: z.record(z.number()),
    }),
});

export const messageEvent = RTCEventBase.extend({
    type: z.literal('message'),
    body: z.object({
        message_type: z.enum([
            'text',
            'image',
            'video',
            'audio',
            'file',
            'vcard',
            'location',
            'template',
            'custom',
        ]),
        text: z.string().optional(),
        messenger: z.object({
            category: z.string(),
            tag: z.string(),
        }).optional(),
        viber_service: z.object({
            type: z.string(),
            tag: z.string(),
            ttl: z.number(),
        }).optional(),
    }),
});


export const conversationCreatedEvent = RTCEventBaseNoConv.extend({
    type: z.literal('conversation:created'),
    body: z.object({
        id: z.string(),
        name: z.string(),
        timestamp: z.record(z.string(), timestampSchema),
        state: z.string().optional(),
        display_name: z.string().optional(),
        image_url: z.string().optional(),
    }).passthrough(),
});

export const appKnocking = RTCEventBaseNoConv.extend({
    type: z.literal('app:knocking'),
    body: z.object({
        user: z.object({
            id: z.string()
        }).optional(),
        channel: channelSchema.optional()
    }).passthrough(),
});

