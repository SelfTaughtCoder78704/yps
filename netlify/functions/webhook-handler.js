import Stripe from 'stripe';
import { Buffer } from 'node:buffer';
/* global process */

// Determine if we're in production using multiple environment checks
const isProduction =
  process.env.CONTEXT === 'production' ||
  process.env.NETLIFY_ENV === 'production' ||
  process.env.DEPLOY_CONTEXT === 'production';

// Determine which key to use based on environment
const stripeSecretKey = isProduction
  ? process.env.PROD_STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const stripe = Stripe(stripeSecretKey);

// Use production webhook secret in production, fallback to dev secret otherwise
const endpointSecret = isProduction
  ? process.env.STRIPE_WEBHOOK_SECRET_PROD
  : process.env.STRIPE_WEBHOOK_SECRET;

// Enhanced environment logging
console.log('Environment:', {
  CONTEXT: process.env.CONTEXT,
  NETLIFY_ENV: process.env.NETLIFY_ENV,
  DEPLOY_CONTEXT: process.env.DEPLOY_CONTEXT,
  isProduction,
  hasSecret: !!endpointSecret,
  usingProdKey: isProduction,
  hasTestKey: !!process.env.STRIPE_SECRET_KEY,
  hasProdKey: !!process.env.PROD_STRIPE_SECRET_KEY
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Explicitly log request details for troubleshooting
    console.log('Webhook received. Signature:', sig ? 'Present' : 'Missing');
    console.log('Headers:', JSON.stringify(event.headers));
    console.log('isBase64Encoded:', event.isBase64Encoded);
    console.log('Body type:', typeof event.body);

    if (!endpointSecret) {
      throw new Error('Webhook secret not configured. Please set STRIPE_WEBHOOK_SECRET_PROD environment variable.');
    }

    // Get raw body - try multiple approaches to handle different Netlify configurations
    let rawBody;

    if (event.isBase64Encoded) {
      console.log('Using base64 decoded body');
      rawBody = Buffer.from(event.body, 'base64').toString('utf8');
    } else if (typeof event.body === 'string') {
      console.log('Using string body directly');
      rawBody = event.body;
    } else if (typeof event.body === 'object') {
      console.log('Stringifying object body');
      rawBody = JSON.stringify(event.body);
    } else {
      throw new Error(`Unexpected body type: ${typeof event.body}`);
    }

    // Try verifying with the exact signature and body
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret
    );

    console.log('Webhook verified:', stripeEvent.id);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    // Log more details for debugging
    console.error('Signature:', sig);
    console.error('Body type:', typeof event.body);
    console.error('Body preview:', typeof event.body === 'string' ? event.body.substring(0, 100) : 'Not a string');

    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

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