'use client';

import { useCallStatus, VoiceCall } from '@vonage/client-sdk-react';
import {useState} from 'react';

const callTypes = ['app', 'phone'] as const;

export const Call = () => {
    const [callee, setCallee] = useState<string>('');
    const [callType, setCallType] = useState<typeof callTypes[number]>(callTypes[0]);

    return (
        <div className='card bg-base-200'>
            <div className='card-body'>
                <div className='flex flex-col gap-3 mb-4 '>
                    <div className='form-control '>
                        <label className='input-group'>
                            <span className='w-1/5 input-group-text'>Call Type</span>
                            <select className='w-4/5 input' value={callType} onChange={(e) => setCallType(e.target.value as typeof callTypes[number])}>
                                {callTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </label>
                    </div>
                        <div className='form-control'>
                            <label className=' input-group'>
                                <span className='w-1/5 input-group-text'>{
                                    callType === 'app' ? 'Username' : 'Phone Number'
                                }</span>
                                <input className='w-4/5 input' placeholder={`Enter ${callType === 'app' ? 'Username' : 'Phone Number (E.164 format)'} to call`}
                                    type="text" value={callee} onChange={(e) => setCallee(e.target.value)} />
                            </label>
                        </div>
                </div>
                <div className='card-actions'>
                    <VoiceCall outgoingCallContext={{ callee, callType }} />
                </div>
            </div>
        </div>
    );
};