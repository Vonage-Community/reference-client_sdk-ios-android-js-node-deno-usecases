const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;


export const setupFacebook = async (endpoint) => {
    const whiteListedDomainsResponse = await fetch(`https://graph.facebook.com/v17.0/me/messenger_profile?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            body: JSON.stringify({
                'whitelisted_domains': [
                    new URL(endpoint).origin
                ]
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    if (!whiteListedDomainsResponse.ok) {
        console.log(await whiteListedDomainsResponse.json());
        throw new Error(`Failed to update Facebook White-Listed URL with status code: ${whiteListedDomainsResponse.status} and message: ${whiteListedDomainsResponse.statusText}`);
    }

    const fields = 'messages, messaging_postbacks, messaging_optins, message_deliveries, messaging_referrals';
    const app_access_token = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
    const appsUrl = new URL(`https://graph.facebook.com/v17.0/${FACEBOOK_PAGE_ID}/subscribed_apps`);
    appsUrl.search = new URLSearchParams({
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
        subscribed_fields: fields,
    });

    const updateSubscribedAppResponse = await fetch(appsUrl.href, {
            method: 'POST',
            body: '',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    if (!updateSubscribedAppResponse.ok) {
        console.log(await updateSubscribedAppResponse.json());
        throw new Error('Failed to update facebook subscribed Apps url');
    }
    const pageUrl = new URL(`https://graph.facebook.com/v17.0/${FACEBOOK_APP_ID}/subscriptions`);
    pageUrl.search = new URLSearchParams({
        access_token: app_access_token,
        object: 'page',
        callback_url: endpoint,
        verify_token: VERIFY_TOKEN,
        fields: fields,
        include_values: 'true'
    });

    const updatePageSubscriptionsResponse = await fetch(pageUrl.href, { 
        method: 'POST',
        body: '',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!updatePageSubscriptionsResponse.ok) {
        console.log(await updatePageSubscriptionsResponse.json());
        throw new Error('Failed to update facebook page subscription url');
    }
    const userUrl = new URL(`https://graph.facebook.com/v17.0/${FACEBOOK_APP_ID}/subscriptions`);
    userUrl.search = new URLSearchParams({
        access_token: app_access_token,
        object: 'user',
        callback_url: endpoint,
        verify_token: VERIFY_TOKEN,
        fields: 'email, name',
        include_values: 'true'
    });

    const updateUserSubscriptionsResponse = await fetch(userUrl.href, { 
        method: 'POST',
        body: '',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!updateUserSubscriptionsResponse.ok) {
        console.log(await updateUserSubscriptionsResponse.json());
        throw new Error('Failed to update facebook user subscription url');
    }
};