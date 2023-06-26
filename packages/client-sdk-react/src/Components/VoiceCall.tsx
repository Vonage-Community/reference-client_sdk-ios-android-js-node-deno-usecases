import { VoiceCallContainer } from '../VoiceCallContainer';
import { CallControls } from './CallControls';
import { IncomingCall } from './IncomingCall';
import { ServerCall } from './ServerCall';

type VoiceCallProps = {
    enableIncomingCall?: boolean;
    enableOutgoingCall?: boolean;

    outgoingCallContext?: Record<string, unknown>;
};
export const VoiceCall = ({enableIncomingCall = true, enableOutgoingCall = true, outgoingCallContext}: VoiceCallProps) => {

    return (
        <VoiceCallContainer enableLocalCache={true}>
            {enableIncomingCall && <IncomingCall />}
            {enableOutgoingCall && <ServerCall callContext={outgoingCallContext} />}
            <CallControls />
        </VoiceCallContainer>
    );
};