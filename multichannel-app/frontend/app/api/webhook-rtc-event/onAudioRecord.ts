import { z } from 'zod';
import { audioRecordEvent } from './events';
import { getRTCLogger } from '../logger';
import { kv } from '@vercel/kv';

const logger = getRTCLogger('audio-record');

export const onAudioRecord = async (
    event: z.infer<typeof audioRecordEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;
    const recordingId = event.body.recording_id;

    if (conversationId && recordingId) {
        let key = `conversation:${conversationId}:`;
        key += event.body.transcription ? 'transcribe' : 'record';
        await kv.set(key, recordingId);
    }
};
