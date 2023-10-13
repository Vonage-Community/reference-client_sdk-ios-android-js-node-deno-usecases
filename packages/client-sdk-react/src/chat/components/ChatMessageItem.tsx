'use client';

/* eslint-disable @next/next/no-img-element */
import { ComponentType, useEffect } from 'react';
import { ChatMessage } from '../ChatContainer';
import RelativeTime from '@yaireo/relative-time';
import { MessageTextEvent, MessageCustomEvent, MessageImageEvent } from '@vonage/client-sdk';
import { match } from 'ts-pattern';
import { useVonageUser } from '../../VonageClientProvider';
import { useChatMember, useChatMembers } from '../hooks';
import { IconDeviceMobile } from '@tabler/icons-react';
const relativeTime = new RelativeTime();

export type ChatImagePlaceholderProps = {
    name: string;
    className?: string;
    placeholderLabelClassName?: string;
};
const ChatImagePlaceholder = (
    {
        name,
        className = 'vg-w-10 vg-rounded-full vg-text-center vg-flex vg-items-center vg-justify-center',
        placeholderLabelClassName = 'vg-text-3xl',
    }: ChatImagePlaceholderProps) => (
    <div className={className}>
        <span className={placeholderLabelClassName}>
            {name.charAt(0)}
        </span>
    </div>
);

export type ChatImageProps = {
    avatarUrl?: string;
    name: string;

    className?: string;
    imageClassName?: string;

    Placeholder?: ComponentType<ChatImagePlaceholderProps>;
    placeholderClassName?: string;
    placeholderLabelClassName?: string;
};
const ChatImage = (
    {
        avatarUrl,
        name,
        className = 'vg-chat-image vg-avatar',
        imageClassName = 'vg-w-10 vg-mask vg-mask-squircle',
        Placeholder = ChatImagePlaceholder,
        placeholderClassName,
        placeholderLabelClassName,
    }: ChatImageProps) => {
    return (
        <div className={className}>
                {!avatarUrl ?
                    <IconDeviceMobile className={placeholderClassName} /> :
                <div className={imageClassName} >
                        <img src={avatarUrl} alt={name} width={40} height={40} />
                </div>
            }
        </div >
    );
};

export type ChatHeaderProps = {
    name: string;
    className?: string;
};

const ChatHeader = (
    {
        name,
        className = 'vg-chat-header',
    }: ChatHeaderProps) => {
    return (
        <div className={className}>
            {name}
        </div>
    );
};

export type ChatFooterProps = {
    time?: string;
    className?: string;
    timeClassName?: string;
};

const ChatFooter = (
    {
        time,
        className = 'vg-chat-footer',
        timeClassName = 'vg-text-xs vg-opacity-50',
    }: ChatFooterProps) => {

    const date = time ? new Date(time) : new Date();
    const rt = relativeTime.from(date);
    return (
        <div className={className}>
            <time className={timeClassName} >{rt}</time>
        </div>
    );
};

export type TextBubbleProps = {
    body: MessageTextEvent['body'];
    className?: string;
}
type TextBubbleComponent = ComponentType<TextBubbleProps>;
const TextBubble = ({ body: { text } }: TextBubbleProps) => <>{text}</>;

type ImageBubbleProps = {
    body: MessageImageEvent['body'];
    className?: string;
}
type ImageBubbleComponent = ComponentType<ImageBubbleProps>;
const ImageBubble = ({ body: { imageUrl, } }: ImageBubbleProps) => <img src={imageUrl} alt='chat image' />;

export type CustomBubbleProps = {
    body: MessageCustomEvent['body'];
    className?: string;
};
type CustomBubbleComponent = ComponentType<CustomBubbleProps>;
const CustomBubble = ({ body: { customData } }: CustomBubbleProps) => <pre>{JSON.stringify(customData, null, 2)}</pre>;

/**
 * Props for the ChatBubble component.
 * @typedef {Object} ChatBubbleProps
 * @property {ChatMessage} message - The chat message to be displayed.
 * @property {string} [className] - The CSS class name to be applied to the chat bubble container.
 * @property {Object} [Components] - The components to be used for rendering the text and custom message bubbles.
 * @property {TextBubbleComponent} [Components.text] - The component to be used for rendering text message bubbles.
 * @property {CustomBubbleComponent} [Components.custom] - The component to be used for rendering custom message bubbles.
 * @property {Object} [componentsClassNames] - The CSS class names to be applied to the text and custom message bubbles.
 * @property {string} [componentsClassNames.text] - The CSS class name to be applied to the text message bubble.
 * @property {string} [componentsClassNames.custom] - The CSS class name to be applied to the custom message bubble.
 */
export type ChatBubbleProps = {
    message: ChatMessage;
    className?: string;

    Components?: {
        text: TextBubbleComponent;
        custom: CustomBubbleComponent;
        image: ImageBubbleComponent;
    };
    componentsClassNames?: {
        text?: string;
        custom?: string;
        image?: string;
    };
};

const ChatBubble = (
    {
        message,
        className = 'vg-chat-bubble',
        Components = {
            text: TextBubble,
            custom: CustomBubble,
            image: ImageBubble,
        },
        componentsClassNames = {
            text: '',
            custom: '',
            image: '',
        },
    }: ChatBubbleProps) => {
    return (
        <div className={className}>
            {match(message)
                .with({ kind: 'message:text' }, ({ body }) => <Components.text body={body} className={componentsClassNames.text} />)
                .with({ kind: 'message:custom' }, ({ body }) => <Components.custom body={body} className={componentsClassNames.custom} />)
                .with({ kind: 'message:image' }, ({ body }) => <Components.image body={body} className={componentsClassNames.image} />)
                .exhaustive()
            }
        </div>
    );
};

