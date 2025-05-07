import Stripe from 'stripe';
import { Buffer } from 'node:buffer';
/* global process */
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// This is your Stripe CLI webhook secret for testing
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Check if webhook secret is configured
if (!endpointSecret) {
  console.error('STRIPE_WEBHOOK_SECRET environment variable is not set!');
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Netlify Functions often provide a base64 encoded body
    let rawBody;

    if (event.isBase64Encoded) {
      // If base64 encoded, decode it
      rawBody = Buffer.from(event.body, 'base64').toString();
    } else if (typeof event.body === 'object') {
      // If body is already parsed as JSON, stringify it
      rawBody = JSON.stringify(event.body);
    } else {
      // Otherwise, use the body as-is
      rawBody = event.body;
    }

    console.log('Webhook received. Signature:', sig ? 'Present' : 'Missing');

    // Verify the event came from Stripe
    if (!endpointSecret) {
      throw new Error('Webhook secret not configured. Please set STRIPE_WEBHOOK_SECRET environment variable.');
    }

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
          serviceAddress: checkoutSession.shipping?.address || {},
          nextServiceDate: calculateNextServiceDate(checkoutSession.metadata?.frequency),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
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
} 