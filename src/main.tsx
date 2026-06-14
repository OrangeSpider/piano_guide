import { Midi } from "@tonejs/midi";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  ChevronLeft,
  ChevronRight,
  FileMusic,
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
type NoteHand = "left" | "right";

type PianoNote = {
  duration: number;
  hand: NoteHand;
  midi: number;
  start: number;
  trackName: string;
};

type Song = {
  beatsPerMeasure: number;
  duration: number;
  measures: number;
  name: string;
  notes: PianoNote[];
  tempo: number;
  tracks: number;
};

const keyboardStart = 21;
const keyboardEnd = 108;
const samplePath = "/samples/Ungarische.mid";

function isBlackKey(midi: number) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

function noteName(midi: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseMidi(buffer: ArrayBuffer, fileName: string): Song {
  const midi = new Midi(buffer);
  const firstTempo = midi.header.tempos[0]?.bpm ?? 100;
  const firstSignature = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4];
  const beatsPerMeasure = firstSignature[0] * (4 / firstSignature[1]);
  const tracksWithNotes = midi.tracks.filter((track) => track.notes.length > 0);
  const trackAveragePitch = tracksWithNotes.map((track) => {
    const pitchSum = track.notes.reduce((sum, note) => sum + note.midi, 0);

    return pitchSum / track.notes.length;
  });
  const splitPitch =
    trackAveragePitch.length > 1
      ? (Math.min(...trackAveragePitch) + Math.max(...trackAveragePitch)) / 2
      : 60;

  const notes = tracksWithNotes
    .flatMap((track, trackIndex) => {
      const trackName = track.name || `Spur ${trackIndex + 1}`;
      const trackHand: NoteHand = trackAveragePitch[trackIndex] <= splitPitch ? "left" : "right";

      return track.notes.map((note) => ({
        duration: Math.max(note.duration, 0.05),
        hand: tracksWithNotes.length > 1 ? trackHand : ((note.midi < 60 ? "left" : "right") satisfies NoteHand),
        midi: note.midi,
        start: note.time,
        trackName,
      }));
    })
    .sort((left, right) => left.start - right.start);

  const duration = Math.max(midi.duration, ...notes.map((note) => note.start + note.duration), 1);
  const secondsPerMeasure = (60 / firstTempo) * beatsPerMeasure;

  return {
    beatsPerMeasure,
    duration,
    measures: Math.max(1, Math.ceil(duration / secondsPerMeasure)),
    name: fileName,
    notes,
    tempo: Math.round(firstTempo),
    tracks: tracksWithNotes.length,
  };
}

function measureToTime(measure: number, song: Song) {
  return (measure - 1) * (60 / song.tempo) * song.beatsPerMeasure;
}

