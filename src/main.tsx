import { Midi } from "@tonejs/midi";
import React from "react";
import ReactDOM from "react-dom/client";
import * as Tone from "tone";
import {
  ChevronLeft,
  ChevronRight,
  FileMusic,
  Hand,
  Mic,
  MicOff,
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
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
};
type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};
type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};
type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};
type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type PianoNote = {
  duration: number;
  hand: NoteHand;
  id: string;
  midi: number;
  start: number;
  trackName: string;
  velocity: number;
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

type PracticeSettings = {
  currentTime: number;
  fromBar: number;
  handMode: HandMode;
  loop: boolean;
  tempo: number;
  toBar: number;
  updatedAt: number;
};

type BeamGroup = {
  flags: number;
  hand: NoteHand;
  ids: string[];
  left: number;
  stemOffset: number;
  top: string;
  width: string;
};

const keyboardStart = 21;
const keyboardEnd = 108;
const pianoSampleBaseUrl = "/audio/piano/";
const pianoSampleUrls = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "D#1": "Ds1.mp3",
  "F#1": "Fs1.mp3",
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
  C7: "C7.mp3",
  "D#7": "Ds7.mp3",
  "F#7": "Fs7.mp3",
  A7: "A7.mp3",
  C8: "C8.mp3",
} as const;
const practiceStoragePrefix = "piano-guide:practice:";
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

      return track.notes.map((note, noteIndex) => ({
        duration: Math.max(note.duration, 0.05),
        hand: tracksWithNotes.length > 1 ? trackHand : ((note.midi < 60 ? "left" : "right") satisfies NoteHand),
        id: `${trackIndex}-${noteIndex}-${note.midi}-${note.time}`,
        midi: note.midi,
        start: note.time,
        trackName,
        velocity: clamp(note.velocity, 0.2, 1),
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

function timeToMeasure(time: number, song: Song) {
  const secondsPerMeasure = (60 / song.tempo) * song.beatsPerMeasure;

  return clamp(Math.floor(time / secondsPerMeasure) + 1, 1, song.measures);
}

function barLabel(bar: number) {
  return `Takt ${bar}`;
}

function midiToToneNote(midi: number) {
  return Tone.Frequency(midi, "midi").toNote();
}

function noteDurationInBeats(note: PianoNote, song: Song) {
  return (note.duration * song.tempo) / 60;
}

function noteDurationClass(durationInBeats: number) {
  if (durationInBeats >= 3.5) {
    return "whole";
  }

  if (durationInBeats >= 1.75) {
    return "half";
  }

  if (durationInBeats >= 0.875) {
    return "quarter";
  }

  if (durationInBeats >= 0.4375) {
    return "eighth";
  }

  if (durationInBeats >= 0.1875) {
    return "sixteenth";
  }

  return "thirty-second";
}

function noteFlags(durationInBeats: number) {
  if (durationInBeats < 0.1875) {
    return 3;
  }

  if (durationInBeats < 0.4375) {
    return 2;
  }

  if (durationInBeats < 0.875) {
    return 1;
  }

  return 0;
}

function noteYPosition(note: PianoNote) {
  return note.hand === "left" ? 64 - (note.midi - 40) * 0.25 : 34 - (note.midi - 70) * 0.25;
}

function noteLeftPercent(note: PianoNote, viewStart: number, viewDuration: number) {
  return clamp(((note.start - viewStart) / viewDuration) * 100, 2, 96);
}

function noteWidthPixels(note: PianoNote, viewDuration: number) {
  return clamp(((note.duration / viewDuration) * 100) * 1.2, 18, 72);
}

function noteStemOffsetPixels(note: PianoNote) {
  return note.hand === "right" ? 15 : 2;
}

function measureIndexForTime(time: number, song: Song) {
  return Math.floor(time / ((60 / song.tempo) * song.beatsPerMeasure));
}

function buildBeamGroups(notes: PianoNote[], song: Song, viewStart: number, viewDuration: number) {
  const shortNotes = notes
    .map((note) => ({
      flags: noteFlags(noteDurationInBeats(note, song)),
      measureIndex: measureIndexForTime(note.start, song),
      note,
    }))
    .filter(({ flags }) => flags > 0)
    .sort((left, right) => left.note.start - right.note.start || left.note.midi - right.note.midi);
  const groups: BeamGroup[] = [];
  let currentGroup: typeof shortNotes = [];

  function flushGroup() {
    if (currentGroup.length < 2) {
      currentGroup = [];
      return;
    }

    const firstNote = currentGroup[0].note;
    const lastNote = currentGroup[currentGroup.length - 1].note;
    const firstLeft = noteLeftPercent(firstNote, viewStart, viewDuration);
    const lastLeft = noteLeftPercent(lastNote, viewStart, viewDuration);
    const firstStemOffset = noteStemOffsetPixels(firstNote);
    const lastStemOffset = noteStemOffsetPixels(lastNote);
    const averageY =
      currentGroup.reduce((sum, { note }) => sum + noteYPosition(note), 0) / Math.max(1, currentGroup.length);

    groups.push({
      flags: Math.max(...currentGroup.map(({ flags }) => flags)),
      hand: firstNote.hand,
      ids: currentGroup.map(({ note }) => note.id),
      left: firstLeft,
      stemOffset: firstStemOffset,
      top:
        firstNote.hand === "left"
          ? `calc(${clamp(averageY, 12, 80)}% + 66px)`
          : `calc(${clamp(averageY, 12, 80)}% - 12px)`,
      width: `calc(${Math.max(2, lastLeft - firstLeft)}% + ${lastStemOffset - firstStemOffset}px)`,
    });
    currentGroup = [];
  }

  shortNotes.forEach((entry) => {
    const previous = currentGroup[currentGroup.length - 1];
    const startsNewGroup =
      previous &&
      (previous.note.hand !== entry.note.hand ||
        previous.measureIndex !== entry.measureIndex ||
        entry.note.start - previous.note.start > (60 / song.tempo) * 0.9);

    if (startsNewGroup) {
      flushGroup();
    }

    currentGroup.push(entry);
  });
  flushGroup();

  return groups;
}

function formatClockTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function formatSavedAt(timestamp: number) {
  return new Date(timestamp).toLocaleString("de-DE", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}

function getSpeechRecognitionConstructor() {
  const speechWindow = window as Window &
    typeof globalThis & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function normalizeVoiceCommand(command: string) {
  return command
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function songStorageKey(song: Song) {
  return `${practiceStoragePrefix}${song.name}:${song.notes.length}:${song.measures}:${song.tempo}`;
}

function sanitizeHandMode(value: unknown): HandMode {
  return value === "left" || value === "right" || value === "both" ? value : "both";
}

function readPracticeSettings(song: Song): PracticeSettings | null {
  try {
    const rawValue = window.localStorage.getItem(songStorageKey(song));

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PracticeSettings>;

    return {
      currentTime: typeof parsedValue.currentTime === "number" ? parsedValue.currentTime : 0,
      fromBar: typeof parsedValue.fromBar === "number" ? parsedValue.fromBar : 1,
      handMode: sanitizeHandMode(parsedValue.handMode),
      loop: typeof parsedValue.loop === "boolean" ? parsedValue.loop : true,
      tempo: typeof parsedValue.tempo === "number" ? parsedValue.tempo : song.tempo,
      toBar: typeof parsedValue.toBar === "number" ? parsedValue.toBar : Math.min(song.measures, 4),
      updatedAt: typeof parsedValue.updatedAt === "number" ? parsedValue.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function writePracticeSettings(song: Song, settings: PracticeSettings) {
  try {
    window.localStorage.setItem(songStorageKey(song), JSON.stringify(settings));
  } catch {
    // Local storage is optional; the app should still work without it.
  }
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
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [audioReady, setAudioReady] = React.useState(false);
  const [audioLoading, setAudioLoading] = React.useState(false);
  const [audioError, setAudioError] = React.useState<string | null>(null);
  const [manualSheetStart, setManualSheetStart] = React.useState<number | null>(null);
  const [voiceListening, setVoiceListening] = React.useState(false);
  const [voiceStatus, setVoiceStatus] = React.useState("Sprachsteuerung bereit");
  const sheetDragRef = React.useRef<{ startTime: number; startX: number; width: number } | null>(null);
  const recognitionRef = React.useRef<BrowserSpeechRecognition | null>(null);
  const samplerRef = React.useRef<Tone.Sampler | null>(null);
  const soundingNotesRef = React.useRef<Map<number, string>>(new Map());
  const speechSupported = typeof window !== "undefined" && getSpeechRecognitionConstructor() !== null;

  const loadMidi = React.useCallback(async (buffer: ArrayBuffer, fileName: string) => {
    try {
      const parsedSong = parseMidi(buffer, fileName);
      const savedSettings = readPracticeSettings(parsedSong);
      const nextFromBar = clamp(savedSettings?.fromBar ?? 1, 1, parsedSong.measures);
      const nextToBar = clamp(savedSettings?.toBar ?? Math.min(parsedSong.measures, 4), nextFromBar, parsedSong.measures);
      const nextCurrentTime = clamp(savedSettings?.currentTime ?? 0, 0, parsedSong.duration);

      setSong(parsedSong);
      setTempo(clamp(savedSettings?.tempo ?? parsedSong.tempo, 20, 220));
      setFromBar(nextFromBar);
      setToBar(nextToBar);
      setLoop(savedSettings?.loop ?? true);
      setHandMode(savedSettings?.handMode ?? "both");
      setCurrentTime(nextCurrentTime);
      setManualSheetStart(null);
      setSavedAt(savedSettings?.updatedAt ?? null);
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
  const currentBar = song ? timeToMeasure(currentTime, song) : 1;
  const progressInLoop = song ? clamp(((currentTime - practiceStart) / practiceDuration) * 100, 0, 100) : 0;
  const currentBarStart = song ? measureToTime(currentBar, song) : 0;
  const currentBarEnd = song ? measureToTime(Math.min(currentBar + 1, (song?.measures ?? 1) + 1), song) : 1;
  const sheetViewSpan = song ? Math.min(practiceDuration, Math.max((60 / song.tempo) * song.beatsPerMeasure * 2, 6)) : 6;
  const automaticSheetViewStart = song
    ? clamp(currentTime - sheetViewSpan * 0.28, practiceStart, Math.max(practiceStart, practiceEnd - sheetViewSpan))
    : 0;
  const sheetViewStart = song
    ? clamp(manualSheetStart ?? automaticSheetViewStart, practiceStart, Math.max(practiceStart, practiceEnd - sheetViewSpan))
    : 0;
  const sheetViewEnd = song ? Math.min(practiceEnd, sheetViewStart + sheetViewSpan) : 1;
  const sheetViewDuration = Math.max(sheetViewEnd - sheetViewStart, 1);
  const currentBarSheetLeft = song ? clamp(((currentBarStart - sheetViewStart) / sheetViewDuration) * 100, 0, 100) : 0;
  const currentBarSheetWidth = song
    ? clamp(((currentBarEnd - currentBarStart) / sheetViewDuration) * 100, 6, 100 - currentBarSheetLeft)
    : 0;
  const fallingWindowLead = song ? Math.min(practiceDuration * 0.6, 4) : 4;
  const fallingWindowTail = 0.45;
  const upcomingPreviewWindow = 0.85;
  const focusFromBar = song ? timeToMeasure(sheetViewStart, song) : 1;
  const focusToBar = song ? timeToMeasure(Math.max(sheetViewEnd - 0.01, sheetViewStart), song) : 1;
  const savedProgressBar = song ? timeToMeasure(currentTime, song) : 1;
  const savedProgressLabel = savedAt
    ? `Merker: Takt ${savedProgressBar}, ${formatClockTime(currentTime)} gespeichert am ${formatSavedAt(savedAt)}`
    : null;

  React.useEffect(() => {
    if (!isPlaying) {
      return;
    }

    setManualSheetStart(null);
  }, [isPlaying]);

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
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!song) {
      return;
    }

    setFromBar((bar) => clamp(bar, 1, song.measures));
    setToBar((bar) => clamp(Math.max(bar, fromBar), 1, song.measures));
  }, [fromBar, song]);

  React.useEffect(() => {
    if (!song) {
      return;
    }

    writePracticeSettings(song, {
      currentTime,
      fromBar,
      handMode,
      loop,
      tempo,
      toBar,
      updatedAt: Date.now(),
    });
    setSavedAt(Date.now());
  }, [fromBar, handMode, loop, song, tempo, toBar]);

  React.useEffect(() => {
    if (!song || isPlaying) {
      return;
    }

    writePracticeSettings(song, {
      currentTime,
      fromBar,
      handMode,
      loop,
      tempo,
      toBar,
      updatedAt: Date.now(),
    });
    setSavedAt(Date.now());
  }, [currentTime, fromBar, handMode, isPlaying, loop, song, tempo, toBar]);

  const visibleNotes =
    song?.notes.filter((note) => {
      const handMatches =
        handMode === "both" ||
        (handMode === "left" && note.hand === "left") ||
        (handMode === "right" && note.hand === "right");

      return handMatches && note.start + note.duration >= practiceStart - 1 && note.start <= practiceEnd + 1;
    }) ?? [];
  const activeNotes = visibleNotes.filter((note) => currentTime >= note.start && currentTime <= note.start + note.duration);
  const activeNoteIds = new Set(activeNotes.map((note) => note.id));
  const activeMidiNotes = new Set(activeNotes.map((note) => note.midi));
  const upcomingNotes = visibleNotes.filter(
    (note) => note.start > currentTime && note.start <= currentTime + upcomingPreviewWindow,
  );
  const upcomingNoteIds = new Set(upcomingNotes.map((note) => note.id));
  const upcomingMidiNotes = new Set(upcomingNotes.map((note) => note.midi));
  const sheetNotes = visibleNotes.filter(
    (note) => note.start + note.duration >= sheetViewStart - 0.2 && note.start <= sheetViewEnd + 0.2,
  );
  const beamGroups = song ? buildBeamGroups(sheetNotes, song, sheetViewStart, sheetViewDuration) : [];
  const beamedNoteIds = new Set(beamGroups.flatMap((group) => group.ids));
  const visibleBarLines =
    song === null
      ? []
      : Array.from({ length: Math.max(0, focusToBar - focusFromBar + 2) }, (_, index) => focusFromBar + index).filter(
          (bar) => bar >= 1 && bar <= song.measures + 1,
        );
  const fallingNotes = visibleNotes.filter(
    (note) => note.start + note.duration >= currentTime - fallingWindowTail && note.start <= currentTime + fallingWindowLead,
  );
  const rulerBars = Array.from({ length: song?.measures ?? 12 }, (_, index) => index + 1).slice(0, 48);
  const playheadLeft = song ? clamp(((currentTime - practiceStart) / practiceDuration) * 100, 0, 100) : 0;
  const whiteKeys = Array.from({ length: keyboardEnd - keyboardStart + 1 }, (_, index) => keyboardStart + index).filter(
    (midi) => !isBlackKey(midi),
  );
  const allKeys = Array.from({ length: keyboardEnd - keyboardStart + 1 }, (_, index) => keyboardStart + index);

  const releaseAudio = React.useCallback(() => {
    soundingNotesRef.current.forEach((toneNote) => {
      samplerRef.current?.triggerRelease(toneNote);
    });
    samplerRef.current?.releaseAll();
    soundingNotesRef.current.clear();
  }, []);

  const ensureAudioReady = React.useCallback(async () => {
    try {
      await Tone.start();

      if (!samplerRef.current) {
        setAudioLoading(true);

        samplerRef.current = await new Promise<Tone.Sampler>((resolve, reject) => {
          const sampler = new Tone.Sampler({
            attack: 0,
            baseUrl: pianoSampleBaseUrl,
            onerror: (error) => reject(error),
            onload: () => resolve(sampler),
            release: 1.2,
            urls: pianoSampleUrls,
          }).toDestination();

          sampler.volume.value = -3;
        });
      }

      setAudioReady(true);
      setAudioLoading(false);
      setAudioError(null);
      return true;
    } catch {
      setAudioLoading(false);
      setAudioError("Audio konnte im Browser nicht gestartet werden.");
      return false;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      releaseAudio();
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, [releaseAudio]);

  React.useEffect(() => {
    if (!audioReady || !isPlaying) {
      releaseAudio();
      return;
    }

    const nextActiveNotes = new Map(activeNotes.map((note) => [note.midi, note]));

    nextActiveNotes.forEach((note, midi) => {
      if (!soundingNotesRef.current.has(midi)) {
        samplerRef.current?.triggerAttack(midiToToneNote(note.midi), undefined, note.velocity);
      }
    });

    soundingNotesRef.current.forEach((toneNote, midi) => {
      if (!nextActiveNotes.has(midi)) {
        samplerRef.current?.triggerRelease(toneNote);
      }
    });

    soundingNotesRef.current = new Map(
      Array.from(nextActiveNotes.entries()).map(([midi, note]) => [midi, midiToToneNote(note.midi)]),
    );
  }, [activeNotes, audioReady, isPlaying, releaseAudio]);

  React.useEffect(() => {
    if (isPlaying) {
      return;
    }

    releaseAudio();
  }, [isPlaying, releaseAudio]);

  async function handlePlayPause() {
    if (!song) {
      return;
    }

    if (!isPlaying) {
      const audioStarted = await ensureAudioReady();

      if (!audioStarted) {
        return;
      }
    }

    if (!isPlaying && (currentTime < loopStart || currentTime >= loopEnd)) {
      setCurrentTime(loopStart);
    }

    setIsPlaying((value) => !value);
  }

  function handleStop() {
    setIsPlaying(false);
    setCurrentTime(loopStart);
    releaseAudio();
  }

  function restartLoopNow() {
    setCurrentTime(loopStart);
    releaseAudio();
  }

  async function startPlaybackFromVoice() {
    if (!song || isPlaying) {
      return;
    }

    const audioStarted = await ensureAudioReady();

    if (!audioStarted) {
      return;
    }

    if (currentTime < loopStart || currentTime >= loopEnd) {
      setCurrentTime(loopStart);
    }

    setIsPlaying(true);
  }

  function stopPlaybackFromVoice() {
    setIsPlaying(false);
    releaseAudio();
  }

  function jumpMeasure(direction: -1 | 1) {
    if (!song) {
      return;
    }

    const secondsPerMeasure = measureToTime(2, song);
    setCurrentTime((time) => clamp(time + secondsPerMeasure * direction, 0, song.duration));
  }

  function setPracticeRange(nextFromBar: number, nextToBar: number) {
    if (!song) {
      return;
    }

    const clampedFromBar = clamp(nextFromBar, 1, song.measures);
    const clampedToBar = clamp(nextToBar, clampedFromBar, song.measures);

    setFromBar(clampedFromBar);
    setToBar(clampedToBar);
    setCurrentTime((time) =>
      clamp(time, measureToTime(clampedFromBar, song), measureToTime(clampedToBar + 1, song)),
    );
  }

  function shiftPracticeRange(direction: -1 | 1) {
    if (!song) {
      return;
    }

    const width = toBar - fromBar;
    const nextFromBar = clamp(fromBar + direction, 1, Math.max(1, song.measures - width));
    setPracticeRange(nextFromBar, nextFromBar + width);
  }

  function handleRulerBarClick(bar: number) {
    if (!song) {
      return;
    }

    const distanceToStart = Math.abs(bar - fromBar);
    const distanceToEnd = Math.abs(bar - toBar);

    if (bar < fromBar || distanceToStart <= distanceToEnd) {
      setPracticeRange(bar, Math.max(bar, toBar));
      return;
    }

    setPracticeRange(fromBar, bar);
  }

  function applyVoiceCommand(rawCommand: string) {
    const command = normalizeVoiceCommand(rawCommand);
    const rangeMatch = command.match(/(?:takt|takte)?\s*(\d+)\s*(?:bis|-)\s*(\d+)/);
    const speedMatch = command.match(/(?:speed|tempo)\s*(\d+)/);
    const singleBarMatch = command.match(/(?:takt|takte)\s*(\d+)/);

    if (!command) {
      return;
    }

    if (command.includes("start") || command.includes("spiel") || command.includes("play")) {
      void startPlaybackFromVoice();
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("stop") || command.includes("pause") || command.includes("halt")) {
      stopPlaybackFromVoice();
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("takt vor") || command.includes("weiter")) {
      jumpMeasure(1);
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("takt zuruck") || command.includes("zurueck")) {
      jumpMeasure(-1);
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (rangeMatch) {
      setPracticeRange(Number(rangeMatch[1]), Number(rangeMatch[2]));
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("takt wiederholen")) {
      setPracticeRange(currentBar, currentBar);
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (singleBarMatch) {
      const bar = Number(singleBarMatch[1]);
      setPracticeRange(bar, bar);
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("linke hand") || command === "links") {
      setHandMode("left");
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("rechte hand") || command === "rechts") {
      setHandMode("right");
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("beide")) {
      setHandMode("both");
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (speedMatch) {
      setTempo(clamp(Number(speedMatch[1]), 20, 220));
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("schneller")) {
      setTempo((value) => Math.min(220, value + 5));
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("langsamer")) {
      setTempo((value) => Math.max(20, value - 5));
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    if (command.includes("halbieren")) {
      setTempo((value) => Math.max(20, Math.round(value / 2)));
      setVoiceStatus(`Befehl: ${rawCommand}`);
      return;
    }

    setVoiceStatus(`Nicht erkannt: ${rawCommand}`);
  }

  function toggleVoiceControl() {
    if (!speechSupported) {
      setVoiceStatus("Spracherkennung wird von diesem Browser nicht unterstuetzt.");
      return;
    }

    if (voiceListening) {
      recognitionRef.current?.stop();
      setVoiceListening(false);
      setVoiceStatus("Sprachsteuerung pausiert");
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setVoiceStatus("Spracherkennung wird von diesem Browser nicht unterstuetzt.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];

        if (result.isFinal) {
          applyVoiceCommand(result[0].transcript);
        }
      }
    };
    recognition.onerror = (event) => {
      setVoiceStatus(`Sprachfehler: ${event.error}`);
      setVoiceListening(false);
    };
    recognition.onend = () => {
      setVoiceListening(false);
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setVoiceListening(true);
      setVoiceStatus("Ich hoere zu");
    } catch {
      setVoiceStatus("Spracherkennung konnte nicht gestartet werden.");
    }
  }

  function handleSheetPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!song) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    sheetDragRef.current = {
      startTime: sheetViewStart,
      startX: event.clientX,
      width: Math.max(bounds.width, 1),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSheetPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!song || sheetDragRef.current === null) {
      return;
    }

    const drag = sheetDragRef.current;
    const deltaSeconds = ((event.clientX - drag.startX) / drag.width) * sheetViewDuration;
    const maxStart = Math.max(practiceStart, practiceEnd - sheetViewSpan);

    setManualSheetStart(clamp(drag.startTime - deltaSeconds, practiceStart, maxStart));
  }

  function handleSheetPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (sheetDragRef.current === null) {
      return;
    }

    sheetDragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
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

          {savedProgressLabel && <div className="saved-progress">{savedProgressLabel}</div>}

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
                onChange={(event) => setPracticeRange(Number(event.target.value), toBar)}
              />
            </label>
            <label>
              Bis Takt
              <input
                min={fromBar}
                max={song?.measures ?? fromBar}
                type="number"
                value={toBar}
                onChange={(event) => setPracticeRange(fromBar, Number(event.target.value))}
              />
            </label>
          </div>

          <div className="field">
            <span>Bereich verschieben</span>
            <div className="range-nav">
              <button disabled={!song || fromBar <= 1} onClick={() => shiftPracticeRange(-1)}>
                <ChevronLeft size={18} />
                Frueher
              </button>
              <button disabled={!song || toBar >= (song?.measures ?? toBar)} onClick={() => shiftPracticeRange(1)}>
                Spaeter
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="field">
            <span>Loop-Aktionen</span>
            <div className="range-nav">
              <button disabled={!song} onClick={restartLoopNow}>
                <Repeat2 size={18} />
                Neu ab Start
              </button>
              <button
                disabled={!song}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentTime(loopStart);
                }}
              >
                <Square size={18} />
                An Start parken
              </button>
            </div>
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
            <span>
              {audioError ??
                (audioLoading ? "Piano-Samples werden geladen" : audioReady ? "Piano-Audio aktiv" : "Piano startet beim ersten Play")}
            </span>
          </div>

          <div className="voice-control">
            <button className={voiceListening ? "listening" : ""} onClick={toggleVoiceControl} type="button">
              {voiceListening ? <MicOff size={18} /> : <Mic size={18} />}
              {voiceListening ? "Zuhoeren stoppen" : "Sprachsteuerung"}
            </button>
            <span>{speechSupported ? voiceStatus : "Spracherkennung im Browser nicht verfuegbar"}</span>
          </div>
        </aside>

        <section className="practice-view" aria-label="Uebebereich">
          <div className="measure-ruler" style={{ gridTemplateColumns: `repeat(${rulerBars.length}, minmax(42px, 1fr))` }}>
            {rulerBars.map((bar) => (
              <button
                key={bar}
                className={[
                  bar >= fromBar && bar <= toBar ? "loop-bar" : "",
                  bar === fromBar ? "range-start" : "",
                  bar === toBar ? "range-end" : "",
                  bar === currentBar ? "current-bar" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleRulerBarClick(bar)}
                title={`${barLabel(bar)} ${bar === fromBar ? "(Start)" : bar === toBar ? "(Ende)" : ""}`.trim()}
              >
                {bar}
              </button>
            ))}
            <div className="playhead" style={{ left: `${playheadLeft}%` }} />
          </div>

          <div className="loop-summary" aria-label="Loop-Zusammenfassung">
            <strong>
              Bereich {fromBar}-{toBar}
            </strong>
            <span>Aktuell in Takt {currentBar}</span>
            <span>{progressInLoop.toFixed(0)}% durch den Uebebereich</span>
            <span>Fokusfenster {focusFromBar}-{focusToBar}</span>
            <span>{upcomingNotes.length} naechste Noten im Anflug</span>
          </div>

          <div
            className="sheet-placeholder"
            onPointerCancel={handleSheetPointerEnd}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerEnd}
          >
            <div
              className="current-bar-band"
              style={{ left: `${currentBarSheetLeft}%`, width: `${currentBarSheetWidth}%` }}
            />
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
            <div className="bar-lines" aria-hidden="true">
              {song &&
                visibleBarLines.map((bar) => (
                  <span
                    key={`sheet-bar-${bar}`}
                    className="bar-line"
                    style={{
                      left: `${clamp(((measureToTime(bar, song) - sheetViewStart) / sheetViewDuration) * 100, 0, 100)}%`,
                    }}
                  >
                    <i>{bar}</i>
                  </span>
                ))}
            </div>
            <div className="beam-groups" aria-hidden="true">
              {beamGroups.map((group, index) => (
                <span
                  key={`${group.hand}-beam-${index}-${group.left}`}
                  className={`beam-group ${group.hand}`}
                  style={{
                    left: `${group.left}%`,
                    top: group.top,
                    transform: `translateX(${group.stemOffset}px)`,
                    width: group.width,
                  }}
                >
                  {Array.from({ length: group.flags }, (_, flagIndex) => (
                    <i key={flagIndex} className={`beam-line beam-${flagIndex + 1}`} />
                  ))}
                </span>
              ))}
            </div>
            <div className="note-row">
              {sheetNotes.slice(0, 180).map((note, index) => (
                <span
                  key={`${note.midi}-${note.start}-${index}`}
                  className={[
                    "sheet-note",
                    note.hand,
                    noteDurationClass(song ? noteDurationInBeats(note, song) : 1),
                    beamedNoteIds.has(note.id) ? "beamed" : "",
                    activeNoteIds.has(note.id) ? "active" : "",
                    !activeNoteIds.has(note.id) && upcomingNoteIds.has(note.id) ? "upcoming" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={`${noteName(note.midi)} ${note.trackName}`}
                  style={{
                    left: `${noteLeftPercent(note, sheetViewStart, sheetViewDuration)}%`,
                    top: `${noteYPosition(note)}%`,
                    width: `${noteWidthPixels(note, sheetViewDuration)}px`,
                  }}
                >
                  <i className="note-head" />
                  <i className="note-stem" />
                  {Array.from({ length: noteFlags(song ? noteDurationInBeats(note, song) : 1) }, (_, flagIndex) => (
                    <i key={flagIndex} className={`note-flag flag-${flagIndex + 1}`} />
                  ))}
                </span>
              ))}
            </div>
          </div>

          <div className="falling-notes">
            <div className="strike-line" aria-hidden="true">
              <span />
            </div>
            {fallingNotes.slice(0, 220).map((note, index) => (
              <span
                key={`${note.midi}-fall-${note.start}-${index}`}
                className={[
                  "fall-note",
                  note.hand,
                  activeNoteIds.has(note.id) ? "active" : "",
                  !activeNoteIds.has(note.id) && upcomingNoteIds.has(note.id) ? "upcoming" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
            <div
              key={midi}
              className={[
                "white-key",
                activeMidiNotes.has(midi) ? "active" : "",
                !activeMidiNotes.has(midi) && upcomingMidiNotes.has(midi) ? "upcoming" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {noteName(midi).startsWith("C") && <span>{noteName(midi)}</span>}
              {!activeMidiNotes.has(midi) && upcomingMidiNotes.has(midi) ? <i aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
        <div className="black-keys">
          {allKeys.map((midi) =>
            isBlackKey(midi) ? (
              <div
                key={midi}
                className={[
                  "black-key",
                  activeMidiNotes.has(midi) ? "active" : "",
                  !activeMidiNotes.has(midi) && upcomingMidiNotes.has(midi) ? "upcoming" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
          Bereich {fromBar}-{toBar}, aktuell Takt {currentBar}
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
