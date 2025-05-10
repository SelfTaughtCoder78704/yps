import Stripe from 'stripe'; // Use import
/* global process */
const stripeSecretKey = process.env.CONTEXT === 'production'
  ? process.env.PROD_STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const stripe = Stripe(stripeSecretKey);

// Use export const handler
export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Request body:', event.body);
    const data = JSON.parse(event.body);
    console.log('Parsed request data:', data);

    const { dogs, frequency, monthlyPrice, email } = data;

    // Validate all required inputs are present
    if (!dogs) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing dogs count parameter' })
      };
    }

    if (!frequency) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing frequency parameter' })
      };
    }

    if (!monthlyPrice) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing monthlyPrice parameter' })
      };
    }

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email parameter' })
      };
    }

    // For simplicity now, we'll trust the monthlyPrice from the frontend
    // Convert price to cents for Stripe
    const priceInCents = Math.round(monthlyPrice * 100);

    if (isNaN(priceInCents) || priceInCents <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid price calculation' })
      };
    }

    // Validate email
    if (!email.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    console.log('Creating Stripe checkout session with params:', {
      dogs,
      frequency,
      priceInCents,
      email
    });

    const YOUR_DOMAIN = process.env.URL || 'http://localhost:8888'; // Netlify provides URL env var
    console.log('Domain URL:', YOUR_DOMAIN);

    const sessionParams = {
      billing_address_collection: 'auto', // Use auto for address autocomplete
      shipping_address_collection: {
        allowed_countries: ['US'], // Only allow US addresses
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'YPS - Yard Cleaning Service', // Clarify this is a service
              description: `${dogs} dog(s), ${frequency === '1w' ? 'weekly' : frequency === '2w' ? 'twice-weekly' : frequency === 'bi' ? 'bi-weekly' : 'monthly'} yard cleaning service. We'll visit the service address you provide below.`,
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
      // Store service details in metadata
      metadata: {
        dogs: dogs.toString(),
        frequency,
      },
      // Use customer email from the form
      customer_email: email,
      // Enable phone collection
      phone_number_collection: {
        enabled: true,
      },
      // Add custom text to guide the user on the shipping address
      custom_text: {
        shipping_address: {
          message: 'NOTE: This is the address where we will provide our yard cleaning service. This is not a shipping address - it\'s where our team will come to clean your yard.'
        },
        submit: {
          message: 'Your subscription will begin with our next available service date. We\'ll contact you to confirm the details.'
        }
      }
    };

    console.log('Stripe session params:', JSON.stringify(sessionParams, null, 2));
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('Session created successfully:', session.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    // Return detailed error information for debugging
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        details: error.raw ? error.raw : null
      }),
    };
  }
}; 