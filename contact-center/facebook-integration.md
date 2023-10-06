# Guide: How to Set Up Facebook Page, Business Account, Business App, and Webhook

This guide provides detailed instructions on how to create a Facebook Page, set up a Facebook Business account, create a Business app on the Facebook for Developers portal, link the Facebook Page to the app, and configure a webhook to receive postback messages. Additionally, it explains where to retrieve important properties such as the Facebook Page ID, Facebook Page Access Token, Facebook App ID, and Facebook App secret.

## Table of Contents

1. [Create a Facebook Page](#1-create-a-facebook-page)
2. [Create a Facebook Business Account](#2-create-a-facebook-business-account)
3. [Create a Business App on the Facebook for Developers Portal](#3-create-a-business-app-on-the-facebook-for-developers-portal)
4. [Link the Facebook Page to the App](#4-link-the-facebook-page-to-the-app)
5. [Set Up a Webhook to Receive Postback Messages](#5-set-up-a-webhook-to-receive-postback-messages)
6. [Retrieve Facebook Page ID, Page Access Token, App ID, and App Secret](#6-retrieving-facebook-page-id-page-access-token-app-id-and-app-secret)
7. [Connect the Facebook Page to the Vonage Dashboard](#7-connect-the-facebook-page-to-the-vonage-dashboard)
8. [Link the Facebook Page to a Vonage Application](#8-link-the-facebook-page-to-a-vonage-application)
9. [Conclusion](#conclusion)

## 1. Create a Facebook Page

To create a Facebook Page, follow these steps:

1. Log in to your personal Facebook account.
2. Click on the down arrow in the top-right corner of Facebook and select "Create Page" from the drop-down menu.
3. Choose a suitable Page category (e.g., Business, Community, Brand, etc.) and select the appropriate subcategory.
4. Enter a unique name for your Page and provide the required information.
5. Customize your Page by adding a profile picture, cover photo, and any other relevant details.
6. Review and edit the Page settings as per your preferences.
7. Once you are satisfied, click on the "Create Page" button to finalize the creation process.

## 2. Create a Facebook Business Account

To set up a Facebook Business account, follow these steps:

1. Open a web browser and visit the Facebook for Business website (https://business.facebook.com/).
2. Click on the "Create Account" button.
3. Enter your name, email address, and a secure password.
4. Provide additional information, such as your business name and website, as prompted.
5. Agree to the terms and conditions and click on the "Submit" button.
6. Verify your email address by following the instructions sent to your registered email.
7. Once your email is verified, you can start utilizing the features and tools available in your Facebook Business account.

## 3. Create a Business App on the Facebook for Developers Portal

To create a Business app on the Facebook for Developers portal, follow these steps:

1. Visit the Facebook for Developers website (https://developers.facebook.com/).
2. Click on the "Get Started" button and sign in using your Facebook Business account credentials.
3. If prompted, complete the initial setup process for your developer account.
4. From the top navigation menu, select "My Apps" and click on the "Create App" button.
5. Provide a suitable name for your app and choose the desired app purpose (e.g., Business).
6. Click on the "Create App" button to proceed.
7. Complete the security check if prompted.
8. On the dashboard of your newly created app, navigate to the left sidebar and click on "Settings".
9. Under the "Basic" section, you can find your Facebook App ID and Facebook App secret, which are essential for further configuration.

## 4. Link the Facebook Page to the App

To link your Facebook Page to the created Business app, follow these steps:

1. Access the dashboard of your Business app on the Facebook for Developers portal.
2. In the left sidebar, click on "Settings".
3. Under the "Basic" section, scroll down to the "Add Platform" button and click on it.
4. Select "Facebook Page" from the available options.
5. Enter the Facebook Page ID of the desired Page (You can retrieve it using the instructions provided in the next section).
6. Click on the "Save Changes" button to complete the linking process.

## 5. Set Up a Webhook to Receive Postback Messages

To configure a webhook and receive postback messages from your Facebook Page, follow these steps:

1. Open the dashboard of your Business app on the Facebook for Developers portal.
2. In the left sidebar, click on "Webhooks".
3. Click on the "Create Subscription" button.
4. Provide a suitable callback URL where Facebook will send the webhook events.
5. Set the desired subscription fields and permissions based on your requirements.
6. Click on the "Verify and Save" button.
7. Verify the callback URL by following the verification process specified by Facebook.
8. Once the verification is successful, the webhook will be set up, and you can start receiving postback messages.

## 6. Retrieving Facebook Page ID, Page Access Token, App ID, and App Secret

To retrieve important properties such as the Facebook Page ID, Facebook Page Access Token, Facebook App ID, and Facebook App secret, follow these instructions:

1. Facebook Page ID:
    - Log in to the Facebook for Developers portal (https://developers.facebook.com/) using your Facebook account.
    - In the left sidebar, click on "Messenger".
    - Select "Settings".
    - Under the "Access Tokens" section, you will find a list of access tokens for your linked Facebook Pages.
    - Locate the access token corresponding to the desired Facebook Page.
    - Next to the access token, you will find the name of the linked Facebook Page, followed by the Facebook Page ID in parentheses. For example: "My Page Name (123456789)".

2. Facebook Page Access Token:
   - Open the dashboard of your Business app on the Facebook for Developers portal.
   - In the left sidebar, click on "Settings".
   - Under the "Basic" section, scroll down to the "Token Generation" section.
   - Select your linked Facebook Page from the "Page" dropdown.
   - The generated access token will appear in the "Token" field.

3. Facebook App ID and App Secret:
   - Open the dashboard of your Business app on the Facebook for Developers portal.
   - In the left sidebar, click on "Settings".
   - Under the "Basic" section, you will find the Facebook App ID and App Secret.

**Note:** Keep your Facebook App Secret confidential and avoid sharing it publicly.

## 7. Connect the Facebook Page to the Vonage Dashboard

To connect your Facebook Page to the Vonage Dashboard, follow these steps:

1. Go to the [Vonage Dashboard](https://dashboard.nexmo.com/).
2. In the dashboard, navigate to **External Accounts > Facebook Messenger**.
3. Click on the "Connect Facebook Pages" button.
4. Login with your Facebook account.
5. Select the Facebook Page you want to connect.
6. Select an API key from the dropdown menu.
7. Click on the "Complete Setup" button to finalize the connection.

## 8. Link the Facebook Page to a Vonage Application

To link your Facebook Page to a Vonage application, follow these steps:

1. Log in to the [Vonage Dashboard](https://dashboard.nexmo.com/).
2. In the dashboard, navigate to "Applications" and select the desired application you want to link the Facebook Page to.
3. Click on the "Link Social Channels" button in the application settings.
4. Select the Facebook channel from the list of available channels.
5. Follow the prompts to authenticate your Facebook account and grant permissions.
6. Choose the Facebook Page you want to link from the dropdown menu.
7. Click on the "Save" button to link the Facebook Page to the Vonage application.

## Conclusion

You have successfully learned how to create a Facebook Page, set up a Facebook Business account, create a Business app on the Facebook for Developers portal, link the Facebook Page to the app, configure a webhook to receive postback messages, connect the Facebook Page to the Vonage Dashboard, and retrieve essential properties.

These steps will enable you to leverage the Facebook platform for your business and application needs.