import Stripe from 'stripe';
import { Buffer } from 'node:buffer';
/* global process */

// Determine if we're in production using Netlify's headers
const isProduction = (event) => {
  // Check Netlify's deploy context header first
  const deployContext = event.headers['x-nf-deploy-context'];
  if (deployContext) {
    return deployContext === 'production';
  }

  // Fallback to environment variables
  return process.env.CONTEXT === 'production' ||
    process.env.NETLIFY_ENV === 'production' ||
    process.env.DEPLOY_CONTEXT === 'production';
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Get environment based on the current request
    const isProd = isProduction(event);

    // Select the appropriate keys based on environment
    const stripeSecretKey = isProd
      ? process.env.PROD_STRIPE_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY;

    const endpointSecret = isProd
      ? process.env.STRIPE_WEBHOOK_SECRET_PROD
      : process.env.STRIPE_WEBHOOK_SECRET_DEV;

    // Enhanced environment logging
    console.log('Environment:', {
      headers: {
        deployContext: event.headers['x-nf-deploy-context'],
        siteId: event.headers['x-nf-site-id'],
        accountId: event.headers['x-nf-account-id']
      },
      isProduction: isProd,
      hasSecret: !!endpointSecret,
      usingProdKey: isProd,
      hasTestKey: !!process.env.STRIPE_SECRET_KEY,
      hasProdKey: !!process.env.PROD_STRIPE_SECRET_KEY,
      hasDevWebhook: !!process.env.STRIPE_WEBHOOK_SECRET_DEV,
      hasProdWebhook: !!process.env.STRIPE_WEBHOOK_SECRET_PROD
    });

    // Initialize Stripe with the appropriate key
    const stripe = Stripe(stripeSecretKey);

    // Explicitly log request details for troubleshooting
    console.log('Webhook received. Signature:', sig ? 'Present' : 'Missing');
    console.log('Headers:', JSON.stringify(event.headers));
    console.log('isBase64Encoded:', event.isBase64Encoded);
    console.log('Body type:', typeof event.body);

    if (!endpointSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Get raw body - handle both base64 and regular encoding
    let rawBody = event.body;
    if (event.isBase64Encoded) {
      console.log('Using base64 decoded body');
      rawBody = Buffer.from(event.body, 'base64').toString('utf8');
    }

    // Try verifying with the exact signature and body
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret
    );

    console.log('Webhook verified:', stripeEvent.id);

    // Handle the event
    console.log('Event type:', stripeEvent.type);
    console.log('Event ID:', stripeEvent.id);

    // Simple database simulation - in production, use a real database
    const db = {
      customers: [],
      saveCustomer: function (customer) {
        this.customers.push(customer);
        console.log('Customer saved to database:', customer.email);
        console.log('Total customers:', this.customers.length);
      }
    };

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const checkoutSession = stripeEvent.data.object;
        console.log('Checkout completed!', checkoutSession.id);

        try {
          // Retrieve the subscription details
          const subscription = await stripe.subscriptions.retrieve(
            checkoutSession.subscription
          );

          // Get the customer details
          const customer = await stripe.customers.retrieve(
            checkoutSession.customer
          );

          // Safely convert Unix timestamp to ISO string
          const safeISODate = (unixTimestamp) => {
            if (!unixTimestamp) return new Date().toISOString();
            try {
              return new Date(unixTimestamp * 1000).toISOString();
            } catch (e) {
              console.error('Invalid date conversion:', e.message);
              return new Date().toISOString();
            }
          };

          // Extract service details
          const customerData = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            subscriptionId: subscription.id,
            plan: subscription.items.data[0].price.id,
            status: subscription.status,
            serviceFrequency: checkoutSession.metadata?.frequency || 'weekly',
            dogCount: checkoutSession.metadata?.dogs || '1',
            serviceAddress: customer.shipping?.address || {},
            nextServiceDate: calculateNextServiceDate(checkoutSession.metadata?.frequency),
            currentPeriodEnd: safeISODate(subscription.current_period_end),
            created: new Date().toISOString()
          };

          console.log('New customer data:', customerData);

          // Store in our simulated database
          db.saveCustomer(customerData);

          // Send SMS notification via OpenPhone
          try {
            const { OPENPHONE_API_KEY, OPENPHONE_PHONE_NUMBER_ID, OPENPHONE_FROM_NUMBER, MY_PERSONAL_PHONE_NUMBER } = process.env;

            if (!OPENPHONE_API_KEY || !OPENPHONE_PHONE_NUMBER_ID || !OPENPHONE_FROM_NUMBER || !MY_PERSONAL_PHONE_NUMBER) {
              console.error('OpenPhone environment variables not fully configured. SMS not sent.');
            } else {
              const messageContent = `New YPS Signup!\nName: ${customerData.name || 'N/A'}\nPhone: ${customerData.phone || 'N/A'}\nEmail: ${customerData.email || 'N/A'}\nAddress: ${customerData.serviceAddress?.line1 || 'N/A'}, ${customerData.serviceAddress?.city || 'N/A'}\nFrequency: ${customerData.serviceFrequency || 'N/A'}\nDog Count: ${customerData.dogCount || 'N/A'}`;

              const openPhoneApiUrl = 'https://api.openphone.com/v1/messages';
              const payload = {
                content: messageContent,
                phoneNumberId: OPENPHONE_PHONE_NUMBER_ID,
                from: OPENPHONE_FROM_NUMBER,
                to: [MY_PERSONAL_PHONE_NUMBER],
              };

              console.log('Attempting to send SMS via OpenPhone:', JSON.stringify(payload, null, 2));

              const response = await fetch(openPhoneApiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': OPENPHONE_API_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                const responseData = await response.json();
                console.log('SMS sent successfully via OpenPhone:', responseData);
              } else {
                const errorData = await response.text(); // Use .text() as error might not be JSON
                console.error('Failed to send SMS via OpenPhone. Status:', response.status, 'Response:', errorData);
              }
            }
          } catch (smsError) {
            console.error('Error sending SMS via OpenPhone:', smsError);
          }

          // In a real app, here you would:
          // 1. Store customer in a real database
          // 2. Send welcome email
          // 3. Schedule first cleaning service
          // 4. Add to your service routing system

        } catch (error) {
          console.error('Error processing checkout session:', error);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = stripeEvent.data.object;
        console.log('Invoice paid:', invoice.id);

        // In a real app, here you would:
        // 1. Update customer's payment status in database
        // 2. Schedule next cleaning service
        // 3. Send receipt and confirmation
        break;
      }

      // Handle other event types
      default: {
        console.log(`Received event: ${stripeEvent.type}`);
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (err) {
    console.error('Webhook Error:', err.message);
    // Log more details for debugging
    console.error('Signature:', sig);
    console.error('Body type:', typeof event.body);
    console.error('Body preview:', typeof event.body === 'string' ? event.body.substring(0, 100) : 'Not a string');
    console.error('Full error:', err);

    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }
};

