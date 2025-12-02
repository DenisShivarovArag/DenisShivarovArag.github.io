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

  const [prodControlAssignment, setProdControlAssignment] = useState(() => {
    return localStorage.getItem("prodControlAssignment") || null;
  });

  const [lastWeekStart, setLastWeekStart] = useState(() => {
    const saved = localStorage.getItem("lastWeekStart");
    return saved ? new Date(saved) : null;
  });

  const [prodControlStatus, setProdControlStatus] = useState(() => {
    const saved = localStorage.getItem("prodControlStatus");
    return saved ? JSON.parse(saved) : null; // true=good, false=bad, null=not checked
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
  const [shooting, setShooting] = useState({ name: null, dir: null }); // 'right'|'left'|'down'|'up'
  const [showProdControlModal, setShowProdControlModal] = useState(false);
  const [showProdProblemsModal, setShowProdProblemsModal] = useState(false);

  /** NEW: Iskender Kebab Club state (per-session placement) */
  const [kebabSet, setKebabSet] = useState(new Set());

  /** NEW: Persistent counters for Kebab Club + Döner tally */
  const [kebabCounters, setKebabCounters] = useState(() => {
    const raw = localStorage.getItem("kebabCounters");
    return raw ? JSON.parse(raw) : {};
  });
  const [donerCounts, setDonerCounts] = useState(() => {
    const raw = localStorage.getItem("donerCounts");
    return raw ? JSON.parse(raw) : {};
  });

  // Add state for the weekly PROD‑Control assignments and the calendar visibility ──
  const [weeklyProdAssignments, setWeeklyProdAssignments] = useState(() => {
    const raw = localStorage.getItem("weeklyProdAssignments");
    return raw ? JSON.parse(raw) : {};
  });
  const [showProdCalendar, setShowProdCalendar] = useState(false);

  // Helper: Monday 00:00:00 local time (week start used everywhere) ──
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // days to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  // Helper: produce a YYYY‑MM‑DD key from a date
  const getWeekKey = (date) => getMonday(date).toLocaleDateString("de-DE");

  // Helper function to get ISO week number
  const getWeekNumber = (date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return String(weekNumber).padStart(2, "0");
  };

  const weekNumber = getWeekNumber(new Date());

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

  // Persist new kebab + döner state
  useEffect(() => {
    localStorage.setItem("kebabCounters", JSON.stringify(kebabCounters));
  }, [kebabCounters]);

  useEffect(() => {
    localStorage.setItem("donerCounts", JSON.stringify(donerCounts));
  }, [donerCounts]);

  // Call on mount and when reset modal opens
  useEffect(() => {
    checkWeeklyReset();
  }, []);

  useEffect(() => {
    localStorage.setItem("prodControlAssignment", prodControlAssignment || "");
  }, [prodControlAssignment]);

  useEffect(() => {
    localStorage.setItem(
      "lastWeekStart",
      lastWeekStart ? lastWeekStart.toISOString() : ""
    );
  }, [lastWeekStart]);

  useEffect(() => {
    localStorage.setItem(
      "prodControlStatus",
      JSON.stringify(prodControlStatus)
    );
  }, [prodControlStatus]);

  // Persist the weekly map whenever it changes ──
  useEffect(() => {
    localStorage.setItem(
      "weeklyProdAssignments",
      JSON.stringify(weeklyProdAssignments)
    );
  }, [weeklyProdAssignments]);

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

      // Show PROD Control check if selected participant is assigned
      if (selected === prodControlAssignment) {
        setShowProdControlModal(true);
      }

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
    checkWeeklyReset(); // Ensure weekly reset is applied
    setSelection(new Set(defaultItems));
    setKebabSet(new Set());
    setShowResetModal(true);
  };

  /** NEW: move helpers with tiny “shoot” animations */
  const moveWithAnimation = (name, dir, fn) => {
    setShooting({ name, dir });
    setTimeout(() => {
      fn();
      setShooting({ name: null, dir: null });
    }, 300);
  };

  const moveToSelected = (name) =>
    moveWithAnimation(name, "right", () =>
      setSelection((prev) => new Set(prev).add(name))
    );

  const removeFromSelected = (name) =>
    moveWithAnimation(name, "left", () =>
      setSelection((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      })
    );

  const moveToKebabFromRoster = (name) =>
    moveWithAnimation(name, "down", () => {
      setKebabSet((prev) => new Set(prev).add(name));
      setSelection((prev) => {
        const next = new Set(prev);
        next.delete(name); // ensure not also “Selected”
        return next;
      });
    });

  const moveToKebabFromSelected = (name) =>
    moveWithAnimation(name, "down", () => {
      setSelection((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
      setKebabSet((prev) => new Set(prev).add(name));
    });

  const removeFromKebab = (name) =>
    moveWithAnimation(name, "up", () =>
      setKebabSet((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      })
    );

  const confirmResetSelection = () => {
    const selectedArray = Array.from(selection);
    if (selectedArray.length === 0) return;

    /** Increment Iskender Kebab Club counters */
    if (kebabSet.size > 0) {
      const nextCounters = { ...kebabCounters };
      const nextDoners = { ...donerCounts };
      Array.from(kebabSet).forEach((name) => {
        const current = (nextCounters[name] || 0) + 1;
        if (current >= 10) {
          nextCounters[name] = 0;
          nextDoners[name] = (nextDoners[name] || 0) + 1;
        } else {
          nextCounters[name] = current;
        }
      });
      setKebabCounters(nextCounters);
      setDonerCounts(nextDoners);
    }

    // persist the PROD‑Control person for this week
    if (prodControlAssignment) {
      const weekKey = getWeekKey(new Date());
      setWeeklyProdAssignments((prev) => ({
        ...prev,
        [weekKey]: prodControlAssignment,
      }));
    }

    setDefaultItems(selectedArray);
    setItems(selectedArray);
    setSelectedItem("Spin the wheel!");
    setTimeRemaining(INITIAL_DURATION);
    setShowDuration(true);
    setIsTimerRunning(false);
    setOvertime(0);
    setIsOvertime(false);
    setKebabSet(new Set());
    setShowResetModal(false);
  };

  // Weekly reset check function
  const checkWeeklyReset = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const diffToMonday = (dayOfWeek + 6) % 7; // Days since Monday
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - diffToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    if (
      !lastWeekStart ||
      new Date(lastWeekStart).getTime() !== currentWeekStart.getTime()
    ) {
      setProdControlAssignment(null);
      setProdControlStatus(null);
      setLastWeekStart(currentWeekStart);
    }
  };

  const endDaily = () => {
    // Show PROD PROBLEME popup if control didn't go well
    if (prodControlStatus === false) {
      setShowProdProblemsModal(true);
      setProdControlStatus(null); // Reset status after showing
    }

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
  const allPool = BASE_ITEMS;
  const selectedList = Array.from(selection);
  const kebabList = Array.from(kebabSet);
  const availableList = allPool.filter(
    (n) => !selection.has(n) && !kebabSet.has(n)
  );

  /** Döner reset button */
  const clearDonerDebt = () => {
    // Reset only the Döner “debt” counts (keep counters)
    const cleared = {};
    Object.keys(donerCounts).forEach((k) => (cleared[k] = 0));
    setDonerCounts(cleared);
  };

  const hasAnyDoner = Object.values(donerCounts).some((v) => (v || 0) > 0);

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

        {/* NEW: Döner table (under Show Duration) */}
        {hasAnyDoner && (
          <div className="doner-table-wrap">
            <h3 className="doner-title">Iskender Kebab Club</h3>
            <table className="doner-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dönneranzahl</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(donerCounts)
                  .filter(([, c]) => (c || 0) > 0)
                  .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                  .map(([name, count]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td aria-label={`${count} Döner`}>
                        {"🥙".repeat(count || 0)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <button className="btn ghost small" onClick={clearDonerDebt}>
              Dönnerschulden abbezahlt
            </button>
          </div>
        )}
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
                Click to move between columns • <b>Shift-click</b> in “Roster”
                or “Selected” to send to <b>Iskender Kebab Club</b> • Counters
                increment when you press <b>Use</b>.
              </span>
            </div>

            <div className="reset-columns">
              {/* ROSTER */}
              <div className="reset-col">
                <div className="col-title">Roster</div>
                <div className="pill-list">
                  {availableList.map((n) => (
                    <button
                      key={`avail-${n}`}
                      className={
                        "item-pill selected " +
                        (prodControlAssignment === n ? "prod-control " : "") +
                        (shooting.name === n &&
                        (shooting.dir === "right" || shooting.dir === "down")
                          ? shooting.dir === "right"
                            ? "shoot-right"
                            : "shoot-down"
                          : "")
                      }
                      onClick={(e) => {
                        if (e.ctrlKey) {
                          // Toggle PROD Control assignment
                          setProdControlAssignment(
                            prodControlAssignment === n ? null : n
                          );
                          return; // Prevent other click behaviors
                        }
                        e.shiftKey
                          ? moveToKebabFromSelected(n)
                          : moveToSelected(n);
                      }}
                      title="Ctrl+Click: assign PROD Control • Click: send back to Roster • Shift+Click: send to Iskender Kebab Club"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* SELECTED */}
              <div className="reset-col target">
                <div className="col-title">Selected</div>
                <div className="pill-list">
                  {selectedList.map((n) => (
                    <button
                      key={`sel-${n}`}
                      className={
                        "item-pill selected " +
                        (prodControlAssignment === n ? "prod-control " : "") + // ← KEEP THIS
                        (shooting.name === n &&
                        (shooting.dir === "left" || shooting.dir === "down")
                          ? shooting.dir === "left"
                            ? "shoot-left"
                            : "shoot-down"
                          : "")
                      }
                      onClick={(e) => {
                        if (e.ctrlKey) {
                          // ← ADD CTRL-HANDLER
                          setProdControlAssignment(
                            prodControlAssignment === n ? null : n
                          );
                          return;
                        }
                        e.shiftKey
                          ? moveToKebabFromSelected(n)
                          : removeFromSelected(n);
                      }}
                      title="Ctrl+Click: assign PROD Control • Click: send back to Roster • Shift+Click: send to Kebab Club"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* NEW: ISKENDER KEBAB CLUB */}
              <div className="reset-col kebab">
                <div className="col-title">Iskender Kebab Club</div>
                <div className="pill-list">
                  {kebabList.map((n) => {
                    const count = kebabCounters[n] || 0;
                    return (
                      <button
                        key={`kebab-${n}`}
                        className={
                          "item-pill kebab-pill " +
                          (prodControlAssignment === n ? "prod-control " : "") + // ← ADD THIS
                          (shooting.name === n && shooting.dir === "up"
                            ? "shoot-up"
                            : "")
                        }
                        onClick={(e) => {
                          if (e.ctrlKey) {
                            // ← ADD CTRL-HANDLER
                            setProdControlAssignment(
                              prodControlAssignment === n ? null : n
                            );
                            return;
                          }
                          removeFromKebab(n);
                        }}
                        title="Ctrl+Click: assign PROD Control • Click: remove from Kebab Club"
                      >
                        <span className="counter-badge">{count}/10</span>
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              {/* Bottom‑left button that opens the calendar */}
              <button
                className="btn ghost small"
                style={{ marginRight: "auto" }}
                onClick={() => setShowProdCalendar(true)}
              >
                PROD Calendar
              </button>

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
      {showProdControlModal && (
        <div
          className="reset-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("reset-modal-overlay")) {
              setShowProdControlModal(false);
            }
          }}
        >
          <div className="prod-modal">
            <h3>PROD Kontrolle gut gelaufen?</h3>
            <div className="prod-modal-buttons">
              <button
                className="yes-btn"
                onClick={() => {
                  setProdControlStatus(true);
                  setShowProdControlModal(false);
                }}
              >
                ✓ Ja
              </button>
              <button
                className="no-btn"
                onClick={() => {
                  setProdControlStatus(false);
                  setShowProdControlModal(false);
                }}
              >
                ✗ Nein
              </button>
            </div>
          </div>
        </div>
      )}

      {showProdProblemsModal && (
        <div
          className="reset-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("reset-modal-overlay")) {
              setShowProdProblemsModal(false);
            }
          }}
        >
          <div className="prod-modal">
            <h3>PROD PROBLEME</h3>
            <p style={{ margin: "20px 0" }}>
              Es gab Probleme mit der PROD Kontrolle!
            </p>
            <button
              className="btn primary"
              onClick={() => setShowProdProblemsModal(false)}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {showProdCalendar && (
        <div
          className="reset-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("reset-modal-overlay")) {
              setShowProdCalendar(false);
            }
          }}
        >
          <div className="reset-modal" style={{ maxWidth: 600 }}>
            <div className="reset-modal-header">
              <h2>PROD Control Calendar</h2>
            </div>
            <div className="doner-table-wrap">
              <table className="doner-table">
                <thead>
                  <tr>
                    <th>Week (Monday)</th>
                    <th>PROD Control</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(weeklyProdAssignments).length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        style={{ textAlign: "center", color: "#999" }}
                      >
                        No assignments yet
                      </td>
                    </tr>
                  )}
                  {Object.entries(weeklyProdAssignments)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .map(([weekKey, name]) => (
                      <tr key={weekKey}>
                        <td>
                          {weekKey} (KW{weekNumber})
                        </td>
                        <td>
                          <span
                            className="item-pill prod-control"
                            style={{ cursor: "default", fontSize: "0.9rem" }}
                          >
                            {name}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button
                className="btn ghost"
                onClick={() => setShowProdCalendar(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>Wheel of Dailies v3.0</footer>
    </>
  );
};

export default SpinningWheel;
