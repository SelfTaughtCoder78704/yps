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
const SuccessDisplay = ({ sessionId }) => {
  // Store session ID when showing success message
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('checkout_session_id', sessionId);
    }
  }, [sessionId]);

  const handleManageBilling = () => {
    window.location.href = 'https://billing.stripe.com/p/login/7sIdTb0Q25N89TqdQQ';
  };

  return (
    <section style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Subscription Successful!</h2>
      <p>Thanks for joining YPS. Your subscription is now active.</p>
      <p>You can manage your billing and subscription details anytime:</p>
      <button className="cta-button" onClick={handleManageBilling}>
        Manage Billing Information
      </button>
    </section>
  );
};

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
      const sessionId = query.get('session_id');
      setSuccess(true);
      setSessionId(sessionId);
      // Store session ID for later portal access
      if (sessionId) {
        localStorage.setItem('checkout_session_id', sessionId);
      }
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
    content = <SuccessDisplay sessionId={sessionId} />;
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
