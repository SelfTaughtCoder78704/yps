import React, { useState, useEffect } from 'react';

// Pricing logic function from the blueprint
function calculateQuote({ dogs, freq }) {
  const base = [0, 15, 18, 22, 26][Math.min(dogs, 4)] + Math.max(dogs - 4, 0) * 3;
  let weekly;
  switch (freq) {
    case '2w':
      weekly = base * 2;
      break;
    case 'bi':
      weekly = base / 2;
      break;
    case 'mo':
      weekly = base / 4;
      break;
    case '1w':
    default:
      weekly = base;
  }
  // Return 0 if frequency is invalid or calculation results in NaN/undefined
  if (isNaN(weekly) || typeof weekly === 'undefined') {
    return { weekly: 0, monthly: 0 };
  }
  return {
    weekly: +weekly.toFixed(2),
    monthly: +(weekly * 4).toFixed(2)
  };
}

function Hero() {
  const [dogs, setDogs] = useState(1);
  const [frequency, setFrequency] = useState('1w'); // Default to Once a week
  const [quote, setQuote] = useState({ weekly: 0, monthly: 0 });
  const [showPrice, setShowPrice] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Recalculate quote whenever dogs or frequency changes
  useEffect(() => {
    const newQuote = calculateQuote({ dogs, freq: frequency });
    setQuote(newQuote);
  }, [dogs, frequency]);

  const handleDogChange = (e) => {
    const numDogs = parseInt(e.target.value, 10);
    if (!isNaN(numDogs)) {
      setDogs(numDogs);
    }
  };

  const handleFrequencyChange = (e) => {
    setFrequency(e.target.value);
  };

  // Button click now just reveals the already calculated price
  const handleGetPrice = (e) => {
    e.preventDefault();
    setShowPrice(true);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  // Validate email
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError("Email address is required");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  // Function to handle checkout button click
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    console.log('Checkout button clicked!');
    console.log('Selected Dogs:', dogs);
    console.log('Selected Frequency:', frequency);
    console.log('Calculated Quote:', quote);
    console.log('Email:', email);

    // Send data to Netlify function
    try {
      const requestData = {
        dogs: dogs,
        frequency: frequency,
        monthlyPrice: quote.monthly,
        email: email
      };

      console.log('Sending data to checkout function:', requestData);

      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!responseData.url) {
        throw new Error('No checkout URL returned from server');
      }

      // Redirect to Stripe Checkout
      window.location.href = responseData.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert(`Error: ${error.message}. Please try again or contact support.`);
    }
  };

  return (
    <section id="hero" className="hero-section">
      <div className="hero-text-content">
        <h1>Keep the yard clean & the kids' shoes cleaner – for less than two bucks a day.</h1>
        <p className="sub-headline">Temple's only father-and-teens poop-scooping squad. One flat rate, 4 clean-ups a month, no contracts.</p>
        <p className="slogan">Your Path to a Greener (and Cleaner) Yard.</p>
      </div>

      <form className="quote-widget" onSubmit={handleGetPrice}>
        <div className="form-group">
          <label htmlFor="dogs">How many dogs romp in your yard?</label>
          <select id="dogs" value={dogs} onChange={handleDogChange}>
            {[1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="frequency">How often per month?</label>
          <select id="frequency" value={frequency} onChange={handleFrequencyChange}>
            <option value="1w">Once a week</option>
            <option value="2w">Twice a week</option>
            <option value="bi">Every other week</option>
            <option value="mo">Once a month</option>
          </select>
        </div>

        {/* Only show button if price isn't already shown */}
        {!showPrice && (
          <button type="submit">Get My Price →</button>
        )}

        <p className="tooltip">We quote weekly for clarity, but bill just once per month.</p>

        {showPrice && quote.weekly > 0 && (
          <div className="price-display">
            {frequency === '1w' && (
              <>
                <p>Your weekly rate:</p>
                <h2>${quote.weekly} / week</h2>
              </>
            )}
            {frequency === '2w' && (
              <>
                <p>Your rate (twice a week):</p>
                <h2>${quote.weekly} / week</h2>
              </>
            )}
            {frequency === 'bi' && (
              <>
                <p>Your rate (every other week):</p>
                <h2>${(quote.monthly / 2).toFixed(2)} / visit</h2>
              </>
            )}
            {frequency === 'mo' && (
              <>
                <p>Your monthly rate:</p>
                <h2>${(quote.monthly).toFixed(2)} / month</h2>
              </>
            )}
            <p>(Billed at ${quote.monthly} monthly)</p>

            <div className="form-group">
              <label htmlFor="email">Email Address*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                required
              />
              {emailError && <span className="error-text">{emailError}</span>}
            </div>

            <button
              className="cta-button checkout-button"
              onClick={(e) => {
                e.preventDefault(); // Prevent form submission
                handleCheckout(e);
              }}
              type="button" // Change from default submit type
            >
              Proceed to Checkout
            </button>

            <p className="checkout-note">
              You'll enter your address and contact details in the next step.
            </p>
          </div>
        )}
        {showPrice && quote.weekly <= 0 && (
          <div className="price-display">
            <p>Please select valid options.</p>
          </div>
        )}
      </form>
    </section>
  );
}

export default Hero; 