# VoiceSampleApp

VoiceSampleApp is an Android application that showcases how to integrate the Vonage Client SDK for Voice into your Android app. With this app, you can make voice calls using the Vonage Voice API.

## Getting Started

1. Clone the repository
2. Install Android Studio
3. Open the project in Android Studio
4. Sync your project with Gradle
5. Build and run the app on an Android device or emulator.

**Note:** The minimum Android SDK version required to build the app is `26`,
and the minimum version for both the `com.android.application` and `com.android.library`
plugins is `7.3.0`. If you encounter any issues installing the `7.3.0` version of the plugins, you have a couple of options:

1. Downgrade to a previous version of the plugins, but please note that this is at your own risk and may not be compatible with all features of the app.
2. Update Android Studio or IntelliJ Idea to the latest version. This ensures compatibility with the required plugin versions and provides the best development experience.

Choose the option that works best for your setup and requirements.

### Set up Push Notifications (optional)

To enable push notifications in the app, follow these steps:

1. Go to the Firebase Console and select your project.
2. Navigate to "Project Settings" and then to the "SDK setup and configuration" section.
3. Download the `google-services.json` file from there.
4. Copy the downloaded file and paste it into the 'app' directory of your project.
    - Keep the `google-services.json` file secure and not shared publicly.

If you want to proceed without push notification support:

1. Open the `build.gradle` file in the app directory.
2. Locate the `plugins` block.
3. Comment out the line `id 'com.google.gms.google-services'`.
    - **Note:** If you decide not to use push notifications and do not comment out the line, the app will not build.

### Set up a custom back end (optional)

If you want to use a custom back end with this app, you can follow the instructions provided in one of the [use case scenarios](../../README.md#usecases) that supports simplified device login.

Once you have set up the custom back end, make sure to retrieve the login and refresh URLs, as you will need them for the next step.

### Set up local.properties

Before running the app for the first time, you need to add some properties to the `local.properties` file.

To manually add these properties, follow these steps:

1. Open the `local.properties` file.
2. Add the following lines at the bottom of the file:
```
VONAGE_API_TOKEN=<YOUR_API_TOKEN>
API_LOGIN_URL=<YOUR_API_LOGIN_URL>
API_REFRESH_URL=<YOUR_API_REFRESH_URL>
API_KEY=<YOUR_API_KEY>
```

Alternatively, you can run the following command in the project root folder to automatically add the lines:
```bash
echo "VONAGE_API_TOKEN=<YOUR_API_TOKEN>\nAPI_LOGIN_URL=<YOUR_API_LOGIN_URL>\nAPI_REFRESH_URL=<YOUR_API_REFRESH_URL>\nAPI_KEY=<YOUR_API_KEY>" >> local.properties
```

**Note:** Make sure not to enclose the property values in double quotes (`"`), angular brackets (`<>`) or any other symbols.

If you choose to store your default application token in the file, you can provide it there. Alternatively, you can leave it empty and provide it at runtime. Similarly, if you haven't set up your back end yet, you can leave the URL property values empty.

**Important:** Remember that the `local.properties` file must contain **ALL** the listed properties, even if they have empty values. Failure to include them will result in the app failing to build.

## Usage

To make a voice call using this app, log in, type the name of the user you want to call, or enter a phone number using the dialer. Press the call button, and the app will connect to the Vonage Voice API to initiate the call.

**Important:** To receive incoming calls while the device is locked, make sure that `Incoming Calls` Notifications are enabled under App Info > Manage Notifications > Categories.

### Log in with Vonage Token
To log in using the Vonage API token, follow these steps:

1. Tick the `Login with Vonage Token` option on the login screen.
2. Insert your Vonage API token in the text field.

### Log in with Login code
Alternatively, you can log in using a login code obtained from the custom back end set up as described above. 
Follow these steps to log in using a login code:

1. Visit the application's website.
2. Login using either your email, Google account, or GitHub account.
3. Once logged in, click on `Devices`.
4. Create a new device with a name of your choice.
5. Generate a code for that device.
6. Un-tick the `Login with Vonage Token` option on the app login screen.
7. Paste the code into the text field and log in.

## App Structure

This app is built with **Jetpack Compose** for UI and follows modern Android development patterns with **Kotlin StateFlow** for reactive state management.

### Key Components

- **`VoiceClientManager`** - Manages Vonage SDK initialization, authentication, and call operations
- **`CoreContext`** - Singleton holding global app state including the active call
- **`LoginActivity`** - Jetpack Compose UI for user authentication
- **`MainActivity`** - Main screen with user calling interface using Compose
- **`CallActivity`** - Active call screen with controls (mute, hold, DTMF, etc.)
- **`CallConnection`** - Integrates with Android Telecom framework for native call experience
- **`PushNotificationService`** - Handles incoming call push notifications via FCM

The UI is entirely built with Compose, using `StateFlow` for state management and `repeatOnLifecycle` for lifecycle-aware flow collection. This ensures proper handling of configuration changes and background/foreground transitions.

## Migrate to Combined Client

To migrate to the Vonage Combined Client from the Voice client, follow these steps:

1. Open the `build.gradle` file located in the `app` folder and replace the following line:
   ```gradle
   implementation("com.vonage:client-sdk-voice:$VERSION")
   ```
   
   with:
   
   ```gradle
   implementation("com.vonage:client-sdk:$VERSION")
   ```
2. Sync your project with Gradle to apply the changes.
3. In the `VoiceClientManager.kt` file, update the client initialization as follows:
   ```
   private val client : VonageClient

   init {
      client = VonageClient(context)
   }
   ```
4. Rebuild your app.

By following these steps, you'll have successfully migrated your project to use the Vonage Combined Client. Now, your project is ready to work seamlessly with both the chat and voice functionality.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