/**
 * Props for the ChatMessageItem component, which renders a single chat message.
 * @param message The chat message to render.
 * @param className The CSS class name to apply to the root element.
 * @param localClassName The CSS class name to apply to the root element when the message is from the local user.
 * @param remoteClassName The CSS class name to apply to the root element when the message is from a remote user.
 * @param ImageComponent The component to use for rendering the message sender's avatar image.
 * @param imageClassNames The CSS class names to apply to the image component.
 * @param HeaderComponent The component to use for rendering the message header.
 * @param headerClassNames The CSS class names to apply to the header component.
 * @param FooterComponent The component to use for rendering the message footer.
 * @param footerClassNames The CSS class names to apply to the footer component.
 * @param BubbleComponent The component to use for rendering the message bubble.
 * @param bubbleClassNames The CSS class names to apply to the bubble component.
 */
export type ChatMessageProps = {
    message: ChatMessage;

    className?: string;
    localClassName?: string;
    remoteClassName?: string;

    ImageComponent?: ComponentType<ChatImageProps>;
    imageClassNames?: {
        className?: string;
        imageClassName?: string;
        placeholderClassName?: string;
        placeholderLabelClassName?: string;
    }

    HeaderComponent?: ComponentType<ChatHeaderProps>;
    headerClassNames?: {
        className?: string;
    }

    FooterComponent?: ComponentType<ChatFooterProps>;
    footerClassNames?: {
        className?: string;
        timeClassName?: string;
    }

    BubbleComponent?: ComponentType<ChatBubbleProps>;
    bubbleClassNames?: {
        className?: string;
        textClassName?: string;
        customClassName?: string;
    }
};

/**
 * A component that renders a single chat message.
 * @param message The chat message to render.
 * @param className The CSS class name to apply to the root element.
 * @param localClassName The CSS class name to apply to the root element when the message is from the local user.
 * @param remoteClassName The CSS class name to apply to the root element when the message is from a remote user.
 * @param ImageComponent The component to use for rendering the message sender's avatar image.
 * @param imageClassNames The CSS class names to apply to the image component.
 * @param HeaderComponent The component to use for rendering the message header.
 * @param headerClassNames The CSS class names to apply to the header component.
 * @param FooterComponent The component to use for rendering the message footer.
 * @param footerClassNames The CSS class names to apply to the footer component.
 * @param BubbleComponent The component to use for rendering the message bubble.
 * @param bubbleClassNames The CSS class names to apply to the bubble component.
 */
export const ChatMessageItem = (
    {
        message,
        className = 'vg-chat',
        localClassName = 'vg-chat-end',
        remoteClassName = 'vg-chat-start',

        ImageComponent = ChatImage,
        imageClassNames = {
            className: 'vg-chat-image vg-avatar',
            imageClassName: 'vg-w-10 vg-rounded-full',
            placeholderClassName: 'vg-w-10 vg-rounded-full vg-text-center vg-flex vg-items-center vg-justify-center',
            placeholderLabelClassName: 'vg-text-3xl',
        },

        HeaderComponent = ChatHeader,
        headerClassNames = {
            className: 'vg-chat-header',
        },

        FooterComponent = ChatFooter,
        footerClassNames = {
            className: 'vg-chat-footer',
            timeClassName: 'vg-text-xs vg-opacity-50',
        },

        BubbleComponent = ChatBubble,
        bubbleClassNames = {
            className: 'vg-chat-bubble',
            textClassName: '',
            customClassName: '',
        },
    }: ChatMessageProps) => {
    const user = useVonageUser();
    const { members } = useChatMembers();
    const { memberName, displayName, avatarUrl, isLocal} = match(message.from)
    .with({kind: 'system'}, () => {
        return {
            memberName: 'system',
            displayName: 'system',
            avatarUrl: undefined,
            isLocal: false
        };
    })
        .with({ kind: 'embeddedInfo' }, (from) => {
            const m = members.get(from.memberId!);
        return {
            memberName: m?.name ?? from.memberId!,
            displayName: m?.displayName ?? m?.name ?? from.user.displayName ?? from.user.name,
            avatarUrl: m?.avatarUrl ?? from.user.imageUrl ?? undefined,
            isLocal: m?.userId === user?.id || from.user.id === user?.id
        };
    })
        .exhaustive();

    console.log('ChatMessageItem', { type: message.kind, message, user, members, memberName, displayName, avatarUrl, isLocal });


    return (
        <div className={`${className} ${isLocal ? localClassName : remoteClassName}`}>
            <ImageComponent avatarUrl={avatarUrl} name={displayName} className={imageClassNames.className} imageClassName={imageClassNames.imageClassName} placeholderClassName={imageClassNames.placeholderClassName} placeholderLabelClassName={imageClassNames.placeholderLabelClassName} />
            <HeaderComponent name={displayName || memberName} className={headerClassNames.className} />
            <BubbleComponent message={message} className={bubbleClassNames.className} componentsClassNames={{ text: bubbleClassNames.textClassName, custom: bubbleClassNames.customClassName }} />
            <FooterComponent time={message.timestamp} className={footerClassNames.className} timeClassName={footerClassNames.timeClassName} />
        </div>
    );
};
