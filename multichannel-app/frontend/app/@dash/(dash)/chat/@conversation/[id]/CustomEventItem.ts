'use client';

import { CustomEventComponentProps } from '@vonage/client-sdk-react';
import { match } from 'ts-pattern';

export const CustomEventItem = ({ event }: CustomEventComponentProps) => {
    return match(event)
        .with(
            { eventType: 'custom:announcement' },
            (data) => {
                console.log('Custom event received', data);
            }
        )
        .otherwise(() => null);
};