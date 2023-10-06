# Vonage Client-SDK Real World Reference projects

This is a Monorepo containing a collection of real world reference projects for the Vonage Client SDK's for Voice and Chat that show a number of usecases.

## Monorepo Structure

```text
. (Root)
├── contact-center/ (Contact Center Reference project)
├── multichannel-app/ (multichannel-app Reference project)
├── packages/ (Common node packages across projects)
├── scripts/ (Scripts for running the projects)
└── docs/
```

## Projects

- [Contact Center](./contact-center/README.md) - A Contact Center like app with support for Voice and Chat (iOS, Android, Web)
- [Multichannel App](./multichannel-app/README.md) - A Multichannel app with support for Voice and Chat (Web)

## Packages

- @vonage/client-sdk-react - [./packages/client-sdk-react](./packages/client-sdk-react/README.md)

    A React wrapper for the Vonage Client SDK's for Voice and Chat.
  - [React](https://reactjs.org/)
  - [Vonage Client SDK](https://developer.vonage.com/en/client-sdk/overview)

## Running locally

Each project has it's own readme with instructions on how to run it locally. Each Project has a number of frontend and backend apps that make up the project. Some of these apps are required to run the project and some are optional.

## Channel Integration Guides

- [Get a Vonage LVN](./docs/lvn-integration.md) (for PSTN Voice Calls, SMS and MMS)

- [Facebook Messenger Integration](./docs/facebook-integration.md)

- [Whatsapp Integration](./docs/whatsapp-integration.md)
