import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

// Placeholder review data (replace with actual Google Reviews later)
const reviewsData = [
  {
    id: 1,
    author: "Johnny Trujillo",
    stars: 5,
    text: "YPS is fantastic! Reliable, thorough, and my yard has never looked better. The gate photo is a great touch.",
  },
  {
    id: 2,
    author: "Mickey Hodge",
    stars: 5,
    text: "Glad I found them. Professional service, fair price, and I like the idea of supporting a local family business. Highly recommend!",
  },
  {
    id: 3,
    author: "Hector Davila",
    stars: 5,
    text: "Does a great job cleaning up after my two large dogs. Consistent and communicative. Takes an item off my plate.",
  },
];

const AUTOPLAY_INTERVAL = 5000; // milliseconds (5 seconds)

function Reviews() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstReview = currentIndex === 0;
    const newIndex = isFirstReview ? reviewsData.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastReview = currentIndex === reviewsData.length - 1;
    const newIndex = isLastReview ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // Autoplay effect
  useEffect(() => {
    const timer = setInterval(() => {
      // Use functional update to avoid dependency on currentIndex directly
      setCurrentIndex(prevIndex =>
        prevIndex === reviewsData.length - 1 ? 0 : prevIndex + 1
      );
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer); // Clear interval on unmount
  }, []); // Empty dependency array: run only on mount and unmount

  const currentReview = reviewsData[currentIndex];

  // Updated helper to render Lucide stars
  const renderStars = (count) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={24}
          strokeWidth={1.5}
          fill={i < count ? 'currentColor' : 'none'} // Fill stars based on count
        />
      );
    }
    return stars;
  };

  return (
    <section id="reviews">
      <h2>What Our Neighbors Say</h2>
      <div className="review-carousel">
        <div className="review-content" key={currentReview.id}>
          <div className="stars">{renderStars(currentReview.stars)}</div>
          <blockquote className="text">"{currentReview.text}"</blockquote>
          <p className="author">- {currentReview.author}</p>
        </div>
        <div className="review-navigation">
          <button onClick={goToPrevious} aria-label="Previous review">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <button onClick={goToNext} aria-label="Next review">
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Reviews; 