import React from 'react';
// Import icons from lucide-react
import { Users, SprayCan, Camera, FileText } from 'lucide-react';

function WhyYPS() {
  return (
    <section id="why-yps">
      <h2>Why Choose YPS?</h2>
      <div className="why-yps-points">
        <div className="point">
          <div className="icon-wrapper">
            <Users size={40} strokeWidth={1.5} />
          </div>
          <h3>Family-Run & Insured</h3>
          <p>Local father-and-teens team, fully insured for your peace of mind.</p>
        </div>
        <div className="point">
          <div className="icon-wrapper">
            <SprayCan size={40} strokeWidth={1.5} />
          </div>
          <h3>Parvo-Proof Protocol</h3>
          <p>We disinfect tools & boots (bleach 1:32 or Rescue® AHP, 10-min dwell) between yards to prevent disease spread.</p>
        </div>
        <div className="point">
          <div className="icon-wrapper">
            <Camera size={40} strokeWidth={1.5} />
          </div>
          <h3>Gate-Closed Guarantee</h3>
          <p>Get photo proof via email after each visit showing your gate is securely closed, or the month is free.</p>
        </div>
        <div className="point">
          <div className="icon-wrapper">
            <FileText size={40} strokeWidth={1.5} />
          </div>
          <h3>No Long-Term Contracts</h3>
          <p>Simple monthly service. Cancel anytime with just a text message.</p>
        </div>
      </div>
    </section>
  );
}

export default WhyYPS; 