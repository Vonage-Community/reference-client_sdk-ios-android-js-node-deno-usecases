# Multichannel App

<!-- TODO: Add description -->

## Features

<!-- TODO: Add list of features -->

## Apps

<!-- TODO: Add list of apps -->

## Running Locally
put your `gapp-creds.json` in the root of the directory
then set those vars: 

```
VONAGE_API_KEY="<your vonage api key>"
VONAGE_API_SECRET="<your vonage account secret>"
VONAGE_APPLICATION_ID="<your vonage application id>"
VONAGE_PRIVATE_KEY="<your vonage api key>"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<random string>
DEVICE_REFRESH_TOKEN_SECRET=<random string>
DEVICE_CODE_SALT=<random string>
LOCALTUNNEL=true
VONAGE_LVN=<your lvn>
ENABLE_FACEBOOK=false
VONAGE_ENDPOINT=https://api-us-3.vonage.com/v1
WEBHOOK_PATH=api/
TUNNEL_PORT=3000
WS_BOT_PORT=3001
GOOGLE_APPLICATION_CREDENTIALS="<your project path>/reference-client_sdk-ios-android-js-node-deno-usecases/gapp-creds.json"
OPENAI_API_KEY="<openai org id>"
OPENAI_ORG_ID="<openai org id>"

```

### To enable ws bot
in a differnt terminal run 

```
npm run tunnel
```

take the url and update the .env file like this:

then run 
```
npm run dev:multichannel-app 
```


<!-- TODO: Add instructions -->
