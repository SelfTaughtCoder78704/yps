import React from 'react';

function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const portalLink = "https://billing.stripe.com/p/login/test_6oEcNl0jP0f2f5u9AA";

  return (
    <footer className="site-footer">
      <p>&copy; {currentYear} YPS - Yard Poop Service. All Rights Reserved.</p>
      <p>
        <a href={portalLink} target="_blank" rel="noopener noreferrer">Manage Subscription / Customer Portal</a>
      </p>
    </footer>
  );
}

export default SiteFooter; 