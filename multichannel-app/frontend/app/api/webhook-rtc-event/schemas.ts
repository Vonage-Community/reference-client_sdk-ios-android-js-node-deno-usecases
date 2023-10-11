import { z } from 'zod';

export const channelSchema = z.object({
    to: z.object({
        type: z.string().optional(),
        headers: z.object({}).passthrough().optional(),
        number: z.string().optional(),
    }).passthrough().optional(),
    from: z.object({
        type: z.string().optional(),
        headers: z.object({}).passthrough().optional(),
        number: z.string().optional(),
    }).optional(),
    id: z.string().optional(),
    type: z.string(),
    header: z.object({}).passthrough().optional(),
});

export const conversationSchema = z.object({
    conversation_id: z.string(),
    display_name: z.string().optional(),
    name: z.string(),
    image_url: z.string().optional(),
});

export const mediaSchema = z.object({
    audio_settings: z.object({
        enabled: z.boolean(),
        muted: z.boolean(),
        earmuffed: z.boolean(),
    }),
    audio: z.boolean(),
});

export const userSchema = z.object({
    member_id: z.string().optional(),
    id: z.string(),
    media: mediaSchema.optional(),
    display_name: z.string().optional(),
    name: z.string(),
    image_url: z.string().optional(),
    properties: z.object({
        custom_data: z.object({}).passthrough(),
    }).passthrough(),
});

export const reasonSchema = z.object({
    text: z.string().optional()
});

export const transcriptionSchema = z.object({
    language: z.string(),
    sentiment_analysis: z.boolean().optional()
});

export const asrResultSchema = z.object({
    word: z.string(),
    confidence: z.number()
});

export const asrDoneSchema = z.object({
    results: z.array(asrResultSchema),
    error: z.string(),
    asr_id: z.string(),
    call_id: z.string(),
    timeout_reason: z.string().optional()
});

export const asrRecordDoneSchema = z.object({
    error: z.string(),
    asr_id: z.string(),
    call_id: z.string(),
    destination_url: z.string(),
    format: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    size: z.number(),
    media_service_uuid: z.string()
});