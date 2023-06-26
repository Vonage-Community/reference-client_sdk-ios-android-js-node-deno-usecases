/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { CancelReason, HangupReason } from '@vonage/client-sdk';
import React from 'react';

export interface VoiceCallState {
    callState: 'idle' | 'ringing' | 'in-progress' | 'reconnectable';
    callId?: string;
    direction: 'incoming' | 'outgoing' | 'unknown';
    callCtx?: Record<string, any>;
    from?: {
        name: string;
        channel: string;
    };
    // Media Status
    muted: boolean;
    earmuffed: boolean;

    reason?: CancelReason | HangupReason 
}

const VoiceCallActions = {
    'call:initiated': 'call:initiated',
    'call:invite': 'call:invite',
    'call:invite:cancel': 'call:invite:cancel',
    'call:invite:answered': 'call:invite:answered',
    'call:invite:rejected': 'call:invite:rejected',
    'call:reconnectable': 'call:reconnectable',
    'call:reconnect': 'call:reconnect',
    'call:mute:updated': 'call:mute:updated',
    'call:earmuff:updated': 'call:earmuff:updated',
    'call:hangup': 'call:hangup',
    'call:state:updated': 'call:state:updated',
};

type CallInitiatedAction = {
    type: 'call:initiated';
    callId: string;
    callCtx?: Record<string, any>;
};

type CallInviteAction = {
    type: 'call:invite';
    callId: string;
    from: {
        name: string;
        channel: string;
    };
};

type CallInviteCancelAction = {
    type: 'call:invite:cancel';
    reason: CancelReason;
};

type CallInviteAnsweredAction = {
    type: 'call:invite:answered';
};

type CallInviteRejectedAction = {
    type: 'call:invite:rejected';
};

type CallReconnectableAction = {
    type: 'call:reconnectable';
    callId: string;
    callCtx?: Record<string, any>;
    from: {
        name: string;
        channel: string;
    };
    direction: 'incoming' | 'outgoing';
};

type CallReconnectAction = {
    type: 'call:reconnect';
};

type CallMuteUpdatedAction = {
    type: 'call:mute:updated';
    muted: boolean;
};

type CallEarmuffUpdatedAction = {
    type: 'call:earmuff:updated';
    earmuffed: boolean;
};

type CallHangupAction = {
    type: 'call:hangup';
    reason: HangupReason;
};

type CallStateUpdatedAction = {
    type: 'call:state:updated';
    callState: 'in-progress';
};

type VoiceCallAction = 
    CallInitiatedAction | 
    CallInviteAction | 
    CallInviteCancelAction | 
    CallInviteAnsweredAction | 
    CallInviteRejectedAction | 
    CallMuteUpdatedAction | 
    CallEarmuffUpdatedAction | 
    CallHangupAction | 
    CallStateUpdatedAction | 
    CallReconnectableAction | 
    CallReconnectAction;

const VoiceCallReducer: React.Reducer<VoiceCallState, VoiceCallAction> = (state, action) => {
    switch (action.type) {
        case 'call:initiated':
            return { callState: 'ringing', callId: action.callId, callCtx: action.callCtx, from: undefined, direction: 'outgoing', muted: false, earmuffed: false};
        case 'call:invite':
            return { callState: 'ringing', callId: action.callId, from: action.from, callCtx: undefined, direction: 'incoming', muted: false, earmuffed: false };
        case 'call:invite:cancel':
            return { ...state, callState: 'idle', reason: action.reason, muted: false, earmuffed: false, direction: 'unknown' };
        case 'call:invite:answered':
            return { ...state, callState: 'in-progress' };
        case 'call:invite:rejected':
            return { ...state, callState: 'idle',reason: HangupReason.LOCAL_HANGUP, muted: false, earmuffed: false, direction: 'unknown' };
        case 'call:reconnectable':
            return { callState: 'reconnectable', callId: action.callId, callCtx: action.callCtx, from: action.from, direction: action.direction , muted: false, earmuffed: false};
        case 'call:reconnect':
            return { ...state, callState: 'in-progress' };
        case 'call:mute:updated':
            return { ...state, muted: action.muted };
        case 'call:earmuff:updated':
            return { ...state, earmuffed: action.earmuffed };
        case 'call:hangup':
            return { ...state, callState: 'idle', reason: action.reason, muted: false, earmuffed: false, direction: 'unknown' };
        case 'call:state:updated':
            return { ...state, callState: action.callState };
        default:
            return state;
    }
};

