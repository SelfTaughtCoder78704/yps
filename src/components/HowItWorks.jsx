import React from 'react';
// Import icons
import { CalendarClock, Trash2, ShieldCheck } from 'lucide-react';

function HowItWorks() {
  return (
    <section id="how-it-works">
      <h2>How It Works</h2>
      <div className="how-it-works-cards">
        <div className="card">
          <div className="icon-wrapper">
            <CalendarClock size={48} strokeWidth={1.5} />
          </div>
          <h3>Schedule & 60-min text</h3>
          <p>We text when we're on the way – no surprises.</p>
        </div>
        <div className="card">
          <div className="icon-wrapper">
            <Trash2 size={48} strokeWidth={1.5} />
          </div>
          <h3>Scoop & Double-Bag</h3>
          <p>Average yard: 7 minutes. Piles gone, grass happy.</p>
        </div>
        <div className="card">
          <div className="icon-wrapper">
            <ShieldCheck size={48} strokeWidth={1.5} />
          </div>
          <h3>Sanitize & Gate-Photo</h3>
          <p>Tools + boots sprayed with vet-grade disinfectant, then we snap a closed-gate pic and email it so Fido stays safe.</p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks; 