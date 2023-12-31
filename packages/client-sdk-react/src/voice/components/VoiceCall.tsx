import { Json } from '@vonage/client-sdk';
import { VoiceCallContainer } from '../VoiceCallContainer';
import { CallControls } from './CallControls';
import { IncomingCall } from './IncomingCall';
import { ServerCall } from './ServerCall';

type VoiceCallProps = {
    enableIncomingCall?: boolean;
    enableOutgoingCall?: boolean;

    outgoingCallContext?: Json;
};
export const VoiceCall = ({
    enableIncomingCall = true,
    enableOutgoingCall = true,
    outgoingCallContext,
}: VoiceCallProps) => {
    return (
        <VoiceCallContainer enableLocalCache={true}>
            {enableIncomingCall && <IncomingCall />}
            {enableOutgoingCall && <ServerCall callContext={outgoingCallContext} />}
            <CallControls />
        </VoiceCallContainer>
    );
};
