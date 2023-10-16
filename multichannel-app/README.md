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
LOCALTUNNEL=true
VONAGE_LVN=447520635617
ENABLE_FACEBOOK=false
VONAGE_ENDPOINT=https://api-us-3.vonage.com/v1
WEBHOOK_PATH=api/
TUNNEL_PORT=3000

KV_REST_API_READ_ONLY_TOKEN="AnoCASQgZGMxNGQwN2EtNWFjZS00ZDMwLWIxNTYtNmM2N2VhMjhmZWZjyGaGY9p6iFYqlhfeJtEfa91OI88tHO6QJGg9avRxNs0="
KV_REST_API_TOKEN="AXoCASQgZGMxNGQwN2EtNWFjZS00ZDMwLWIxNTYtNmM2N2VhMjhmZWZjNDU2ZDA1ODhiZWFhNDYzOGE2Y2I4NDg5ODcxNmUzOTY="
KV_REST_API_URL="https://glowing-gar-31234.kv.vercel-storage.com"
KV_URL="redis://default:456d0588beaa4638a6cb84898716e396@glowing-gar-31234.kv.vercel-storage.com:31234"

#ws bot
WS_BOT_PORT=3001
OPENAI_API_KEY=
OPENAI_ORG_ID=
GOOGLE_PRIVATE_KEY=
GOOGLE_CLIENT_EMAIL=
GOOGLE_CLIENT_ID=

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

### how to deploy

#### ws bot on fly.io

first install flyctr and loging 

then set the secrets:

``` 
cat .env | grep 'GOOGLE\|OPENAI' > .env.deploy.flyio
fly secrets import < .env.deploy.flyio

```

then deploy with: 

```
fly deploy
```

#### frontedn on next





<!-- TODO: Add instructions -->