function App() {
  const [song, setSong] = React.useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [tempo, setTempo] = React.useState(76);
  const [fromBar, setFromBar] = React.useState(1);
  const [toBar, setToBar] = React.useState(4);
  const [loop, setLoop] = React.useState(true);
  const [handMode, setHandMode] = React.useState<HandMode>("both");
  const [currentTime, setCurrentTime] = React.useState(0);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadMidi = React.useCallback(async (buffer: ArrayBuffer, fileName: string) => {
    try {
      const parsedSong = parseMidi(buffer, fileName);

      setSong(parsedSong);
      setTempo(parsedSong.tempo);
      setFromBar(1);
      setToBar(Math.min(parsedSong.measures, 4));
      setCurrentTime(0);
      setIsPlaying(false);
      setLoadError(null);
    } catch {
      setLoadError("Die MIDI-Datei konnte nicht gelesen werden.");
    }
  }, []);

  React.useEffect(() => {
    fetch(samplePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Sample not found");
        }

        return response.arrayBuffer();
      })
      .then((buffer) => loadMidi(buffer, "Ungarische.mid"))
      .catch(() => setLoadError("Das Demo-MIDI konnte nicht geladen werden."));
  }, [loadMidi]);

  const loopStart = song ? measureToTime(fromBar, song) : 0;
  const loopEnd = song ? measureToTime(toBar + 1, song) : 0;
  const practiceStart = song ? measureToTime(fromBar, song) : 0;
  const practiceEnd = song ? measureToTime(toBar + 1, song) : 1;
  const practiceDuration = Math.max(practiceEnd - practiceStart, 1);

  React.useEffect(() => {
    if (!isPlaying || !song) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrentTime((current) => {
        const next = current + 0.05 * (tempo / song.tempo);
        const end = loop ? loopEnd : song.duration;

        if (next >= end) {
          if (!loop) {
            window.setTimeout(() => setIsPlaying(false), 0);
          }

          return loop ? loopStart : song.duration;
        }

        return next;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [isPlaying, loop, loopEnd, loopStart, song, tempo]);

  React.useEffect(() => {
    if (!song) {
      return;
    }

    setFromBar((bar) => clamp(bar, 1, song.measures));
    setToBar((bar) => clamp(Math.max(bar, fromBar), 1, song.measures));
  }, [fromBar, song]);

  const visibleNotes =
    song?.notes.filter((note) => {
      const handMatches =
        handMode === "both" ||
        (handMode === "left" && note.hand === "left") ||
        (handMode === "right" && note.hand === "right");

      return handMatches && note.start + note.duration >= practiceStart - 1 && note.start <= practiceEnd + 1;
    }) ?? [];
  const activeNotes = visibleNotes.filter((note) => currentTime >= note.start && currentTime <= note.start + note.duration);
  const activeMidiNotes = new Set(activeNotes.map((note) => note.midi));
  const rulerBars = Array.from({ length: song?.measures ?? 12 }, (_, index) => index + 1).slice(0, 48);
  const playheadLeft = song ? clamp(((currentTime - practiceStart) / practiceDuration) * 100, 0, 100) : 0;
  const whiteKeys = Array.from({ length: keyboardEnd - keyboardStart + 1 }, (_, index) => keyboardStart + index).filter(
    (midi) => !isBlackKey(midi),
  );
  const allKeys = Array.from({ length: keyboardEnd - keyboardStart + 1 }, (_, index) => keyboardStart + index);

  function handlePlayPause() {
    if (!song) {
      return;
    }

    if (!isPlaying && (currentTime < loopStart || currentTime >= loopEnd)) {
      setCurrentTime(loopStart);
    }

    setIsPlaying((value) => !value);
  }

  function handleStop() {
    setIsPlaying(false);
    setCurrentTime(loopStart);
  }

  function jumpMeasure(direction: -1 | 1) {
    if (!song) {
      return;
    }

    const secondsPerMeasure = measureToTime(2, song);
    setCurrentTime((time) => clamp(time + secondsPerMeasure * direction, 0, song.duration));
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await loadMidi(await file.arrayBuffer(), file.name);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">PG</span>
          <div>
            <h1>Piano Guide</h1>
            <p>{song?.name ?? "MIDI wird geladen"}</p>
          </div>
        </div>

        <div className="transport" aria-label="Transport">
          <button className="icon-button" disabled={!song} onClick={handlePlayPause} title="Start/Pause">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="icon-button" disabled={!song} onClick={handleStop} title="Stop">
            <Square size={18} />
          </button>
          <button className="icon-button" disabled={!song} onClick={() => jumpMeasure(-1)} title="Takt zurueck">
            <ChevronLeft size={20} />
          </button>
          <button className="icon-button" disabled={!song} onClick={() => jumpMeasure(1)} title="Takt vor">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="control-panel" aria-label="Uebeinstellungen">
          <label className="file-button">
            <Upload size={18} />
            MIDI waehlen
            <input type="file" accept=".mid,.midi,audio/midi" onChange={handleFileChange} />
          </label>

          {loadError && <div className="error-message">{loadError}</div>}

          <div className="song-facts">
            <span>
              <FileMusic size={16} />
              {song ? `${song.notes.length} Noten` : "Keine Noten geladen"}
            </span>
            <span>{song ? `${song.tracks} Spuren` : "0 Spuren"}</span>
            <span>{song ? `${song.measures} Takte` : "0 Takte"}</span>
          </div>

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
              <input
                min="1"
                max={song?.measures ?? 1}
                type="number"
                value={fromBar}
                onChange={(event) => setFromBar(clamp(Number(event.target.value), 1, song?.measures ?? 1))}
              />
            </label>
            <label>
              Bis Takt
              <input
                min={fromBar}
                max={song?.measures ?? fromBar}
                type="number"
                value={toBar}
                onChange={(event) => setToBar(clamp(Number(event.target.value), fromBar, song?.measures ?? fromBar))}
              />
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
          <div className="measure-ruler" style={{ gridTemplateColumns: `repeat(${rulerBars.length}, minmax(42px, 1fr))` }}>
            {rulerBars.map((bar) => (
              <button
                key={bar}
                className={bar >= fromBar && bar <= toBar ? "loop-bar" : ""}
                onClick={() => {
                  setFromBar(bar);
                  setToBar(Math.min(song?.measures ?? bar, Math.max(bar, bar + 3)));
                  if (song) {
                    setCurrentTime(measureToTime(bar, song));
                  }
                }}
              >
                {bar}
              </button>
            ))}
            <div className="playhead" style={{ left: `${playheadLeft}%` }} />
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
              {visibleNotes.slice(0, 180).map((note, index) => (
                <span
                  key={`${note.midi}-${note.start}-${index}`}
                  className={`sheet-note ${note.hand} ${activeMidiNotes.has(note.midi) ? "active" : ""}`}
                  title={`${noteName(note.midi)} ${note.trackName}`}
                  style={{
                    left: `${clamp(((note.start - practiceStart) / practiceDuration) * 100, 2, 96)}%`,
                    top: `${note.hand === "left" ? 64 - (note.midi - 40) * 0.25 : 34 - (note.midi - 70) * 0.25}%`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="falling-notes">
            {visibleNotes.slice(0, 220).map((note, index) => (
              <span
                key={`${note.midi}-fall-${note.start}-${index}`}
                className={`fall-note ${note.hand} ${activeMidiNotes.has(note.midi) ? "active" : ""}`}
                title={noteName(note.midi)}
                style={{
                  left: `${((note.midi - keyboardStart) / (keyboardEnd - keyboardStart)) * 100}%`,
                  height: `${clamp(24 + note.duration * 32, 18, 120)}px`,
                  transform: `translateY(${(note.start - currentTime) * 70 + 120}px)`,
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
        <span>{song ? `${currentTime.toFixed(1)}s / ${song.duration.toFixed(1)}s` : "0.0s"}</span>
      </footer>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
