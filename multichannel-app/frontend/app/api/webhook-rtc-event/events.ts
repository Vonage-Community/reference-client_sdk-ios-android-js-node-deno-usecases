import { z } from 'zod';
import {
    channelSchema,
    conversationSchema,
    mediaSchema,
    userSchema,
    reasonSchema,
    transcriptionSchema,
    asrDoneSchema,
    asrRecordDoneSchema
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
const messenger = z.object({
    category: z.string(),
    tag: z.string(),
});

const viber_service = z.object({
    type: z.string(),
    tag: z.string(),
    ttl: z.number(),
});

const textMessageBody = z.object({
    message_type: z.literal('text'),
    text: z.string(),
    messenger: messenger.optional(),
    viber_service: viber_service.optional(),
});

const imageMessageBody = z.object({
    message_type: z.literal('image'),
    image: z.object({
        url: z.string(),
        caption: z.string().optional(),
    }),
    messenger: messenger.optional(),
    viber_service: viber_service.optional(),
});

const videoMessageBody = z.object({
    message_type: z.literal('video'),
    video: z.object({
        url: z.string(),
        caption: z.string().optional(),
    }),
    messenger: messenger.optional(),
    viber_service: viber_service.optional(),
});

const audioMessageBody = z.object({
    message_type: z.literal('audio'),
    audio: z.object({
        url: z.string(),
        caption: z.string().optional(),
    }),
    messenger: messenger.optional(),
    viber_service: viber_service.optional(),
});

const fileMessageBody = z.object({
    message_type: z.literal('file'),
    file: z.object({
        url: z.string(),
        caption: z.string().optional(),
    }),
    messenger: messenger.optional(),
    viber_service: viber_service.optional(),
});

const vcardMessageBody = z.object({
    message_type: z.literal('vcard'),
    vcard: z.object({
        url: z.string(),
    }),
    messenger: messenger.optional(),
    viber_service: viber_service.optional(),
});

const locationMessageBody = z.object({
    message_type: z.literal('location'),
    location: z.object({
    }).passthrough(),
    messenger: messenger.optional(),
    viber_service: viber_service.optional(),
});

const templateMessageBody = z.object({
    message_type: z.literal('template'),
}).passthrough();

const customMessageBody = z.object({
    message_type: z.literal('custom'),
}).passthrough();

const messageBody = z.discriminatedUnion('message_type', [
    textMessageBody,
    imageMessageBody,
    videoMessageBody,
    audioMessageBody,
    fileMessageBody,
    vcardMessageBody,
    locationMessageBody,
    templateMessageBody,
    customMessageBody,
]);

export const messageEvent = RTCEventBase.extend({
    type: z.literal('message'),
    to: z.string().optional(),
    from: z.string().optional(),
    body: messageBody,
});
export type MessageEvent = z.infer<typeof messageEvent>;

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

export const audioSayEvent = RTCEventBase.extend({
    type: z.literal('audio:say'),
    body: z.object({
        level: z.number(),
        loop: z.number(),
        queue: z.boolean().optional(),
        voice_name: z.string().optional(),
        language: z.string().optional(),
        style: z.number().optional(),
        premium: z.boolean().optional(),
        text: z.string(),
        ssml: z.boolean().optional(),
        say_id: z.string(),
    }).passthrough(),
});

export const audioSayStopEvent = RTCEventBase.extend({
    type: z.literal('audio:say:stop'),
    body: z.object({
        say_id: z.string()
    }).passthrough(),
});

export const audioSayDoneEvent = RTCEventBase.extend({
    type: z.literal('audio:say:done'),
    body: z.object({
        say_id: z.string(),
        error: z.string().optional(),
        channel: channelSchema.optional()
    }).passthrough(),
});

export const audioPlayEvent = RTCEventBase.extend({
    type: z.literal('audio:play'),
    body: z.object({
        queue: z.boolean().optional(),
        level: z.number(),
        loop: z.number(),
        stream_url: z.array(z.string()),
        play_id: z.string()
    }).passthrough(),
});

export const audioPlayStopEvent = RTCEventBase.extend({
    type: z.literal('audio:play:stop'),
    body: z.object({
        play_id: z.string()
    }).passthrough(),
});

export const audioPlayDoneEvent = RTCEventBase.extend({
    type: z.literal('audio:play:done'),
    body: z.object({
        play_id: z.string(),
        error: z.string().optional(),
        channel: channelSchema.optional()
    }).passthrough(),
});

export const audioRecordEvent = RTCEventBase.extend({
    type: z.literal('audio:record'),
    body: z.object({
        validity: z.number().optional(),
        streamed: z.boolean().optional(),
        format: z.string().optional(),
        beep_start: z.boolean().optional(),
        beep_stop: z.boolean().optional(),
        detect_speech: z.boolean().optional(),
        split: z.boolean().optional(),
        multitrack: z.boolean().optional(),
        channels: z.number().optional(),
        transcription: transcriptionSchema.optional(),
        recording_id: z.string()
    }).passthrough(),
});

export const audioRecordStopEvent = RTCEventBase.extend({
    type: z.literal('audio:record:stop'),
    body: z.object({
        record_id: z.string()
    }).passthrough(),
});

export const audioRecordDoneEvent = RTCEventBase.extend({
    type: z.literal('audio:record:done'),
    body: z.object({
        event_id: z.number().optional(),
        recording_id: z.string(),
        destination_url: z.string(),
        format: z.string(),
        start_time: z.string(),
        end_time: z.string(),
        size: z.number(),
        channel: channelSchema.optional()
    }).passthrough(),
});

export const audioAsrDoneEvent = RTCEventBase.extend({
    type: z.literal('audio:asr:done'),
    body: z.object({
        channel: channelSchema.optional(),
        asr: asrDoneSchema
    }).passthrough(),
});

export const audioAsrRecordDoneEvent = RTCEventBase.extend({
    type: z.literal('audio:asr:record:done'),
    body: z.object({
        channel: channelSchema.optional(),
        asr: asrRecordDoneSchema
    }).passthrough(),
});

export const audioTranscribeDoneEvent = RTCEventBase.extend({
    type: z.literal('audio:transcribe:done'),
    body: z.object({
        request_id: z.string(),
        recording_id: z.string(),
        transcription_url: z.string().optional(),
        error: z.string().optional()
    }).passthrough(),
});
