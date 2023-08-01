import { ComponentType, ReactFragment } from "react";
import { useIncomingCall } from "../hooks";
import {
  ActionProps,
  ContainerProps,
  defaultAction,
  defaultContainer,
  defaultText,
  TextProps,
} from "./utils";

export type IncomingCallProps = {
  className?: string;
  RootContainer?: ComponentType<ContainerProps>;
  InfoContainer?: ComponentType<ContainerProps>;
  infoClassName?: string;
  InfoText?: ComponentType<TextProps>;
  infoTextClassName?: string;
  ActionsContainer?: ComponentType<ContainerProps>;
  actionsClassName?: string;
  Action?: ComponentType<ActionProps>;
  actionClassName?: string;
  anserClassName?: string;
  answerLabel?: string;
  rejectClassName?: string;
  rejectLabel?: string;
};

export const IncomingCall = ({
  className = "vg-incoming-call",
  RootContainer = defaultContainer,
  InfoContainer = defaultContainer,
  infoClassName = "vg-incoming-call__info",
  InfoText = defaultText,
  infoTextClassName = "vg-incoming-call__info__text",
  ActionsContainer = defaultContainer,
  actionsClassName = "vg-incoming-call__actions",
  Action = defaultAction,
  actionClassName = "vg-incoming-call__actions__action",
  anserClassName = "vg-incoming-call__actions__action__answer",
  answerLabel = "Answer",
  rejectClassName = "vg-incoming-call__actions__action__reject",
  rejectLabel = "Reject",
}: IncomingCallProps) => {
  const { isRinging, invite, answerCall, rejectCall } = useIncomingCall();

  if (!isRinging) return null;

  return (
    <RootContainer className={className}>
      <InfoContainer className={infoClassName}>
        <InfoText className={infoTextClassName}>
          {invite?.from} via {invite?.channel}
        </InfoText>
      </InfoContainer>
      <ActionsContainer className={actionsClassName}>
        <Action
          className={`${actionClassName} ${anserClassName}`}
          onClick={answerCall}
          label={answerLabel}
        />
        <Action
          className={`${actionClassName} ${rejectClassName}`}
          onClick={rejectCall}
          label={rejectLabel}
        />
      </ActionsContainer>
    </RootContainer>
  );
};
