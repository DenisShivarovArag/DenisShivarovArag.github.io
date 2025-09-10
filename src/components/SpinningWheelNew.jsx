import React, { useState, useRef, useEffect } from "react";
import { ArrowBigDown, ArrowRight, RotateCcw, Trash2 } from "lucide-react";
import Button from "./Button";
import "./SpinningWheel.css";

const INITIAL_ITEMS = [
  "Denis",
  "Frank",
  "Ahmet",
  "Arpitha",
  "Rick",
  "Merlin",
  "Henning",
  "Ivo",
  "Jens",
];

const MIN_DURATION = 300000; // 5 minutes in milliseconds

const SpinningWheel = () => {
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

  // Statistics
  const [dailyStats, setDailyStats] = useState(() => {
    const savedStats = localStorage.getItem("dailyStats");
    return savedStats ? JSON.parse(savedStats) : {};
  });

  const [showDuration, setShowDuration] = useState(true);
  const [currentDuration, setCurrentDuration] = useState(0);

  const [startTime, setStartTime] = useState(null);

  const wheelRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("wheelItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("selectedItem", selectedItem);
  }, [selectedItem]);

  useEffect(() => {
    localStorage.setItem("autoRemove", autoRemove);
  }, [autoRemove]);

  // Save daily statistics to local storage
  useEffect(() => {
    localStorage.setItem("dailyStats", JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    if (startTime && showDuration) {
      timerRef.current = setInterval(() => {
        setCurrentDuration(Date.now() - startTime);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [startTime, showDuration]);

  const spinWheel = () => {
    if (items.length === 0) return;

    setIsSpinning(true);

    let updatedItems = [...items];

    // Remove the previously selected item before spinning if autoRemove is true
    if (autoRemove && selectedItem) {
      updatedItems = items.filter((item) => item !== selectedItem);
      setItems(updatedItems);
    }

    setSelectedItem(null);

    // Calculate the angle for each segment
    const segmentAngle = 360 / updatedItems.length;
    // Randomly select a segment to land on
    const selectedSegment = Math.floor(Math.random() * updatedItems.length);
    // Calculate the rotation needed to align the selected segment with the arrow
    const rotationNeeded = 360 - selectedSegment * segmentAngle;
    // Add extra rotations for visual effect (e.g., 3 full spins)
    const extraRotations = 360 * 3;

    const totalRotation = rotationNeeded + extraRotations;

    wheelRef.current.style.transition =
      "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)";
    wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
      const selected = updatedItems[selectedSegment];
      setSelectedItem(selected);
      setIsSpinning(false);

      if (!startTime) {
        setStartTime(Date.now());
        setCurrentDuration(0);
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
    setStartTime(null);
  };

  const endDaily = () => {
    if (startTime) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration >= MIN_DURATION) {
        // Create a new stats entry
        const today = new Date().toISOString().split("T")[0];
        const newStat = {
          duration: duration,
          last: selectedItem,
          participants: INITIAL_ITEMS.length,
        };

        setDailyStats((prevStats) => ({
          ...prevStats,
          [today]: newStat,
        }));

        // Log the updated statistics to the console
        console.log("Daily Statistics:", { ...dailyStats, [today]: newStat });
      } else {
        //setDailyStats([]);
        console.log(
          "Daily duration was less than 5 minutes. Statistics not saved."
        );
      }

      setStartTime(null);
      setSelectedItem(null);
      setCurrentDuration(0);

      // Remove the last person from the wheel
      const updatedItems = items.filter((item) => item !== selectedItem);
      setItems(updatedItems);
    }
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

  useEffect(() => {
    const wheel = wheelRef.current;
    const handleTransitionEnd = () => {
      wheel.style.transition = "none";
      const currentRotation = wheel.style.transform;
      const degrees = parseFloat(currentRotation.match(/[-0-9.]+/)[0]) % 360;
      wheel.style.transform = `rotate(${degrees}deg)`;
      setTimeout(() => {
        wheel.style.transition =
          "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)";
      }, 50);
    };
    wheel.addEventListener("transitionend", handleTransitionEnd);
    return () =>
      wheel.removeEventListener("transitionend", handleTransitionEnd);
  }, []);

  return (
    <>
      <div className="spinning-wheel-container">
        <h1 className="header">Spinning Wheel of Dailies</h1>

        {showDuration && startTime && (
          <div className="duration-display">
            {formatDuration(currentDuration)}
          </div>
        )}

        <div className="wheel-container">
          <div ref={wheelRef} className="wheel">
            {items.map((item, index) => (
              <div
                key={item}
                className="wheel-item"
                style={{
                  transform: `rotate(${(index * 360) / items.length}deg)`,
                }}
              >
                <div className="item-content">{item}</div>
              </div>
            ))}
          </div>
          <div className="wheel-arrow"></div>
        </div>

        <div className="result">
          Result:{" "}
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
      </div>
      <footer>Wheel of Dailies v1.4</footer>
    </>
  );
};

export default SpinningWheel;
