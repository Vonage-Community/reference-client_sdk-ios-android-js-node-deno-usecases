import { ReactNode } from 'react';



export type ActionProps = {
    className?: string;
    onClick: () => void;
    label: string;
    disabled?: boolean;
    disabledLabel?: string;
};

export type TextProps = {
    className?: string;
    children: ReactNode;
};

export type InputProps = {
    className?: string;
    placeholder?: string;
    value?: string;
    onChange: (value: string) => void
}

export type IndecatorProps = {
    isActive: boolean;
    className?: string;
    activeClassName?: string;
    inactiveClassName?: string;
};

export type ContainerProps = {
    children: ReactNode
    className?: string;
};
export type IndecatorContainerProps = ContainerProps & IndecatorProps;

export type IndecatorContainerButtonProps = IndecatorContainerProps & {
    onClick: () => void;
};

export const defaultContainer = ({children, className}: ContainerProps) => {
    return (
        <div className={className}>
            {children}
        </div>
    );
};

export const defaultAction = ({onClick, label, disabledLabel, className, disabled}: ActionProps) => {
    return (
        <button className={className} onClick={onClick} disabled={disabled}>{disabled ? disabledLabel : label}</button>
    );
};

export const defaultText = ({children, className}: TextProps) => {
    return (
        <span className={className}>{children}</span>
    );
};

export const defaultInput = ({className, placeholder, value, onChange}: InputProps) => {
    return(
        <input className={className} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}></input>
    );
};

export const defaultIndecatorContainer = ({isActive, className, activeClassName, inactiveClassName, children}: IndecatorContainerProps) => {
    return (
        <div className={`${className} ${isActive ? activeClassName : inactiveClassName}`}>
            {children}
        </div>
    );
};

export const defaultIndecatorButtonContainer = ({onClick, isActive, className, activeClassName, inactiveClassName, children}: IndecatorContainerButtonProps) => {
    return (
        <button className={`${className} ${isActive ? activeClassName : inactiveClassName}`} onClick={onClick}>
            {children}
        </button>
    );
};
