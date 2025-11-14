# Vonage VOIP Application Sample

An iOS application powered by the Vonage Voice API to make and receive VOIP Calls.

## Architecture Overview

This app follows a modern SwiftUI architecture with clean separation of concerns:

### Core Components
- **`VonageVoiceApp`** - Main SwiftUI app entry point with NavigationStack-based routing
- **`CoreContext`** - Singleton managing shared services and app-wide state
- **`VoiceClientManager`** - Handles Vonage SDK integration, call lifecycle, and CallKit (device) / WebSocket (simulator)
  - `+VGVoiceClientDelegate` - Extension implementing voice client delegate methods
  - `+CXProviderDelegate` - Extension implementing CallKit provider delegate (device only)
- **`PushService`** - Manages VoIP and user push notifications via PushKit
- **`NetworkService`** - Generic Combine-based HTTP client for authentication APIs

### Views & ViewModels
- **`LoginView/LoginViewModel`** - Supports token-based and code-based authentication
- **`MainView`** - Home screen with username calling and floating dialer button
- **`DialerView`** - Phone number dialing and in-call DTMF input
- **`CallView`** - In-call UI with adaptive controls (incoming vs active states)

### Models
- **`VGCallWrapper`** - Observable wrapper around Vonage calls with state management
- **`CallState`** - Enum representing call lifecycle (ringing, active, holding, disconnected, reconnecting)

### Services & Utilities
- **`Configuration`** - Reads API URLs and tokens from xcconfig
- **`AppTheme`** - Centralized design system (colors, typography, spacing, button styles)
- **Extensions** - Data hex conversion, UUID utilities, Publisher helpers, Vonage SDK error conformance

## Getting Started
Note: A minimum version of Xcode 14.x is required to build and run. 

To install, first make sure you have [CocoaPods](https://cocoapods.org) installed on your system. Then, follow these steps:

1. Clone the repository.
2. Install Xcode.
3. Open the project in Xcode.
4. Sync your project with pod
```bash
pod install --repo-update
```
5. Create a `secrets.xcconfig` file in root folder. You can refer [here](https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project) for more information on how to set configuration files.
6. Build and run the app on an iOS device or simulator.

**Note:** The minimum iOS version required to build the app is `16`, 

Choose the option that works best for your setup and requirements.

### Set up a custom back end (optional)

If you want to use a custom back end with this app, you can follow the instructions provided in one of the [use case scenarios](../../README.md#usecases) that supports simplified device login.

Once you have set up the custom back end, make sure to retrieve the login and refresh URLs, as you will need them for the next step.

### Set up secrets.xcconfig

Before running the app for the first time, you need to add some properties to the `secrets.xcconfig` file.

To manually add these properties, follow these steps:

1. Open the `secrets.xcconfig` file.
2. Add the following lines at the bottom of the file:
```
VONAGE_API_TOKEN = <YOUR_API_TOKEN>
API_LOGIN_URL = <YOUR_API_LOGIN_URL>
API_REFRESH_URL = <YOUR_API_REFRESH_URL>
```

Alternatively, you can run the following command in the project root folder to automatically add the lines:
```bash
echo "VONAGE_API_TOKEN = <YOUR_API_TOKEN>\nAPI_LOGIN_URL = <YOUR_API_LOGIN_URL>\nAPI_REFRESH_URL = <YOUR_API_REFRESH_URL>" >> secrets.xcconfig
```

**Note:** Make sure not to enclose the property values in double quotes (`"`), angular brackets (`<>`) or any other symbols.

**Important:** Due to the restrictions of the `xcconfig` format, the URLs should be formatted as:
```
API_LOGIN_URL = https:/$()/example.com
```
Make sure to follow this format when adding your URLs.

If you choose to store your default application token in the file, you can provide it there. Alternatively, you can leave it empty and provide it at runtime. Similarly, if you haven't set up your back end yet, you can leave the URL property values empty.

**Important:** Remember that the `secrets.xcconfig` file must contain **ALL** the listed properties, even if they have empty values. Failure to include them may result in the app not functioning correctly.

## Usage

This app will give you 2 options to login. 

### Log in with Vonage Token
 Before using the app for the first time, you will need to obtain a valid Vonage API token. To add this token to the app, simply add a property 

To log in using the Vonage API token, follow these steps:

1. Select the `Vonage Token` option on the login screen(Login Type).
2. Insert your Vonage API token in the text field.

### Log in with Login code

To log in using a login code, please follow these steps:

1. Visit the application's website.
2. Login using either your email, Google account, or GitHub account.
3. Once logged in, click on the account picture in the bottom left.
4. Click on "Devices."
5. Create a new device with an ID of your choice.
6. Generate a code for that device.
7. Pick the `Login via Code` option on the app login screen.
8. Paste the code into the text field and log in.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
