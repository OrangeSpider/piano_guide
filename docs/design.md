# Piano Guide Design

## Produktidee

Piano Guide ist ein Uebe-Werkzeug, kein Medienplayer. Der Bildschirm soll beim Lernen helfen: Was kommt jetzt, wo bin ich, welcher Abschnitt wird wiederholt und welche Hand ist aktiv?

## Layout

Die erste Version nutzt drei klare Bereiche:

1. Transportleiste
   - Play/Pause
   - Stop
   - Tempo
   - Hand-Modus
   - Loop

2. Uebebereich
   - Stuecktitel
   - Taktbereich
   - aktuelle Position
   - spaeter: Notensystem und Fallnoten

3. Klaviatur
   - 88-Tasten-Layout als Zielbild
   - aktive Noten farbig
   - linke Hand blau, rechte Hand gruen

## Visuelle Richtung

- Arbeitsflaeche ruhig und kontrastreich
- Klaviatur klar lesbar
- Farben haben Bedeutung:
  - Blau: linke Hand
  - Gruen: rechte Hand
  - Gelb/Amber: Loop oder Markierung
- Bedienelemente muessen auf Touch-Geraeten gross genug sein

## Responsives Verhalten

- Desktop: breite Timeline, Klaviatur ueber die volle Breite
- Smartphone: kompakte Steuerleiste, Klaviatur horizontal scrollbar oder skaliert
- Tablet: priorisierte Uebeansicht mit gut erreichbaren Transporttasten

## Interaktionsprinzipien

- Ein Uebemodus bleibt sichtbar, auch waehrend das Stueck laeuft.
- Einstellungen sollen direkt wirken, ohne Dialoge.
- Takte sind die wichtigste Navigationseinheit.
- Sprachsteuerung ist eine Abkuerzung fuer sichtbare Funktionen, kein separater Modus.

## Naechste UI-Ausbaustufen

1. Aktive Noten auf der Klaviatur
2. Taktlineal mit Positionsmarker
3. Fallnoten-Timeline
4. Notenbild mit Taktnummern
5. Fingersatz-Overlay
