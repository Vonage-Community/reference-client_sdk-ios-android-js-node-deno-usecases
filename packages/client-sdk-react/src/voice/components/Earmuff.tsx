import { IconVolume, IconVolumeOff } from "@tabler/icons-react";
import React, { ComponentType, ReactNode } from "react";
import { useCallStatus, useEarmuff } from "../hooks";
import {
  defaultIndecatorButtonContainer,
  IndecatorContainerButtonProps,
  IndecatorContainerProps,
  IndecatorProps,
} from "./utils";

const defaultEarmuffIndecator = ({
  isActive,
  className,
  activeClassName,
  inactiveClassName,
}: IndecatorProps) => {
  return (
    <>
      <IconVolume className={`${className} ${inactiveClassName}`} />
      <IconVolumeOff className={`${className} ${activeClassName}`} />
    </>
  );
};

type EarmuffProps = {
  className?: string;
  button?: boolean;

  earmuffedClassName?: string;
  earmuffedLabel?: ReactNode;
  unearmuffedClassName?: string;
  unearmuffedLabel?: ReactNode;

  IndecatorContainer?: ComponentType<IndecatorContainerProps>;
  IndecatorContainerButton?: ComponentType<IndecatorContainerButtonProps>;
  Indecator?: ComponentType<IndecatorProps>;
  indecatorClassName?: string;
  indecatorUnearmuffedClassName?: string;
  indecatorEarmuffdClassName?: string;
};

export const Earmuff = ({
  className = "vg-btn vg-swap vg-earmuff ",
  earmuffedClassName = " vg-swap-active vg-earmuff__earmuffed",
  earmuffedLabel,
  unearmuffedClassName = "vg-earmuff__unearmuffed",
  unearmuffedLabel,
  IndecatorContainer,
  IndecatorContainerButton = defaultIndecatorButtonContainer,
  indecatorClassName = "vg-earmuff-indecator",
  indecatorUnearmuffedClassName = " vg-swap-off vg-earmuff-indecator__unearmuffed",
  indecatorEarmuffdClassName = "vg-swap-on vg-btn-error vg-earmuff-indecator__earmuffed",
  Indecator = defaultEarmuffIndecator,
}: EarmuffProps) => {
  const { isEarmuffed, toggleEarmuff } = useEarmuff();
  const { callStatus } = useCallStatus();

  if (callStatus !== "in-progress") return null;

  if (earmuffedLabel && unearmuffedLabel && IndecatorContainer)
    return (
      <IndecatorContainer
        isActive={isEarmuffed}
        className={className}
        activeClassName={earmuffedClassName}
        inactiveClassName={unearmuffedClassName}
      >
        {isEarmuffed ? earmuffedLabel : unearmuffedLabel}
      </IndecatorContainer>
    );

  if (earmuffedLabel && unearmuffedLabel && IndecatorContainerButton)
    return (
      <IndecatorContainerButton
        isActive={isEarmuffed}
        onClick={toggleEarmuff}
        className={className}
        activeClassName={earmuffedClassName}
        inactiveClassName={unearmuffedClassName}
      >
        {isEarmuffed ? earmuffedLabel : unearmuffedLabel}
      </IndecatorContainerButton>
    );

  if (IndecatorContainer)
    return (
      <IndecatorContainer
        isActive={isEarmuffed}
        className={className}
        activeClassName={earmuffedClassName}
        inactiveClassName={unearmuffedClassName}
      >
        <Indecator
          className={indecatorClassName}
          isActive={isEarmuffed}
          activeClassName={indecatorEarmuffdClassName}
          inactiveClassName={indecatorUnearmuffedClassName}
        />
      </IndecatorContainer>
    );

  return (
    <IndecatorContainerButton
      isActive={isEarmuffed}
      onClick={toggleEarmuff}
      className={className}
      activeClassName={earmuffedClassName}
      inactiveClassName={unearmuffedClassName}
    >
      <Indecator
        className={indecatorClassName}
        isActive={isEarmuffed}
        activeClassName={indecatorEarmuffdClassName}
        inactiveClassName={indecatorUnearmuffedClassName}
      />
    </IndecatorContainerButton>
  );
};
