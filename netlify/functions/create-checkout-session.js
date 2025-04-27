import Stripe from 'stripe'; // Use import
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use environment variable!

// Use export const handler
export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { dogs, frequency, monthlyPrice } = JSON.parse(event.body);

    // TODO: Validate inputs (dogs, frequency, monthlyPrice)
    // TODO: Optionally recalculate monthlyPrice server-side for security

    // For simplicity now, we'll trust the monthlyPrice from the frontend
    // Convert price to cents for Stripe
    const priceInCents = Math.round(monthlyPrice * 100);

    if (isNaN(priceInCents) || priceInCents <= 0) {
      throw new Error('Invalid price calculation.')
    }

    const YOUR_DOMAIN = process.env.URL || 'http://localhost:8888'; // Netlify provides URL env var

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'required', // Collect billing address
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          // price: '{{PRICE_ID}}', // Use price_data for dynamic pricing instead
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'YPS - Monthly Service', // Or fetch product name
              // Add description or images if desired
            },
            unit_amount: priceInCents, // Price in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/?canceled=true`,
      // Enable promo codes
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 