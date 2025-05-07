import Stripe from 'stripe';
/* global process */
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// This is your Stripe CLI webhook secret for testing
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_c0b9fdcd72398e29418ad30d95b8a96f59f19b4c1a4b6656cb2ec084916a0bce';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // IMPORTANT: Netlify Functions automatically parse JSON bodies
    // But Stripe needs the raw body string for signature verification
    // The rawBody field may not be available in all Netlify setups

    // We'll try a few different approaches
    let rawBody = event.body;

    // If the body is already parsed as JSON, stringify it back
    if (typeof rawBody === 'object') {
      rawBody = JSON.stringify(rawBody);
    }

    console.log('Webhook received. Signature:', sig ? 'Present' : 'Missing');

    // Verify the event came from Stripe
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
    case 'checkout.session.completed':
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

    case 'invoice.paid':
      const invoice = stripeEvent.data.object;
      console.log('Invoice paid:', invoice.id);

      // In a real app, here you would:
      // 1. Update customer's payment status in database
      // 2. Schedule next cleaning service
      // 3. Send receipt and confirmation
      break;

    // Handle other event types
    default:
      console.log(`Received event: ${stripeEvent.type}`);
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
    case '2w': // twice weekly
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
    case 'bi': // bi-weekly
      // Every other Monday
      nextDate.setDate(today.getDate() + ((8 - today.getDay()) % 7) + 7);
      break;
    case 'mo': // monthly
      // First Monday of next month
      nextDate.setMonth(today.getMonth() + 1);
      nextDate.setDate(1);
      while (nextDate.getDay() !== 1) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
    default: // weekly (1w)
      // Next Monday
      nextDate.setDate(today.getDate() + ((8 - today.getDay()) % 7));
  }

  return nextDate.toISOString().split('T')[0];
} 