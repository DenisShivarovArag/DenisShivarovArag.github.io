import React, { useState, useRef, useEffect } from "react";
import {
  ArrowBigDown,
  ArrowRight,
  RotateCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import DeleteButton from "./DeleteButton";
import TurnWheelButton from "./TurnWheelButton";
import Button from "./Button";
import "./SpinningWheel.css";
import GitCard from "./GitCard";

/** Base roster (was INITIAL_ITEMS) */
const BASE_ITEMS = [
  "Denis",
  "Jakob",
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

const SpinningWheel = () => {
  /** Persistable default roster used for resets */
  const [defaultItems, setDefaultItems] = useState(() => {
    const savedDefault = localStorage.getItem("defaultItems");
    return savedDefault ? JSON.parse(savedDefault) : BASE_ITEMS;
  });

  /** Wheel items (active this run) */
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("wheelItems");
    if (savedItems) return JSON.parse(savedItems);
    const savedDefault = localStorage.getItem("defaultItems");
    return savedDefault ? JSON.parse(savedDefault) : BASE_ITEMS;
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
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  const [startTime, setStartTime] = useState(null);

  /** Modal state */
  const [showResetModal, setShowResetModal] = useState(false);
  const [selection, setSelection] = useState(new Set(defaultItems));
  const [shooting, setShooting] = useState({ name: null, dir: null }); // {name, dir: 'right'|'left'}

  const wheelRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("wheelItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("defaultItems", JSON.stringify(defaultItems));
  }, [defaultItems]);

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
  }, [isTimerRunning, isOvertime, showDuration]);

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

  /** Open modal instead of immediate reset */
  const resetWheel = () => {
    setSelection(new Set(defaultItems));
    setShowResetModal(true);
  };

  const confirmResetSelection = () => {
    const selectedArray = Array.from(selection);
    if (selectedArray.length === 0) return;

    setDefaultItems(selectedArray);
    setItems(selectedArray);
    setSelectedItem("Spin the wheel!");
    setTimeRemaining(INITIAL_DURATION);
    setShowDuration(true);
    setIsTimerRunning(false);
    setOvertime(0);
    setIsOvertime(false);
    setShowResetModal(false);
  };

  const handlePick = (name, dir) => {
    // dir: 'right' adds to selection; 'left' removes
    setShooting({ name, dir });
    setTimeout(() => {
      setSelection((prev) => {
        const next = new Set(prev);
        if (dir === "right") next.add(name);
        else next.delete(name);
        return next;
      });
      setShooting({ name: null, dir: null });
    }, 300); // match CSS animation duration
  };

  const endDaily = () => {
    // Calculate how much time was used (15 minutes minus remaining time)
    const duration = INITIAL_DURATION - timeRemaining;
    const totalDuration = duration + overtime;

    if (duration >= MIN_DURATION) {
      const today = new Date().toISOString().split("T")[0];
      const newStat = {
        totalDuration: totalDuration,
        overtime: overtime,
        last: selectedItem,
        participants: defaultItems.length,
      };

      setDailyStats((prevStats) => ({
        ...prevStats,
        [today]: newStat,
      }));

      console.log("Daily Statistics:", { ...dailyStats, [today]: newStat });
    } else {
      console.log(
        "Daily duration was less than 5 minutes. Statistics not saved."
      );
    }

    setTimeRemaining(INITIAL_DURATION);
    setIsTimerRunning(false);
    setShowDuration(false);
    setSelectedItem(null);

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

  /** Derived lists for modal columns */
  const allPool = BASE_ITEMS; // what you said should be choosable
  const selectedList = Array.from(selection);
  const availableList = allPool.filter((n) => !selection.has(n));

  return (
    <>
      <div className="spinning-wheel-container">
        <h1 className="header">Spinning Wheel of Dailies</h1>
        {isOvertime && (
          <div className="overtime-display">
            Overtime: {formatDuration(overtime)}
          </div>
        )}
        {showDuration && (
          <div
            className={`duration-display ${
              timeRemaining <= 0
                ? "red finished" + (overtime >= 60000 ? " fade-out" : "")
                : timeRemaining <= 5 * 60 * 1000
                ? "red"
                : timeRemaining <= 10 * 60 * 1000
                ? "orange"
                : "green"
            }`}
          >
            {formatDuration(timeRemaining)}
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
          {isTimerRunning ? (
            <>
              Du bist dran:{" "}
              <span
                className={`result-text ${
                  items.length === 0 ? "daily-over" : ""
                }`}
              >
                {isSpinning
                  ? "Spinning..."
                  : items.length === 0
                  ? "Daily is over :)"
                  : selectedItem || "Spin the wheel!"}
              </span>
            </>
          ) : (
            <span
              className={`result-text ${
                items.length === 0 ? "daily-over" : ""
              }`}
            >
              {isSpinning
                ? "Spinning..."
                : items.length === 0
                ? "Daily is over :)"
                : selectedItem || "Spin the wheel!"}
            </span>
          )}
        </div>
        <div className="button-container">
          <Button
            onClick={items.length === 1 ? endDaily : spinWheel}
            disabled={isSpinning || items.length === 0}
            className="spin-button"
            icon={
              items.length === 1
                ? ArrowBigDown
                : isTimerRunning
                ? RotateCw
                : ArrowRight
            }
          >
            {items.length === 1 ? "End the daily" : "Turn the wheel!"}
          </Button>
          <DeleteButton
            onClick={removeItem}
            disabled={!selectedItem || autoRemove || items.length === 0}
            className="remove-button"
            icon={Trash2}
          ></DeleteButton>
        </div>

        {/* Reset button – unchanged visibility (only when empty) */}
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

      {/* Reset modal */}
      {showResetModal && (
        <div
          className="reset-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("reset-modal-overlay")) {
              setShowResetModal(false);
            }
          }}
        >
          <div className="reset-modal">
            <div className="reset-modal-header">
              <h2>Choose participants</h2>
              <span className="reset-subtitle">
                Click a name to shoot it across ⚡
              </span>
            </div>

            <div className="reset-columns">
              <div className="reset-col">
                <div className="col-title">Roster</div>
                <div className="pill-list">
                  {availableList.map((n) => (
                    <button
                      key={`avail-${n}`}
                      className={
                        "item-pill " +
                        (shooting.name === n && shooting.dir === "right"
                          ? "shoot-right"
                          : "")
                      }
                      onClick={() => handlePick(n, "right")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="reset-col target">
                <div className="col-title">Selected</div>
                <div className="pill-list">
                  {selectedList.map((n) => (
                    <button
                      key={`sel-${n}`}
                      className={
                        "item-pill selected " +
                        (shooting.name === n && shooting.dir === "left"
                          ? "shoot-left"
                          : "")
                      }
                      onClick={() => handlePick(n, "left")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn ghost"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={confirmResetSelection}
                disabled={selection.size === 0}
              >
                Use {selection.size} item{selection.size === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>Wheel of Dailies v1.7</footer>
    </>
  );
};

export default SpinningWheel;
