import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";
import React, { ComponentType, ReactNode } from "react";
import { useCallStatus, useMute } from "../hooks";
import {
  defaultIndecatorButtonContainer,
  IndecatorContainerButtonProps,
  IndecatorContainerProps,
  IndecatorProps,
} from "./utils";

const defaultMuteIndecator = ({
  isActive,
  className,
  activeClassName,
  inactiveClassName,
}: IndecatorProps) => {
  return (
    <>
      <IconMicrophone className={`${className} ${inactiveClassName}`} />
      <IconMicrophoneOff className={`${className} ${activeClassName}`} />
    </>
  );
};

type MuteProps = {
  className?: string;

  mutedClassName?: string;
  mutedLabel?: ReactNode;
  unmutedClassName?: string;
  unmutedLabel?: ReactNode;

  IndecatorContainer?: ComponentType<IndecatorContainerProps>;
  IndecatorContainerButton?: ComponentType<IndecatorContainerButtonProps>;
  Indecator?: ComponentType<IndecatorProps>;
  indecatorClassName?: string;
  indecatorUnmutedClassName?: string;
  indecatorMutedClassName?: string;
};

export const Mute = ({
  className = "vg-btn vg-swap vg-mute ",
  mutedClassName = "vg-swap-active vg-mute__muted",
  mutedLabel,
  unmutedClassName = "vg-mute__unmuted",
  unmutedLabel,
  IndecatorContainer,
  IndecatorContainerButton = defaultIndecatorButtonContainer,
  indecatorClassName = "vg-mute-indecator",
  indecatorUnmutedClassName = "vg-swap-off vg-mute-indecator__unmuted",
  indecatorMutedClassName = "vg-swap-on vg-btn-error vg-mute-indecator__muted",
  Indecator = defaultMuteIndecator,
}: MuteProps) => {
  const { isMuted, toggleMute } = useMute();
  const { callStatus } = useCallStatus();

  if (callStatus !== "in-progress") return null;

  if (mutedLabel && unmutedLabel && IndecatorContainer)
    return (
      <IndecatorContainer
        isActive={isMuted}
        className={className}
        activeClassName={mutedClassName}
        inactiveClassName={unmutedClassName}
      >
        {isMuted ? mutedLabel : unmutedLabel}
      </IndecatorContainer>
    );

  if (mutedLabel && unmutedLabel && IndecatorContainerButton)
    return (
      <IndecatorContainerButton
        isActive={isMuted}
        onClick={toggleMute}
        className={className}
        activeClassName={mutedClassName}
        inactiveClassName={unmutedClassName}
      >
        {isMuted ? mutedLabel : unmutedLabel}
      </IndecatorContainerButton>
    );

  if (IndecatorContainer)
    return (
      <IndecatorContainer
        isActive={isMuted}
        className={className}
        activeClassName={mutedClassName}
        inactiveClassName={unmutedClassName}
      >
        <Indecator
          className={indecatorClassName}
          isActive={isMuted}
          activeClassName={indecatorMutedClassName}
          inactiveClassName={indecatorUnmutedClassName}
        />
      </IndecatorContainer>
    );

  return (
    <IndecatorContainerButton
      isActive={isMuted}
      onClick={toggleMute}
      className={className}
      activeClassName={mutedClassName}
      inactiveClassName={unmutedClassName}
    >
      <Indecator
        className={indecatorClassName}
        isActive={isMuted}
        activeClassName={indecatorMutedClassName}
        inactiveClassName={indecatorUnmutedClassName}
      />
    </IndecatorContainerButton>
  );
};