// Helper function to calculate next service date based on frequency
function calculateNextServiceDate(frequency) {
  try {
    const today = new Date();
    const nextDate = new Date(today);

    switch (frequency) {
      case '2w': { // twice weekly
        // Pick next Monday and Thursday
        const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        if (day < 1) { // Sunday
          nextDate.setDate(today.getDate() + 1); // Monday
        } else if (day < 4) { // Monday-Wednesday
          nextDate.setDate(today.getDate() + (4 - day)); // Next Thursday
        } else if (day < 6) { // Thursday-Friday
          nextDate.setDate(today.getDate() + (8 - day)); // Next Monday
        } else { // Saturday
          nextDate.setDate(today.getDate() + 2); // Monday
        }
        break;
      }
      case 'bi': { // bi-weekly
        // Every other Monday
        nextDate.setDate(today.getDate() + ((8 - today.getDay()) % 7) + 7);
        break;
      }
      case 'mo': { // monthly
        // First Monday of next month
        nextDate.setMonth(today.getMonth() + 1);
        nextDate.setDate(1);
        while (nextDate.getDay() !== 1) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      }
      default: { // weekly (1w)
        // Next Monday
        nextDate.setDate(today.getDate() + ((8 - today.getDay()) % 7));
      }
    }

    return nextDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error calculating next service date:', error);
    // Return today's date as a fallback
    return new Date().toISOString().split('T')[0];
  }
} 