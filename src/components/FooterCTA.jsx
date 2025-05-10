import React from 'react';
// Removed image import as it will be used in CSS
// import dogImage from '../assets/dog.png'; 

function FooterCTA() {
  // IMPORTANT: Replace XXX-XXXX with the actual phone number
  const phoneNumber = "(254) 274-6816";


  // Function to handle highlight
  const handleScrollAndHighlight = () => {
    // Find the quote widget - Note: This assumes direct DOM manipulation
    // In a larger app, using refs or state management might be better
    const quoteWidget = document.querySelector('.quote-widget');
    if (quoteWidget) {
      // Add highlight class
      quoteWidget.classList.add('highlight-border');

      // Remove highlight class after a delay
      setTimeout(() => {
        quoteWidget.classList.remove('highlight-border');
      }, 1500); // Highlight duration: 1.5 seconds
    }
    // Allow default link behavior (scrolling) to proceed
  };

  return (
    <section id="footer-cta" className="footer-cta-section">
      {/* Content is now direct children of section */}
      <h2>Ready to retire your pooper-scooper?</h2>
      <p className="offer">Get your first month free! Use code <strong style={{ color: 'white', backgroundColor: 'black', padding: '5px', borderRadius: '5px' }}>FIRSTTIMEFREE</strong> at checkout.</p>
      <div className="cta-options">
        <p>Call <a href="tel:{phoneNumber}">{phoneNumber}</a></p>
        <p>or</p>
        <a
          href="#hero"
          className="cta-button"
          onClick={handleScrollAndHighlight}
        >
          Get Your Instant Quote
        </a>
      </div>
    </section>
  );
}

export default FooterCTA; 