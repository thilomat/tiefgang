# TIEFGANG – Die Dungeon-Show

Ein Pixel-Art-Dungeon-Spiel für den Handy-Browser. Kandidat 4711 wird beim Sonntagsjogging entführt und muss sich in der beliebtesten Dungeon-Show der Galaxis Etage für Etage nach unten kämpfen – bevor die Decke einstürzt. Die Moderations-KI ZYNIKA kommentiert jeden Fehltritt.

**Spielen:** https://thilomat.github.io/tiefgang/

## Steuerung
- **Handy:** linker Daumen = laufen, rechte Bildschirmhälfte = angreifen (gedrückt halten), Knöpfe für Heiltrank und Beutekisten
- **Tastatur:** WASD oder Pfeiltasten, Leertaste = Angriff, E = Trank, Q = Kiste, P = Pause

## Inhalt
- Zufällig erzeugte Etagen mit Countdown – wer die Treppe nicht rechtzeitig findet, wird verschüttet
- Zuschauerzahl, Sponsorenpakete am Fallschirm und eine Werbepause mit Shop zwischen den Etagen
- 23 Erfolge mit Beutekisten, 8 Waffen, 12 Perks und ein Boss auf jeder dritten Etage
- ZYNIKA spricht ihre Ansagen (Systemstimme oder KI-Stimme über piper-tts-web)
- Der Spielstand wird im jeweiligen Browser gespeichert

## Technik
Eine einzige HTML-Datei ohne Abhängigkeiten: Grafiken und Soundeffekte entstehen im Code.

- `index.html` – das fertige Spiel (wird von GitHub Pages ausgeliefert)
- `src/` – Quelltext (HTML-Vorlage, CSS, JavaScript-Module)
- `build.py` – baut aus `src/` die Datei `index.html`: `python3 build.py && cp dist/tiefgang.html index.html`
