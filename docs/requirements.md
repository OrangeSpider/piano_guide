# Piano Guide Anforderungen

## Ziel

Piano Guide ist eine Lern- und Uebe-App fuer Piano-Stuecke. Die App soll MIDI-Dateien laden, das Stueck visuell und akustisch erfahrbar machen und gezieltes Wiederholen einzelner Takte oder Abschnitte unterstuetzen.

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
5. Die App zeigt an, welche Klaviertasten jetzt und gleich zu spielen sind.
6. Die App zeigt den Uebebereich als Taktfenster, Notenbild und Fallnoten-Vorschau.
7. Der Nutzer kann gezielt Abschnitte wiederholen und zwischen Haenden umschalten.

## Muss-Funktionen MVP

- MIDI-Datei laden
- Demo-MIDI automatisch laden
- Stueckinformationen anzeigen
- Wiedergabe starten, pausieren und stoppen
- Taktweise Navigation vor und zurueck
- Virtuelle Klaviatur anzeigen
- Aktive Noten farblich markieren
- Kommende Noten visuell hervorheben
- Piano-Samples fuer aktive Noten abspielen
- Geschwindigkeit einstellen
- Taktbereich von/bis einstellen
- Bereich dauerhaft wiederholen
- Bereich nach links und rechts verschieben
- Hand-Modus waehlen: links, rechts, beide
- Letzte Uebeeinstellungen pro Stueck lokal speichern
- Gespeicherten Uebestand im UI sichtbar machen
- Sprachsteuerung fuer Basisbefehle bereitstellen

## Aktueller Stand

Bereits umgesetzt:

- MIDI-Upload und Demo-Datei `Ungarische.mid`
- Analyse von Tempo, Dauer, Spuren, Taktart, Tonart und Noten
- Transportsteuerung mit Play/Pause/Stop
- Taktnavigation und Loop-Bereich
- Virtuelle 88er-Klaviatur mit Hervorhebung aktiver und kommender Noten
- Audio-Wiedergabe ueber Piano-Samples
- Hand-Modus links, rechts, beide
- Lokales Speichern der Uebeeinstellungen pro Stueck
- Sichtbarer Merker fuer den zuletzt gespeicherten Stand
- Sprachsteuerung im Browser fuer zentrale Befehle
- Notenbild-Prototyp auf Basis von `vexflow`
- Fallnoten-Ansicht als zusaetzliche Lernansicht
- Sparse Fingersatz-Erfassung fuer Taktanfaenge und schwierige Takt-Details
- Sprachbefehle fuer Fingersatz-Anker, Detailmodus und Fingerfolgen

## Erweiterungen

- Robuste Taktberechnung bei Tempo- und Taktartwechseln
- Praezisere automatische Hand-Zuordnung bei komplexen MIDI-Dateien
- Notenbild mit staerkerer rhythmischer Genauigkeit und besserem Layout
- Fingersatz direkt im Notenbild und per Tastatur korrigieren
- Automatische Fingersatz-Vorschlaege
- Mobile Optimierung fuer Smartphone und Tablet
- Systematische Browser- und Geraetetests fuer Audio, Touch und Speech Recognition

## Sprachsteuerung

Die App soll Taktnummern sichtbar machen und Sprachbefehle auswerten.

Bereits vorgesehen und grundlegend umgesetzt:

- Stop
- Start
- Takt wiederholen
- Takt vor
- Takt zurueck
- Takt X bis Y wiederholen
- Takt X
- Linke Hand
- Rechte Hand
- Beide Haende
- Speed 60 / Tempo 60
- Schneller
- Langsamer
- Halbieren
- Takt X ganz
- Nur Anfang
- Weiter / Zurueck
- Takt fertig
- Loeschen
- Fingerfolgen wie `3 1 und 1` oder `links 3 1 rechts 1`

## Erfolgskriterium fuer den ersten Prototyp

Die Demo-Datei `Ungarische.mid` kann geladen werden. Die App zeigt eine Klaviatur, Takt- und Tempo-Einstellungen, einen Playback-Bereich, ein Notenbild sowie eine Fallnoten-Vorschau. Sichtbar wird, welche Noten aktuell aktiv sind, welche als Naechstes kommen und welcher Taktbereich gerade geuebt wird.
