# Piano Guide Implementierungsplan

## Phase 1: Projektfundament

Ergebnis:
Eine lauffaehige Web-App mit dokumentierten Anforderungen, UI-Richtung und Entwicklungsplan.

Aufgaben:
- React/Vite/TypeScript Projekt anlegen
- Basislayout erstellen
- Demo-MIDI als Sample vorbereiten
- Dokumentation anlegen

## Phase 2: MIDI laden und analysieren

Status: erster Durchstich umgesetzt.

Ergebnis:
Die App kann eine MIDI-Datei laden und grundlegende Informationen anzeigen.

Aufgaben:
- MIDI-Datei per Datei-Upload laden: umgesetzt
- Demo-Datei aus `public/samples` laden: umgesetzt
- Tempo, Dauer, Spuren und Noten extrahieren: umgesetzt
- Takte aus Time-Signature und Tempo ableiten: grundlegend umgesetzt

## Phase 3: Visueller Playback-Prototyp

Ergebnis:
Beim Abspielen werden die aktuell aktiven Noten auf der Klaviatur sichtbar.

Aufgaben:
- Playback-Zeit verwalten
- Play/Pause/Stop implementieren
- Tempo-Skalierung anwenden
- Noten nach aktueller Zeit filtern
- Klaviaturzustand visualisieren

## Phase 4: Ueben nach Takten

Status: Bereichsauswahl und Verschieben umgesetzt, Loop-Basis aktiv.

Ergebnis:
Der Nutzer kann einen Taktbereich festlegen und endlos wiederholen.

Aufgaben:
- Taktlineal anzeigen: umgesetzt
- Start- und Endtakt einstellen: umgesetzt
- Loop-Logik implementieren: grundlegend umgesetzt
- Takt vor/zurueck: grundlegend umgesetzt
- Bereich als Fenster nach links/rechts verschieben: umgesetzt

## Phase 5: Hand-Modi und Persistenz

Status: Hand-Modus aktiv, Einstellungen pro Stueck im Local Storage gespeichert.

Ergebnis:
Einstellungen werden pro Stueck gespeichert und koennen wieder geladen werden.

Aufgaben:
- Linke/rechte Hand aus MIDI-Spuren oder Notenlage ableiten: grundlegend umgesetzt
- Hand-Modus in der Wiedergabe beruecksichtigen: umgesetzt
- Einstellungen im Local Storage speichern: umgesetzt
- Fortschritt pro Stueck speichern: grundlegend umgesetzt
- Gespeicherten Uebestand im UI sichtbar machen: umgesetzt

## Phase 6: Sprachsteuerung

Ergebnis:
Die wichtigsten Uebebefehle koennen per Sprache bedient werden.

Aufgaben:
- Browser Speech Recognition pruefen
- Befehlsparser fuer Deutsch bauen
- Befehle mit sichtbaren Aktionen verbinden
- Fallback fuer Browser ohne Speech Recognition anzeigen

## Phase 7: Notenbild und Fingersatz

Ergebnis:
Die App bietet eine lernnahe Darstellung mit Noten, Takten und Fingersatz.

Aufgaben:
- geeignete Notationsbibliothek evaluieren
- Notenbild synchron zur Wiedergabe anzeigen
- Fingersatzdatenmodell anlegen
- Fingersatz je Note erfassen und speichern
