import React, { useState, useRef, useEffect } from "react";
import { ArrowBigDown, ArrowRight, RotateCcw, Trash2 } from "lucide-react";
import Button from "./Button";
import "./SpinningWheel.css";

const INITIAL_ITEMS = ["Denis", "Frank"];

const INITIAL_DURATION = 0.15 * 60 * 1000;
const MIN_DURATION = 300000;

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
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

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

  const resetWheel = () => {
    setItems(INITIAL_ITEMS);
    setSelectedItem("Spin the wheel!");
    setTimeRemaining(INITIAL_DURATION);
    setShowDuration(true);
    setIsTimerRunning(false);
    setOvertime(0);
    setIsOvertime(false);
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
        participants: INITIAL_ITEMS.length,
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

  const kiplingPoem = (
    <p>
      If you can <span>keep</span> your head when all about you Are{" "}
      <span>losing</span> theirs and <span>blaming</span> it on you; If you can{" "}
      <span>trust</span> yourself when all men <span>doubt</span> you, But make{" "}
      <span>allowance</span> for their doubting too; If you can{" "}
      <span>wait</span> and not be tired by waiting, Or, being <span>lied</span>{" "}
      about, don't deal in <span>lies</span>, Or, being <span>hated</span>,
      don't give way to <span>hating</span>, And yet don't look too good, nor
      talk too wise; If you can <span>dream</span>—and not make dreams your{" "}
      <span>master</span>; If you can <span>think</span>—and not make thoughts
      your <span>aim</span>; If you can meet with <span>triumph</span> and{" "}
      <span>disaster</span>
      And treat those two <span>impostors</span> just the same; If you can bear
      to hear the <span>truth</span> you've spoken
      <span>Twisted</span> by knaves to make a <span>trap</span> for fools, Or
      watch the things you gave your life to <span>broken</span>, And{" "}
      <span>stoop</span> and build 'em up with wornout tools; If you can make
      one <span>heap</span> of all your <span>winnings</span>
      And <span>risk</span> it on one turn of pitch-and-toss, And{" "}
      <span>lose</span>, and start again at your beginnings And never breathe a
      word about your <span>loss</span>; If you can <span>force</span> your
      heart and nerve and <span>sinew</span>
      To <span>serve</span> your turn long after they are gone, And so{" "}
      <span>hold on</span> when there is nothing in you Except the{" "}
      <span>Will</span> which says to them: "Hold on"; If you can{" "}
      <span>talk</span> with crowds and keep your <span>virtue</span>, Or{" "}
      <span>walk</span> with kings—nor lose the common <span>touch</span>; If
      neither <span>foes</span> nor loving friends can hurt you; If all men{" "}
      <span>count</span> with you, but none too much; If you can fill the
      unforgiving <span>minute</span>
      With sixty seconds' worth of distance <span>run</span>— Yours is the{" "}
      <span>Earth</span> and everything that's in it, And—which is more—you'll
      be a <span>Man</span>, my son! -Rudyard Kipling
    </p>
  );

  useEffect(() => {
    const adjustContentSize = () => {
      const contentDiv = document.querySelector(".content");
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const baseWidth = 1000;
      const baseHeight = 562;
      const scaleX = viewportWidth / baseWidth;
      const scaleY = viewportHeight / baseHeight;
      const scaleFactor = Math.min(scaleX, scaleY);

      if (contentDiv) {
        contentDiv.style.transform = `scale(${scaleFactor})`;
      }
    };

    window.addEventListener("resize", adjustContentSize);
    adjustContentSize();

    return () => window.removeEventListener("resize", adjustContentSize);
  }, []);

  return (
    <div className="main-container">
      <div className="virtual-room">
        <div className="content">
          <div className="container-full">
            <div className="animated hue"></div>
            <img
              className="backgroundImage"
              src="https://drive.google.com/thumbnail?id=1_ZMV_LcmUXLsRokuz6WXGyN9zVCGfAHp&sz=w1920"
              alt="background"
            />
            <div className="container">
              <div className="cube">
                <div className="face top"></div>
                <div className="face bottom"></div>
                <div className="face left text">{kiplingPoem}</div>
                <div className="face right text">{kiplingPoem}</div>
                <div className="face front"></div>
                <div className="face back text">{kiplingPoem}</div>
              </div>
            </div>
            <div className="container-reflect">
              <div className="cube">
                <div className="face top"></div>
                <div className="face bottom"></div>
                <div className="face left text">{kiplingPoem}</div>
                <div className="face right text">{kiplingPoem}</div>
                <div className="face front"></div>
                <div className="face back text">{kiplingPoem}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="spinning-wheel-overlay">
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
        <footer>Wheel of Dailies v1.6</footer>
      </div>
    </div>
  );
};

export default SpinningWheel;
