import React from 'react';

function SiteFooter() {
  const currentYear = new Date().getFullYear();

  const handlePortalAccess = () => {
    // Direct link to the Stripe Customer Portal
    window.location.href = 'https://billing.stripe.com/p/login/7sIdTb0Q25N89TqdQQ';
  };

  return (
    <footer className="site-footer">
      <p>&copy; {currentYear} YPS - Yard Poop Service. All Rights Reserved.</p>
      <p>
        <button
          onClick={handlePortalAccess}
          className="portal-link"
        >
          Manage Subscription / Customer Portal
        </button>
      </p>
    </footer>
  );
}

export default SiteFooter; 