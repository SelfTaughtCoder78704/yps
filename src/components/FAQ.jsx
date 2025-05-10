import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react'; // Import icon for indicator

// Updated FAQ Data
const faqData = [
  {
    id: 1,
    question: "What exactly does a visit include?",
    answer: "We walk your yard in a tight grid, scoop every pile, double-bag and haul it away, disinfect our tools & shoe soles, and text/email a closed-gate photo before we leave."
  },
  {
    id: 2,
    question: "How does pricing work?",
    answer: "Your weekly rate is based only on dog count + visit frequency (no hidden fees). We bill once a month on the card you put on file, and you can pause or cancel any time."
  },
  {
    id: 3,
    question: "My yard hasn't been cleaned in a while—do you charge extra at first?",
    answer: "Yes—if it's been 2+ weeks since the last cleanup, the first \"catch-up\" visit is a flat $25 add-on to cover the extra time. After that, regular rates apply."
  },
  {
    id: 4,
    question: "Do I have to be home during service?",
    answer: "Nope! As long as gates are unlocked and pets are secured, we'll text 60 minutes before arrival and send a gate-closed photo afterward for peace of mind."
  },
  {
    id: 5,
    question: "What happens to the waste?",
    answer: "We take every bag off-site and dispose of it according to Temple city ordinances—nothing goes in your trash bin unless you request it."
  },
  {
    id: 6,
    question: "How do you prevent spreading parvo or other germs?",
    answer: "After each yard we spray our rake, dustpan, and bucket with a vet-grade disinfectant (1:32 bleach solution or Rescue® AHP) that kills canine parvovirus in 10 minutes. We also put on fresh, disposable shoe covers before entering each yard to prevent tracking anything between properties."
  },
  {
    id: 7,
    question: "What if it rains or we have severe weather?",
    answer: "Light rain won't stop us; heavy storms or lightning may shift your visit to the next dry day on the schedule. We'll text with any changes."
  },
  {
    id: 8,
    question: "Can I pause service for vacation or cancel anytime?",
    answer: "Absolutely. Use the customer portal link in the site footer to skip weeks, pause a month, or cancel with no fees or hard feelings. You can also text us for help managing your subscription."
  }
];

function FAQ() {
  const [openItemId, setOpenItemId] = useState(null); // Track which item is open

  const toggleItem = (id) => {
    setOpenItemId(openItemId === id ? null : id); // Toggle open/closed
  };

  return (
    <section id="faq">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-accordion">
        {faqData.map(item => {
          const isOpen = openItemId === item.id;
          return (
            <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
              >
                {item.question}
                <ChevronDown
                  className={`faq-icon ${isOpen ? 'open' : ''}`}
                  size={20}
                  strokeWidth={2}
                />
              </button>
              {isOpen && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FAQ; 