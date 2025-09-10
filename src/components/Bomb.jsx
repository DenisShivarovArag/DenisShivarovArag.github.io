import React, { useState, useEffect } from "react";
import "./Bomb.css";

const Bomb = ({ duration = 15 * 60 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bomb-container">
      <svg viewBox="0 0 200 220" className="bomb-svg">
        {/* Bomb body */}
        <circle cx="100" cy="150" r="60" className="bomb-body" />
        <rect x="95" y="90" width="10" height="20" className="bomb-fuse" />

        {/* Burning fuse animation */}
        <g className="fuse-fire" transform="translate(100, 90) scale(0.5)">
          <path className="fire-particle" d="M0 0 Q10 -20 0 -40 Q-10 -20 0 0" />
          <path
            className="fire-particle"
            d="M-5 0 Q5 -25 -5 -45 Q-15 -25 -5 0"
          />
          <path className="fire-particle" d="M5 0 Q15 -25 5 -45 Q-5 -25 5 0" />
        </g>

        {/* Digital timer */}
        <text x="100" y="160" className="bomb-timer" textAnchor="middle">
          {formatTime(timeLeft)}
        </text>
      </svg>
    </div>
  );
};

export default Bomb;
