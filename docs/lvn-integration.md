# Guide: How to Obtain a Vonage LVN (Long Virtual Number)

This guide provides step-by-step instructions on how to obtain a Vonage LVN (Long Virtual Number) and link it to your application. A Vonage LVN allows you to receive calls, SMS, and MMS messages through webhooks in your application.

## Table of Contents
1. [Buy a Vonage LVN](#1-buy-a-vonage-lvn)
2. [Link the Number to Your Application](#2-link-the-number-to-your-application)
3. [Conclusion](#conclusion)

## 1. Buy a Vonage LVN

To obtain a Vonage LVN, follow these steps:

1. Go to the [Vonage Dashboard](https://dashboard.nexmo.com/) and navigate to **Numbers** in the side navigation menu.
2. Click on **Buy Numbers**.
3. Use the available filters to search for a specific type of number:
   - Select the desired **Region** (e.g., United Kingdom).
   - Choose the desired **Feature** (e.g., SMS, MMS, and Voice).
   - Select the desired **Type** (e.g., Mobile, Land-line, Toll-free).
   - Optionally, you can specify any constraints on the number using the **Number** field.
4. Click on the **Buy** button next to the number that meets your requirements.
5. Follow any additional prompts or instructions to complete the purchase.

**Note:** Some features (e.g., MMS) may only be supported in specific regions (e.g., United States).

## 2. Link the Number to Your Application

To link a purchased number to your application, follow these steps:

1. In the Vonage Dashboard, navigate to **Applications** in the side navigation menu.
2. Select your desired application from the list.
3. Click on **Link Numbers**.
4. Press the **Link** button next to the desired number you want to link to your application.

From now on, calls, SMS, and MMS messages directed to that number will be forwarded to your application through the appropriate webhooks.

## Conclusion

Congratulations! You have successfully obtained a Vonage LVN and linked it to your application. You can now receive calls, SMS, and MMS messages through the associated webhooks in your application.

Please note that the specific implementation of handling the received messages in your application will depend on your application's programming language and framework.

