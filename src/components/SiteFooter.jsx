import React, { useState } from 'react';

function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const [isLoading, setIsLoading] = useState(false);

  const handlePortalAccess = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: localStorage.getItem('checkout_session_id') }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error accessing portal:', error);
      alert('Please contact support for help accessing your account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="site-footer">
      <p>&copy; {currentYear} YPS - Yard Poop Service. All Rights Reserved.</p>
      <p>
        <button
          onClick={handlePortalAccess}
          disabled={isLoading}
          className="portal-link"
        >
          {isLoading ? 'Loading...' : 'Manage Subscription / Customer Portal'}
        </button>
      </p>
    </footer>
  );
}

export default SiteFooter; 