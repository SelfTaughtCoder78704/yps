import React from 'react';

function Pricing() {
  const pricingData = [
    { dogs: 1, rate: 15, text: "Just $15 / week" },
    { dogs: 2, rate: 18, text: "Only $18 / week" },
    { dogs: 3, rate: 22, text: "$22 / week" },
    { dogs: 4, rate: 26, text: "$26 / week" },
  ];

  return (
    <section id="pricing">
      <h2>Simple, Flat-Rate Pricing</h2>
      <div className="pricing-table-container">
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Dogs</th>
              <th>Weekly Rate</th>
            </tr>
          </thead>
          <tbody>
            {pricingData.map(item => (
              <tr key={item.dogs}>
                <td>{item.dogs}</td>
                <td>{item.text}</td>
              </tr>
            ))}
            <tr>
              <td>5+</td>
              <td>Dogs 5+? We add $3 each.</td>
            </tr>
          </tbody>
        </table>
        <p className="pricing-note">We quote weekly for clarity, but bill just once per month (weekly rate × 4).</p>
        <div className="pricing-banner">
          Get your first month free – use code <strong>FIRSTTIMEFREE</strong>
        </div>
      </div>
    </section>
  );
}

export default Pricing; 