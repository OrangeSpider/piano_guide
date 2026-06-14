import React from "react";
import ReactDOM from "react-dom/client";
import {
  ChevronLeft,
  ChevronRight,
  Hand,
  Pause,
  Play,
  Repeat2,
  Square,
  Upload,
  Volume2,
} from "lucide-react";
import "./styles.css";

type HandMode = "both" | "left" | "right";

const keyboardStart = 21;
const keyboardEnd = 108;
const demoNotes = [
  { midi: 52, hand: "left", start: 0.6, duration: 1.3 },
  { midi: 55, hand: "left", start: 1.8, duration: 0.7 },
  { midi: 64, hand: "right", start: 1.1, duration: 0.5 },
  { midi: 67, hand: "right", start: 1.2, duration: 1.4 },
  { midi: 71, hand: "right", start: 1.2, duration: 1.4 },
  { midi: 74, hand: "right", start: 2.6, duration: 0.7 },
  { midi: 76, hand: "right", start: 3.0, duration: 0.7 },
];

function isBlackKey(midi: number) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

function noteName(midi: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}

function App() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [tempo, setTempo] = React.useState(76);
  const [fromBar, setFromBar] = React.useState(4);
  const [toBar, setToBar] = React.useState(8);
  const [loop, setLoop] = React.useState(true);
  const [handMode, setHandMode] = React.useState<HandMode>("both");
  const [progress, setProgress] = React.useState(0.38);

  React.useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = current + 0.006 * (tempo / 76);
        if (next > 1) {
          return loop ? 0.2 : 1;
        }

        return next;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [isPlaying, loop, tempo]);

  const visibleNotes = demoNotes.filter((note) => {
    const handMatches =
      handMode === "both" ||
      (handMode === "left" && note.hand === "left") ||
      (handMode === "right" && note.hand === "right");
    const cursorTime = progress * 4;

    return handMatches && cursorTime >= note.start && cursorTime <= note.start + note.duration;
  });

  const activeMidiNotes = new Set(visibleNotes.map((note) => note.midi));
  const whiteKeys = Array.from({ length: keyboardEnd - keyboardStart + 1 }, (_, index) => keyboardStart + index).filter(
    (midi) => !isBlackKey(midi),
  );
  const allKeys = Array.from({ length: keyboardEnd - keyboardStart + 1 }, (_, index) => keyboardStart + index);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">PG</span>
          <div>
            <h1>Piano Guide</h1>
            <p>Ungarische.mid</p>
          </div>
        </div>

        <div className="transport" aria-label="Transport">
          <button className="icon-button" onClick={() => setIsPlaying((value) => !value)} title="Start/Pause">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            className="icon-button"
            onClick={() => {
              setIsPlaying(false);
              setProgress(0.2);
            }}
            title="Stop"
          >
            <Square size={18} />
          </button>
          <button className="icon-button" onClick={() => setProgress((value) => Math.max(0, value - 0.06))} title="Takt zurueck">
            <ChevronLeft size={20} />
          </button>
          <button className="icon-button" onClick={() => setProgress((value) => Math.min(1, value + 0.06))} title="Takt vor">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="control-panel" aria-label="Uebeinstellungen">
          <label className="file-button">
            <Upload size={18} />
            MIDI waehlen
            <input type="file" accept=".mid,.midi" />
          </label>

          <div className="field">
            <span>Tempo</span>
            <div className="stepper">
              <button onClick={() => setTempo((value) => Math.max(20, value - 5))}>-</button>
              <strong>{tempo} BPM</strong>
              <button onClick={() => setTempo((value) => Math.min(220, value + 5))}>+</button>
            </div>
          </div>

          <div className="field two-columns">
            <label>
              Von Takt
              <input min="1" type="number" value={fromBar} onChange={(event) => setFromBar(Number(event.target.value))} />
            </label>
            <label>
              Bis Takt
              <input min={fromBar} type="number" value={toBar} onChange={(event) => setToBar(Number(event.target.value))} />
            </label>
          </div>

          <div className="field">
            <span>Hand</span>
            <div className="segmented">
              <button className={handMode === "left" ? "selected" : ""} onClick={() => setHandMode("left")}>
                Links
              </button>
              <button className={handMode === "both" ? "selected" : ""} onClick={() => setHandMode("both")}>
                Beide
              </button>
              <button className={handMode === "right" ? "selected" : ""} onClick={() => setHandMode("right")}>
                Rechts
              </button>
            </div>
          </div>

          <label className="toggle">
            <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
            <Repeat2 size={18} />
            Loop aktiv
          </label>

          <div className="voice-preview">
            <Volume2 size={18} />
            <span>Sprachbefehle folgen in Phase 6</span>
          </div>
        </aside>

        <section className="practice-view" aria-label="Uebebereich">
          <div className="measure-ruler">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((bar) => (
              <span key={bar} className={bar >= fromBar && bar <= toBar ? "loop-bar" : ""}>
                {bar}
              </span>
            ))}
            <div className="playhead" style={{ left: `${progress * 100}%` }} />
          </div>

          <div className="sheet-placeholder">
            <div className="staff">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="staff lower">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="note-row">
              {demoNotes.map((note, index) => (
                <span
                  key={`${note.midi}-${index}`}
                  className={`sheet-note ${note.hand} ${activeMidiNotes.has(note.midi) ? "active" : ""}`}
                  style={{ left: `${18 + note.start * 18}%`, top: `${note.hand === "left" ? 64 : 28}%` }}
                />
              ))}
            </div>
          </div>

          <div className="falling-notes">
            {demoNotes.map((note, index) => (
              <span
                key={`${note.midi}-fall-${index}`}
                className={`fall-note ${note.hand} ${activeMidiNotes.has(note.midi) ? "active" : ""}`}
                style={{
                  left: `${((note.midi - keyboardStart) / (keyboardEnd - keyboardStart)) * 100}%`,
                  height: `${40 + note.duration * 42}px`,
                  transform: `translateY(${progress * 130 - note.start * 35}px)`,
                }}
              />
            ))}
          </div>
        </section>
      </section>

      <section className="keyboard" aria-label="Virtuelle Klaviatur">
        <div className="white-keys">
          {whiteKeys.map((midi) => (
            <div key={midi} className={`white-key ${activeMidiNotes.has(midi) ? "active" : ""}`}>
              {noteName(midi).startsWith("C") && <span>{noteName(midi)}</span>}
            </div>
          ))}
        </div>
        <div className="black-keys">
          {allKeys.map((midi) =>
            isBlackKey(midi) ? (
              <div
                key={midi}
                className={`black-key ${activeMidiNotes.has(midi) ? "active" : ""}`}
                style={{ left: `${((midi - keyboardStart) / (keyboardEnd - keyboardStart + 1)) * 100}%` }}
              />
            ) : null,
          )}
        </div>
      </section>

      <footer className="statusbar">
        <span>
          <Hand size={16} />
          Modus: {handMode === "both" ? "beide Haende" : handMode === "left" ? "linke Hand" : "rechte Hand"}
        </span>
        <span>
          Takte {fromBar}-{toBar}
        </span>
      </footer>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
