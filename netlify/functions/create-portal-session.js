import Stripe from 'stripe';
/* global process */

const stripeSecretKey = process.env.CONTEXT === 'production'
  ? process.env.PROD_STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const stripe = Stripe(stripeSecretKey);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { session_id } = JSON.parse(event.body);

    if (!session_id) {
      throw new Error('Checkout Session ID is required.');
    }

    // Retrieve the Checkout Session to get the customer ID
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    const customerId = checkoutSession.customer;

    if (!customerId) {
      throw new Error('Could not find customer ID for the session.');
    }

    // This is the URL to which the customer will be redirected after
    // managing their billing information.
    const returnUrl = process.env.URL || 'http://localhost:8888'; // Your site's URL

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: portalSession.url }),
    };

  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 