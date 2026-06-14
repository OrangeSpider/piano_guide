# Piano Guide Anforderungen

## Ziel

Piano Guide ist eine Lern- und Uebe-App fuer Piano-Stuecke. Die App soll MIDI-Dateien laden, das Stueck visuell abspielbar machen und gezieltes Wiederholen einzelner Takte oder Abschnitte unterstuetzen.

## Zielplattformen

- Primaer: Windows im Browser als Entwicklungs- und Testumgebung
- Mobil: Android Smartphone, insbesondere Galaxy S20
- Tablet: Android Tablet, insbesondere Galaxy S2
- Empfohlener Start: Progressive Web App, spaeter optional Verpackung als Android-App

## Kernablauf

1. Der Nutzer waehlt eine MIDI-Datei.
2. Die App analysiert Tempo, Takte, Spuren und Noten.
3. Der Nutzer kann das Stueck abspielen, pausieren und stoppen.
4. Die App zeigt den aktuellen Verlauf im Stueck.
5. Die App zeigt an, welche Klaviertasten zu spielen sind.
6. Der Nutzer kann gezielt Abschnitte wiederholen.

## Muss-Funktionen MVP

- MIDI-Datei laden
- Stueckinformationen anzeigen
- Wiedergabe starten, pausieren und stoppen
- Virtuelle Klaviatur anzeigen
- Aktive Noten farblich markieren
- Geschwindigkeit einstellen
- Taktbereich von/bis einstellen
- Bereich dauerhaft wiederholen
- Hand-Modus waehlen: links, rechts, beide

## Erweiterungen

- Notenbild mit Taktnummern
- Fallnoten-Ansicht aehnlich Synthesia
- Fortschritt pro Stueck speichern
- Letzte Einstellungen pro Stueck speichern
- Fingersatz manuell erfassen und speichern
- Automatische Fingersatz-Vorschlaege

## Sprachsteuerung

Die App soll Taktnummern sichtbar machen und Sprachbefehle auswerten.

- Stop
- Start
- Takt wiederholen
- Takt vor
- Takt zurueck
- Takt X bis Y wiederholen
- Linke Hand
- Rechte Hand
- Beide Haende
- Speed 60
- Schneller
- Langsamer
- Halbieren

## Erfolgskriterium fuer den ersten Prototyp

Die Demo-Datei `Ungarische.mid` kann geladen werden. Die App zeigt eine Klaviatur, Takt- und Tempo-Einstellungen sowie einen Playback-Bereich, in dem sichtbar wird, welche Noten im aktuell simulierten Verlauf aktiv sind.
