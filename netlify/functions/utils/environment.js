/* global process */

// Enhanced environment detection
export const isProduction = () => {
  // Log all possible environment indicators
  const envIndicators = {
    CONTEXT: process.env.CONTEXT,
    DEPLOY_CONTEXT: process.env.DEPLOY_CONTEXT,
    NETLIFY_ENV: process.env.NETLIFY_ENV,
    BRANCH: process.env.BRANCH,
    NODE_ENV: process.env.NODE_ENV,
    DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
    URL: process.env.URL,
    DEPLOY_URL: process.env.DEPLOY_URL
  };

  console.log('Environment indicators:', envIndicators);

  // Check if we're in a production environment using multiple indicators
  const productionIndicators = [
    process.env.CONTEXT === 'production',
    process.env.DEPLOY_CONTEXT === 'production',
    process.env.NETLIFY_ENV === 'production',
    process.env.NODE_ENV === 'production',
    process.env.BRANCH === 'main' || process.env.BRANCH === 'master',
    process.env.URL?.includes('netlify.app') || process.env.URL?.includes('yardpoopservice.com'),
    process.env.DEPLOY_URL?.includes('netlify.app') || process.env.DEPLOY_URL?.includes('yardpoopservice.com')
  ];

  console.log('Production indicators:', productionIndicators);

  // Consider it production if ANY of these indicators suggest production
  return productionIndicators.some(indicator => indicator === true);
};

// Get the appropriate Stripe key based on environment
export const getStripeKey = () => {
  const environment = isProduction();

  console.log('Determined environment:', {
    isProduction: environment,
    hasProductionKey: !!process.env.PROD_STRIPE_SECRET_KEY,
    hasTestKey: !!process.env.STRIPE_SECRET_KEY
  });

  const stripeSecretKey = environment
    ? process.env.PROD_STRIPE_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    console.error('No Stripe secret key available for environment:', environment ? 'production' : 'development');
    throw new Error('Stripe secret key not configured');
  }

  // Log which key we're using (first 8 chars only for security)
  console.log('Using Stripe key type:', environment ? 'PRODUCTION' : 'TEST');
  console.log('Key prefix:', stripeSecretKey.substring(0, 8) + '...');

  return stripeSecretKey;
}; 