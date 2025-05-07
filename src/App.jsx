import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './assets/logo.png';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import WhyYPS from './components/WhyYPS';
import Reviews from './components/Reviews';
import FAQ from './components/FAQ';
import FooterCTA from './components/FooterCTA';
import SiteFooter from './components/SiteFooter';
import AdminView from './components/AdminView';

// Simple message component
const Message = ({ message, onClear }) => (
  <section style={{ padding: '40px', textAlign: 'center' }}>
    <p>{message}</p>
    {onClear && (
      <button
        className="cta-button"
        style={{ marginTop: '20px' }}
        onClick={onClear}
      >
        Try Again / Back to Quote
      </button>
    )}
  </section>
);

// Simple Success component
const SuccessDisplay = ({ onManageBilling }) => (
  <section style={{ padding: '40px', textAlign: 'center' }}>
    <h2>Subscription Successful!</h2>
    <p>Thanks for joining YPS. Your subscription is now active.</p>
    <p>You can manage your billing and subscription details anytime:</p>
    <button className="cta-button" onClick={onManageBilling}>
      Manage Billing Information
    </button>
    {/* Optional: Add link back to main page or user dashboard later */}
  </section>
);

function App() {
  // Navigation links data
  const navLinks = [
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#why-yps', label: 'Why YPS?' },
    { href: '#reviews', label: 'Reviews' },
    { href: '#faq', label: 'FAQ' },
  ];

  // State for checkout status and admin view
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check URL params on initial load
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    // Check for admin route
    if (query.get('admin') === 'true') {
      setIsAdmin(true);
      return; // Don't process other params if in admin mode
    }

    if (query.get('success')) {
      setSuccess(true);
      setSessionId(query.get('session_id'));
      setMessage(''); // Clear any potential cancelled message
    }
    if (query.get('canceled')) {
      setSuccess(false);
      setMessage(
        "Order canceled. You can recalculate your price and checkout when ready."
      );
    }
  }, []); // Run only once on mount

  // Function to clear message/status
  const clearStatus = () => {
    setMessage('');
    setSuccess(false);
    setSessionId('');
    // Optionally clear URL params again if needed
    window.history.replaceState(null, '', window.location.pathname);
  }

  // Exit admin mode
  const exitAdmin = () => {
    setIsAdmin(false);
    window.history.replaceState(null, '', window.location.pathname);
  }

  // Function to handle Manage Billing button click
  const handleManageBilling = async () => {
    if (!sessionId) {
      setMessage("Error: Session ID not found.");
      return;
    }
    try {
      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Portal
    } catch (error) {
      console.error('Failed to create portal session:', error);
      setMessage("Could not open billing management. Please try again later or contact support.");
    }
  };

  // Render based on state
  let content;

  if (isAdmin) {
    content = (
      <>
        <div className="admin-header">
          <h1>YPS Admin Dashboard</h1>
          <button className="back-button" onClick={exitAdmin}>Exit Admin</button>
        </div>
        <AdminView />
      </>
    );
  } else if (success && sessionId) {
    content = <SuccessDisplay onManageBilling={handleManageBilling} />;
  } else if (message) {
    content = <Message message={message} onClear={clearStatus} />;
  } else {
    // Main app content
    content = (
      <>
        <Hero />
        <HowItWorks />
        <Pricing />
        <WhyYPS />
        <Reviews />
        <FAQ />
        <FooterCTA />
      </>
    );
  }

  return (
    <div className="App">
      {!isAdmin && (
        <header className="app-header">
          <a href="#hero" className="logo-link">
            <div className="logo-container">
              <img src={logo} alt="YPS Yard Poop Service Logo" className="app-logo" />
              <span className="logo-text">Yard Poop Service</span>
            </div>
          </a>
          <nav className="main-nav">
            <ul>
              {navLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>
      )}
      {content}
      {!(success || message || isAdmin) && <SiteFooter />}
    </div>
  );
}

export default App;
