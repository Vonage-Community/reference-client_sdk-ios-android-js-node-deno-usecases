import { ComponentType, ReactFragment, ReactNode } from 'react';
import { useServerCall, useCallStatus, useHangup } from '../hooks';
import {
  ContainerProps,
  ActionProps,
  defaultContainer,
  defaultAction,
  TextProps,
  defaultText,
} from './utils';
import { Json } from '@vonage/client-sdk';

export type ServerCallProps = {
  className?: string;
  label?: string;
  ringingLabel?: string;
  cancelLabel?: string;
  callContext?: Json;

  RootContainer?: ComponentType<ContainerProps>;
  ActionContainer?: ComponentType<ActionProps>;
  RingingContainer?: ComponentType<ContainerProps>;
  RingingMessage?: ComponentType<TextProps>;
  CancelActionContainer?: ComponentType<ActionProps>;
  actionClassName?: string;
  ringingClassName?: string;
};

export const ServerCall = ({
  callContext,
  className = 'vg-server-call',
  actionClassName = 'vg-server-call__action',
  ringingClassName = 'vg-server-call__ringing',
  label = 'Start Call',
  RootContainer = defaultContainer,
  ActionContainer = defaultAction,
  cancelLabel = 'Cancel Call',
  ringingLabel = 'Call is ringing',
  RingingContainer = defaultContainer,
  RingingMessage = defaultText,
  CancelActionContainer: RingingActionContainer = defaultAction,
}: ServerCallProps) => {
  const { startCall, isRinging } = useServerCall();
  const { hangup } = useHangup();
  const { callStatus } = useCallStatus();

  if (isRinging)
    return (
      <RingingContainer className={className}>
        <RingingMessage className={ringingClassName}>
          {ringingLabel}
        </RingingMessage>
        <RingingActionContainer
          className={actionClassName}
          label={cancelLabel}
          onClick={hangup}
        />
      </RingingContainer>
    );

  if (callStatus !== 'reconnectable' && callStatus !== 'idle') return null;

  return (
    <RootContainer className={className}>
      <ActionContainer
        className={actionClassName}
        onClick={() => startCall(callContext)}
        label={label}
      />
    </RootContainer>
  );
};
