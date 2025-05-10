import Stripe from 'stripe';
import { getStripeKey } from './utils/environment.js';
/* global process */

const stripe = Stripe(getStripeKey());

// Admin password from environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password';

export const handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Check for admin authentication
  const authHeader = event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - Authentication required' })
    };
  }

  const providedPassword = authHeader.split('Bearer ')[1];

  if (providedPassword !== ADMIN_PASSWORD) {
    console.error('Invalid admin password provided');
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden - Invalid credentials' })
    };
  }

  try {
    // Get all customers from Stripe
    const customers = await stripe.customers.list({
      limit: 100, // Adjust as needed
      expand: ['data.subscriptions'],
    });

    // Transform customer data for our UI
    const processedCustomers = await Promise.all(
      customers.data.map(async (customer) => {
        // For customers with subscriptions, get their metadata and service details
        let serviceDetails = {
          frequency: 'weekly', // Default
          dogs: '1',           // Default
          nextServiceDate: new Date().toISOString().split('T')[0],
          status: 'pending'
        };

        // Get subscription details if available
        if (customer.subscriptions && customer.subscriptions.data.length > 0) {
          const subscription = customer.subscriptions.data[0];

          // Get checkout session to retrieve metadata
          const sessions = await stripe.checkout.sessions.list({
            customer: customer.id,
            limit: 1,
          });

          if (sessions.data.length > 0) {
            const session = sessions.data[0];

            // Get frequency and dogs count from metadata if available
            if (session.metadata) {
              serviceDetails.frequency = session.metadata.frequency || serviceDetails.frequency;
              serviceDetails.dogs = session.metadata.dogs || serviceDetails.dogs;
            }

            // Calculate next service date based on frequency
            serviceDetails.nextServiceDate = calculateNextServiceDate(serviceDetails.frequency);

            // Set status based on subscription status
            serviceDetails.status = subscription.status;
          }
        }

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          serviceAddress: customer.shipping?.address,
          ...serviceDetails
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(processedCustomers),
    };

  } catch (error) {
    console.error('Error fetching customers:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Helper function to calculate next service date based on frequency
function calculateNextServiceDate(frequency) {
  const today = new Date();
  const nextDate = new Date(today);
  // Declare day variable outside switch case to avoid linter error
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...

  switch (frequency) {
    case '2w': // twice weekly
      // Pick next Monday and Thursday
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