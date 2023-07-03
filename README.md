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

- Common Backend - [./apps/supabase-backend](./apps/supabase-backend/README.md)

    A Common backend with built using:
  - [Supabase](https://supabase.io/)

- Contact Center App - [./apps/main-app](./apps/main-app/README.md)

    A Contact Center like app with support for Voice and Chat built using:
  - [Next.js 13 (app router)](https://nextjs.org/docs)
  - [Common Backend](./supabase)
  - [Vonage Client SDK React](./packages/client-sdk-react)
  - [Tailwind CSS](https://tailwindcss.com/).

- Android Voice Sample App - [./apps/android-voice](./apps/android-voice/README.md)
  
  An Android application powered by the Vonage Voice API to make and receive VOIP Calls using:
  - [Android Telecom Framework](https://developer.android.com/guide/topics/connectivity/telecom)
  - [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
  - [Retrofit](https://square.github.io/retrofit/)
  - [Moshi](https://github.com/square/moshi)

- Android Chat Sample App - [./apps/android-chat](./apps/android-chat/README.md)

  An Android application that showcases how to integrate the Vonage Chat Client SDK for real-time chat functionality using:
  - [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
  - [Dagger HILT](https://developer.android.com/training/dependency-injection/hilt-android)
  - [Retrofit](https://square.github.io/retrofit/)
  - [Moshi](https://github.com/square/moshi)
  - [Jetpack Compose](https://developer.android.com/jetpack/compose)
  - [Coil](https://coil-kt.github.io/coil/)
  - [Android Paging Library v3](https://developer.android.com/topic/libraries/architecture/paging/v3-overview)

- iOS Voice Sample App - [./apps/ios-voice](./apps/ios-voice/README.md)

  An iOS application powered by the Vonage Voice API to make and receive VOIP Calls using:
  - [UIKit](https://developer.apple.com/documentation/uikit)
  - [Combine](https://developer.apple.com/documentation/combine)
  - [CallKit](https://developer.apple.com/documentation/callkit)
  - [Apple Push Notification service(APNs)](https://developer.apple.com/documentation/usernotifications/registering_your_app_with_apns)

- iOS Chat Sample App - [./apps/ios-chat](./apps/ios-chat/README.md)

  An iOS application that showcases how to integrate the Vonage Chat Client SDK for real-time chat functionality, using:
  - [SwiftUI](https://developer.apple.com/xcode/swiftui/)
  - [Combine](https://developer.apple.com/documentation/combine)

## Packages

- @vonage/client-sdk-react - [./packages/client-sdk-react](./packages/client-sdk-react/README.md.md)

    A React wrapper for the Vonage Client SDK's for Voice and Chat.
  - [React](https://reactjs.org/)
  - [Vonage Client SDK](https://developer.vonage.com/en/client-sdk/overview)

## Running locally

Each project has it's own readme with instructions on how to run it locally in isolation however a number of projects are designed to fit together to form a complete usecase senario. As such each usecase senario has a set of instructions on how to run the projects together. See the [Usecases](#usecases) section for a list of usecases and links to the relevant readmes and instructions.
