# Piano Guide Implementierungsplan

## Phase 1: Projektfundament

Status: umgesetzt.

Ergebnis:
Eine lauffaehige Web-App mit dokumentierten Anforderungen, UI-Richtung und Entwicklungsplan.

Aufgaben:
- React/Vite/TypeScript Projekt anlegen
- Basislayout erstellen
- Demo-MIDI als Sample vorbereiten
- Dokumentation anlegen

## Phase 2: MIDI laden und analysieren

Status: umgesetzt.

Ergebnis:
Die App kann eine MIDI-Datei laden und grundlegende Informationen anzeigen.

Aufgaben:
- MIDI-Datei per Datei-Upload laden: umgesetzt
- Demo-Datei aus `public/samples` laden: umgesetzt
- Tempo, Dauer, Spuren und Noten extrahieren: umgesetzt
- Takte aus Time-Signature und Tempo ableiten: umgesetzt

## Phase 3: Visueller Playback-Prototyp

Status: weitgehend umgesetzt, inklusive Piano-Sample-Audio.

Ergebnis:
Beim Abspielen werden die aktuell aktiven Noten auf der Klaviatur sichtbar.

Aufgaben:
- Playback-Zeit verwalten: umgesetzt
- Play/Pause/Stop implementieren: umgesetzt
- Tempo-Skalierung anwenden: umgesetzt
- Noten nach aktueller Zeit filtern: umgesetzt
- Klaviaturzustand visualisieren: umgesetzt
- Piano-Samples laden und aktive Noten akustisch anspielen: umgesetzt
- Kommende Noten visuell hervorheben: umgesetzt

## Phase 4: Ueben nach Takten

Status: weitgehend umgesetzt.

Ergebnis:
Der Nutzer kann einen Taktbereich festlegen und endlos wiederholen.

Aufgaben:
- Taktlineal anzeigen: umgesetzt
- Start- und Endtakt einstellen: umgesetzt
- Loop-Logik implementieren: umgesetzt
- Takt vor/zurueck: umgesetzt
- Bereich als Fenster nach links/rechts verschieben: umgesetzt
- Wiedergabe an Loop-Start parken oder neu starten: umgesetzt

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

Status: Browser-Durchstich umgesetzt.

Ergebnis:
Die wichtigsten Uebebefehle koennen per Sprache bedient werden.

Aufgaben:
- Browser Speech Recognition pruefen: umgesetzt
- Befehlsparser fuer Deutsch bauen: umgesetzt
- Befehle mit sichtbaren Aktionen verbinden: umgesetzt
- Fallback fuer Browser ohne Speech Recognition anzeigen: umgesetzt

## Phase 7: Notenbild und Fingersatz

Status: Notenbild als erster Prototyp umgesetzt, Fingersatz noch offen.

Ergebnis:
Die App bietet eine lernnahe Darstellung mit Noten, Takten und Fingersatz.

Aufgaben:
- geeignete Notationsbibliothek evaluieren: umgesetzt (`vexflow`)
- Notenbild synchron zur Wiedergabe anzeigen: grundlegend umgesetzt
- Fallnoten-Ansicht als zusaetzliche Lernansicht: erster Prototyp umgesetzt
- Horizontales Fokusfenster im Notenbereich verschiebbar machen: umgesetzt
- Fingersatzdatenmodell anlegen: offen
- Fingersatz je Note erfassen und speichern: offen

## Phase 8: Naechste sinnvolle Schritte

Ergebnis:
Der Prototyp wird von einer starken Demo zu einem belastbaren Uebe-Werkzeug.

Aufgaben:
- Taktberechnung robuster machen bei wechselnden Time-Signatures und mehreren Tempo-Events
- Rechte/linke Hand sauberer trennen, auch bei einspurigen oder komplexen MIDI-Dateien
- Fingersatz erfassen, speichern und im Notenbild anzeigen
- Mobile Bedienung fuer Android-Smartphone und Tablet gezielt optimieren
- Browser- und Geraetetests fuer Audio, Touch und Speech Recognition systematisch nachziehen
