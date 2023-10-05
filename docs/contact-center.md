# Contact Center Usecase Senario

This is a Contact Center like app with support for Voice and Chat.

## Features

TODO: Add list of features

## Running Locally

### Requirements

Almost all dependencies are installed via `npm install` however you will need to ensure you have the following installed:

- NodeJS (v18+) - [Download NodeJS](https://nodejs.org/en/download/) or if you use [nvm](https://github.com/nvm-sh/nvm) run `nvm use` from the root to switch to the correct version
- Docker - [Download Docker Desktop](https://www.docker.com/products/docker-desktop) or [OrbStack is good if on MacOS](https://orbstack.dev/)

Although installed via `npm install` you may need to install the following manually:

- [Ngrok Tunnel](https://ngrok.com/download) - This is used to expose your local server to the internet (or localtunnel)
- [localtunnel](https://www.npmjs.com/package/localtunnel) - This is used to expose your local server to the internet (or ngrok)
- [Supabase CLI](https://supabase.io/docs/guides/cli) - This is used to start your local Supabase instance

Nice to have:

- [Vonage CLI](https://github.com/vonage/vonage-cli) - This is used to create the Vonage API application although you can do this manually via the dashboard

You will also need a few accounts:

- [Vonage API Account](https://dashboard.nexmo.com/sign-up) - You will need to create a Vonage API account to get your API Key and Secret
- [Google Cloud Account](https://cloud.google.com/) - if you wish to configure OAuth for Google (optional, instructions coming soon)
- [Github Account](https://github.com/) - if you wish to configure OAuth for Github (optional, instructions coming soon)

### Setup Instructions

1. Clone this monorepo
2. Run `npm install` from the root of the monorepo (if using nvm run `nvm use` first)
3. Run `npm run db:start` to start your Supabase instance (this will take a while the first time and once it's done it should print a list of urls and keys to the console you will need these later)
4. Make a new vonage application either via the dashboard or via the CLI (see [Vonage CLI](https://github.com/vonage/vonage-cli)) and make a note of the application ID and private key. You will need these later.

    ```bash
    # Create a new Vonage Application
    npx @vonage/cli apps:create "Contact Center" --voice_answer_url=https://example.com/answer --voice_event_url=https://example.com/event
    # this will output some info about the application including the ID and private key
    # this command will also create 'vonage-app.json' which contains the application ID and private key and 'private.key' which contains the private key
    ```

5. Create a new copy of the `.env.example` file and name it `.env` and fill in the values from the previous steps
    - `NEXT_PUBLIC_SUPABASE_URL` - The Supabase URL from step 3
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - The Supabase Anon Key from step 3, you can grab it by running supabase status in `root/apps/supabase-backend` directory
    - `VONAGE_API_KEY` - The Vonage API Key used to create the Vonage Application from step 4
    - `VONAGE_API_SECRET` - The Vonage API Secret used to create the Vonage Application from step 4
    - `VONAGE_APPLICATION_ID` - The Vonage Application ID from step 4
    - `VONAGE_PRIVATE_KEY` - The Vonage Application Private Key from step 4 (I recommend the private key string from the `vonage-app.json` file)
    - `DEVICE_REFRESH_TOKEN_SECRET` - A random string used to encrypt the refresh token for the device (this is used to keep the device logged in)
    - `DEVICE_CODE_SALT` - A random string used to encrypt the device code (this is used to keep the device logged in)
6. Run `npm run dev:contact-center` to start the development server
7. Configure Database webhook for new users
    1. Go to your local Supabase studio (should be at `http://localhost:54323`)
    2. Open the default project
    3. Go to the Database tab then Webhooks (should be at `http://localhost:54323/project/default/database/hooks`)
    4. Click 'Create New hook' and make a webhook with the following settings:
        - Name: `new_user`
        - Table: `auth.users`
        - Event: `INSERT` and `DELETE`
        - Method: `POST`
        - URL: `http://host.docker.internal:54321/functions/v1/new-user` (this is the url of your edge function)
        - Headers: `Content-Type: application/json`

#### Optional

##### Configure OAuth

TODO: Add instructions for configuring OAuth

##### Use local tunnel instead of ngrok

Add the following to your `.env` file:

```bash
LOCALTUNNEL=true
```

### Using localy

1. Once you have followed the setup instructions you should be able to go to `http://localhost:3000` and see the app
2. You can login with magic link (or with Google or Github if you have configured OAuth)
    - Local Magic Link instructions:
        1. Use any email address with the domain `@vonage.com` (e.g. `test@vonage.com` it doesn't need to be a real email address)
        2. Go to `http://localhost:54324/m/{mailbox}` where `{mailbox}` is the mailbox you want to login to (e.g. `http://localhost:54324/m/test` for the email address `test@vonage.com`)
        3. You should see an email with a link to login to the app
        4. Click the link and you should be redirected to the app and logged in
3. You can now make and receive calls