export const VoiceCallContext = React.createContext<[VoiceCallState, React.Dispatch<VoiceCallAction>]>(
    [ { callState: 'idle', direction: 'unknown', muted: false, earmuffed: false }, () => {} ]
);

export type VoiceCallContainerProps = {
    enableLocalCache?: boolean;
    children: React.ReactNode;
};

export const VoiceCallContainer = ({ children, enableLocalCache=false }: VoiceCallContainerProps) => {
    const [state, dispatch] = React.useReducer(VoiceCallReducer, { callState: 'idle', direction: 'unknown', muted: false, earmuffed: false });

    const isLocalCacheReconnectable = (callId: string) => {
        if (!enableLocalCache) return false;
        const localTimestamp = localStorage.getItem(`call:${callId}:timestamp`);
        if (!localTimestamp) return false;

        const localTimestampNumber = Number(localTimestamp);
        const now = Date.now();
        const diff = now - localTimestampNumber;

        return diff < 1000 * 15; // 15 seconds
    };

    React.useEffect(() => {
        if (!enableLocalCache) return;
        const localCallId = localStorage.getItem('call:id');
        if (!localCallId) return;
        if (!isLocalCacheReconnectable(localCallId)) return;
        const localCallCtx = localStorage.getItem(`call:${localCallId}:ctx`);
        const localCallFrom = localStorage.getItem(`call:${localCallId}:from`);
        const localCallDirection = localStorage.getItem(`call:${localCallId}:direction`);

        console.log('reconnectable', localCallId, localCallCtx, localCallFrom, localCallDirection);


        dispatch({
            type:'call:reconnectable',
            callId: localCallId,
            callCtx: localCallCtx ? JSON.parse(localCallCtx) : undefined,
            from: localCallFrom ? JSON.parse(localCallFrom) : undefined,
            direction: localCallDirection as 'incoming' | 'outgoing',
        });
    }, []);

    React.useEffect(() => {
        if (!enableLocalCache) return;
        if (!state.callId) return;
        if (state.callState == 'idle') return;
        localStorage.setItem('call:id', state.callId);
        if (state.callCtx) localStorage.setItem(`call:${state.callId}:ctx`, JSON.stringify(state.callCtx));
        if (state.from) localStorage.setItem(`call:${state.callId}:from`, JSON.stringify(state.from));
        localStorage.setItem(`call:${state.callId}:direction`, state.direction);

        return () => { 
            localStorage.removeItem('call:id');
            localStorage.removeItem(`call:${state.callId}:ctx`);
            localStorage.removeItem(`call:${state.callId}:from`);
            localStorage.removeItem(`call:${state.callId}:direction`);
        };
    }, [enableLocalCache, state.callId, state.callCtx, state.from, state.direction]);

    React.useEffect(() => {
        if (!enableLocalCache) return;
        const i = setInterval(() => {
            if (!state.callId && state.callState ==  'idle') return;
            localStorage.setItem(`call:${state.callId}:timestamp`, Date.now().toString());
        }, 1000);

        return () => {
            clearInterval(i);
            localStorage.removeItem(`call:${state.callId}:timestamp`);
        };
    }, [enableLocalCache, state.callId, state.callState]);


    return (
        <VoiceCallContext.Provider value={[state, dispatch]}>
            {children}
        </VoiceCallContext.Provider>
    );
};

export const useVoiceCallContainer = () => {
    return React.useContext(VoiceCallContext);
};
