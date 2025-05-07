import React, { useState, useEffect } from 'react';

function AdminView() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Add authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Fetch real customer data from Stripe via our Netlify function
  const fetchCustomers = async (adminPassword) => {
    try {
      setLoading(true);
      setError(null);

      // Make a real API call to our Netlify function with authentication
      const response = await fetch('/.netlify/functions/get-customers', {
        headers: {
          'Authorization': `Bearer ${adminPassword}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        setIsAuthenticated(false);
        setAuthError('Invalid password. Please try again.');
        setLoading(false);
        return false;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('Fetched customer data from Stripe:', data);
      setCustomers(data);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customer data: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle login attempt
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setAuthError('Password is required');
      return;
    }

    // Store password in sessionStorage if login successful
    const success = await fetchCustomers(password);
    if (success) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminPassword', password);
      setAuthError('');
    }
  };

  // Check for existing password in session storage on load
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword');

    if (savedPassword) {
      setPassword(savedPassword);
      // Try to authenticate with saved password
      fetchCustomers(savedPassword).then(success => {
        if (success) {
          setIsAuthenticated(true);
        } else {
          // Clear invalid saved password
          sessionStorage.removeItem('adminPassword');
        }
      });
    } else {
      setLoading(false); // Not loading if we're just showing the login form
    }
  }, []);

  // Filter customers by service date
  const customersForSelectedDate = customers.filter(
    customer => customer.nextServiceDate === selectedDate
  );

  // Get next 14 days for date picker
  const getNextTwoWeeks = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.line1 || ''}, ${address.city || ''}, ${address.state || ''} ${address.postal_code || ''}`;
  };

  const formatFrequency = (freq) => {
    switch (freq) {
      case '1w': return 'Weekly';
      case '2w': return 'Twice Weekly';
      case 'bi': return 'Bi-Weekly';
      case 'mo': return 'Monthly';
      default: return freq;
    }
  };

  // Logout function
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    sessionStorage.removeItem('adminPassword');
  };

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-view">
        <h2>YPS Admin Login</h2>
        <p>Please enter the admin password to access customer data.</p>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="admin-password">Admin Password</label>
            <input
              type="password"
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              placeholder="Enter admin password"
            />
          </div>

          {authError && <p className="error">{authError}</p>}

          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <div className="admin-header-controls">
        <h2>Yard Poop Service - Admin Dashboard</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="date-selector">
        <label htmlFor="service-date">Select Service Date:</label>
        <select
          id="service-date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {getNextTwoWeeks().map(date => (
            <option key={date} value={date}>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading customer data from Stripe...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <h3>Services for {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}</h3>

          {customers.length === 0 ? (
            <p>No customers found in your Stripe account.</p>
          ) : customersForSelectedDate.length === 0 ? (
            <p>No services scheduled for this date.</p>
          ) : (
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Service Address</th>
                  <th>Dogs</th>
                  <th>Frequency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customersForSelectedDate.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name || 'No name'}</td>
                    <td>
                      {customer.email || 'No email'}<br />
                      {customer.phone || 'No phone'}
                    </td>
                    <td>{formatAddress(customer.serviceAddress)}</td>
                    <td>{customer.dogCount}</td>
                    <td>{formatFrequency(customer.serviceFrequency)}</td>
                    <td>
                      <button className="mark-complete">
                        Mark Complete
                      </button>
                      <button className="reschedule">
                        Reschedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>All Customers ({customers.length})</h3>
          {customers.length === 0 ? (
            <p>No customers found in your Stripe account.</p>
          ) : (
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Service Address</th>
                  <th>Dogs</th>
                  <th>Frequency</th>
                  <th>Next Service</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name || 'No name'}</td>
                    <td>
                      {customer.email || 'No email'}<br />
                      {customer.phone || 'No phone'}
                    </td>
                    <td>{formatAddress(customer.serviceAddress)}</td>
                    <td>{customer.dogCount}</td>
                    <td>{formatFrequency(customer.serviceFrequency)}</td>
                    <td>
                      {customer.nextServiceDate ? new Date(customer.nextServiceDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>{customer.status || 'unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default AdminView; 