# Vonage Client-SDK Real World Reference projects

This is a Monorepo containing a collection of real world reference projects for the Vonage Client SDK's for Voice and Chat that show a numer of usecases.

## Monorepo Structure

```text
. (Root)
├── apps/ (Reference projects)
├── packages/ (Common node packages across projects)
├── scripts/ (Scripts for running the projects)
└── docs/
```

## Usecases

- [Contact Center](./docs/contact-center.md) - A Contact Center like app with support for Voice and Chat

## Projects

- Common Backend - [./apps/supabase-backend](./apps/supabase-backend/README.md.md)

    A Common backend with built using:
  - [Supabase](https://supabase.io/)

- Contact Center App - [./apps/main-app](./apps/main-app/README.md.md)

    A Contact Center like app with support for Voice and Chat built using:
  - [Next.js 13 (app router)](https://nextjs.org/docs)
  - [Common Backend](./supabase)
  - [Vonage Client SDK React](./packages/client-sdk-react)
  - [Tailwind CSS](https://tailwindcss.com/).

## Packages

- @vonage/client-sdk-react - [./packages/client-sdk-react](./packages/client-sdk-react/README.md.md)

    A React wrapper for the Vonage Client SDK's for Voice and Chat.
  - [React](https://reactjs.org/)
  - [Vonage Client SDK](https://developer.vonage.com/en/client-sdk/overview)

## Running locally

Each project has it's own readme with instructions on how to run it locally in isolation however a number of projects are designed to fit together to form a complete usecase senario. As such each usecase senario has a set of instructions on how to run the projects together. See the [Usecases](#usecases) section for a list of usecases and links to the relevant readmes and instructions.
