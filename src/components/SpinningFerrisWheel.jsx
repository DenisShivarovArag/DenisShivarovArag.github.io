import React, { useState, useEffect } from "react";
import { ArrowBigDown, ArrowRight, RotateCcw, Trash2 } from "lucide-react";
import Button from "./Button";
import "./SpinningFerrisWheel.css";

const INITIAL_ITEMS = [
  "Denis",
  "Frank",
  "Ahmet",
  "Arpitha",
  "Rick",
  "Henning",
  "Ivo",
  "Markus",
  "Jens",
];

const INITIAL_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const MIN_DURATION = 300000; // 5 minutes in milliseconds

const EnhancedFerrisWheel = () => {
  // State from SpinningFerrisWheel
  const [isOpen, setIsOpen] = useState(false);

  // States from SpinningWheel
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("wheelItems");
    return savedItems ? JSON.parse(savedItems) : INITIAL_ITEMS;
  });
  const [selectedItem, setSelectedItem] = useState(() => {
    return localStorage.getItem("selectedItem") || null;
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoRemove, setAutoRemove] = useState(() => {
    return localStorage.getItem("autoRemove") === "false" ? false : true;
  });
  const [dailyStats, setDailyStats] = useState(() => {
    const savedStats = localStorage.getItem("dailyStats");
    return savedStats ? JSON.parse(savedStats) : {};
  });
  const [showDuration, setShowDuration] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [overtime, setOvertime] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  // Local storage effects
  useEffect(() => {
    localStorage.setItem("wheelItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("selectedItem", selectedItem);
  }, [selectedItem]);

  useEffect(() => {
    localStorage.setItem("autoRemove", autoRemove);
  }, [autoRemove]);

  useEffect(() => {
    localStorage.setItem("dailyStats", JSON.stringify(dailyStats));
  }, [dailyStats]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && showDuration) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            // When timer hits zero, start counting overtime
            if (!isOvertime) {
              setIsOvertime(true);
            }
            return 0;
          }
          return prev - 1000;
        });

        // Separate overtime counter logic
        if (isOvertime) {
          setOvertime((prev) => {
            const newOvertime = prev + 1000;
            // When overtime reaches 1 minute, hide the duration display
            if (newOvertime === 61000) {
              setShowDuration(false);
            }
            return newOvertime;
          });
        }
      }, 1000);
    } else if (!isTimerRunning && !showDuration) {
      clearInterval(timerRef.current);
      setOvertime(0);
      setIsOvertime(false);
    }

    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, isOvertime]);

  const spinWheel = () => {
    if (items.length === 0) return;

    setIsSpinning(true);
    setIsOpen(true);

    let updatedItems = [...items];

    if (autoRemove && selectedItem) {
      updatedItems = items.filter((item) => item !== selectedItem);
      setItems(updatedItems);
    }

    setSelectedItem(null);

    // Simulate wheel spinning with random selection
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * updatedItems.length);
      const selected = updatedItems[randomIndex];
      setSelectedItem(selected);
      setIsSpinning(false);

      if (!isTimerRunning) {
        setIsTimerRunning(true);
      }
    }, 3000);
  };

  const removeItem = () => {
    if (selectedItem && !autoRemove) {
      const updatedItems = items.filter((item) => item !== selectedItem);
      setItems(updatedItems);
      setSelectedItem(null);
    }
  };

  const resetWheel = () => {
    setItems(INITIAL_ITEMS);
    setSelectedItem("Spin the wheel!");
    setTimeRemaining(INITIAL_DURATION);
    setShowDuration(true);
    setIsTimerRunning(false);
    setOvertime(0);
    setIsOvertime(false);
    setIsOpen(false);
  };

  const endDaily = () => {
    const duration = INITIAL_DURATION - timeRemaining;
    const totalDuration = duration + overtime;

    if (duration >= MIN_DURATION) {
      const today = new Date().toISOString().split("T")[0];
      const newStat = {
        totalDuration: totalDuration,
        overtime: overtime,
        last: selectedItem,
        participants: INITIAL_ITEMS.length,
      };

      setDailyStats((prevStats) => ({
        ...prevStats,
        [today]: newStat,
      }));
    }

    setTimeRemaining(INITIAL_DURATION);
    setIsTimerRunning(false);
    setShowDuration(false);
    setSelectedItem(null);
    setIsOpen(false);

    const updatedItems = items.filter((item) => item !== selectedItem);
    setItems(updatedItems);
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  // Ferris Wheel rendering code
  const renderCabins = () => {
    const cabins = [];
    for (let i = 0; i < Math.min(12, items.length); i++) {
      const item = items[i];
      cabins.push(
        <div key={i} className={`cabin n-${i}`}>
          <div className="cabin--handle"></div>
          <div className="cabin--core">
            <div className="cabin--core2">
              <div className="cabin--base"></div>
              <div className="human human-0"></div>
              <div className="human human-1"></div>
              <div className="human human-2"></div>
              <div className="item-name">{item}</div>
            </div>
          </div>
        </div>
      );
    }
    return cabins;
  };

  const renderSpikes = () => {
    const spikes = [];
    const spikeCount = 24;

    for (let i = 0; i < spikeCount; i++) {
      spikes.push(
        <div key={`n-${i}`} className={`ferris-wheel--spike n-${i}`}></div>
      );
      spikes.push(
        <div key={`s-${i}`} className={`ferris-wheel--spike s-${i}`}></div>
      );
    }

    return spikes;
  };

  return (
    <div className="spinning-wheel-container">
      <h1 className="header">InDocFlow Daily Wheel</h1>
      {isOvertime && (
        <div className="overtime-display">
          Overtime: {formatDuration(overtime)}
        </div>
      )}
      {showDuration && (
        <div
          className={`duration-display ${
            timeRemaining <= 5 * 60 * 1000
              ? "red"
              : timeRemaining <= 10 * 60 * 1000
              ? "orange"
              : "green"
          }`}
        >
          {formatDuration(timeRemaining)}
        </div>
      )}

      {/* Result Section */}
      <div className="result">
        Du bist dran:{" "}
        <span
          className={`result-text ${items.length === 0 ? "daily-over" : ""}`}
        >
          {isSpinning
            ? "Spinning..."
            : items.length === 0
            ? "Daily is over :)"
            : selectedItem || "Spin the wheel!"}
        </span>
      </div>

      <div className={`ferris-wheel ${isOpen ? "is-open" : ""}`}>
        <div className="ferris-wheel--core">
          {renderCabins()}
          <div className="ferris-wheel--circle1"></div>
          <div className="ferris-wheel--circle2"></div>
          {renderSpikes()}
        </div>

        <div className="ferris-base">
          <div className="ferris-base--center"></div>
          <div className="ferris-base--top"></div>
          <div className="ferris-base--main"></div>
          <div className="ferris-base--spike is-1"></div>
          <div className="ferris-base--spike is-2"></div>
          <div className="ferris-base--handle"></div>
        </div>
      </div>

      {/* Button Container Section */}
      <div className="button-container">
        <Button
          onClick={items.length === 1 ? endDaily : spinWheel}
          disabled={isSpinning || items.length === 0}
          className="spin-button"
          icon={items.length === 1 ? ArrowBigDown : ArrowRight}
        >
          {items.length === 1 ? "End the daily" : "Turn the wheel!"}
        </Button>
        <Button
          onClick={removeItem}
          disabled={!selectedItem || autoRemove || items.length === 0}
          className="remove-button"
          icon={Trash2}
        >
          Remove Selected
        </Button>
      </div>

      {items.length === 0 && (
        <div className="reset-button-container">
          <Button
            onClick={resetWheel}
            className="reset-button"
            icon={RotateCcw}
          >
            Reset Wheel
          </Button>
        </div>
      )}

      <div className="auto-remove-toggle">
        <label className="toggle">
          <input
            type="checkbox"
            checked={autoRemove}
            onChange={() => setAutoRemove(!autoRemove)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="toggle-label">Auto-remove after spin</span>
      </div>

      <div className="duration-toggle">
        <label className="toggle">
          <input
            type="checkbox"
            checked={showDuration}
            onChange={() => setShowDuration(!showDuration)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="toggle-label">Show Duration</span>
      </div>

      <footer>Wheel of Dailies v2.0</footer>
    </div>
  );
};

export default EnhancedFerrisWheel;
