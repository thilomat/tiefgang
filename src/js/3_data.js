// ---------- Spieldaten (alles eigene Figuren und Texte) ----------
const WEAPONS = [
  { name: 'Fahrradpumpe', dmg: 5, cd: 0.30, range: 17, arc: 110, knock: 70, col: '#7fe0ff', desc: 'Pumpt. Prügelt. Passt in jede Jogginghose.' },
  { name: 'Nudelholz', dmg: 8, cd: 0.36, range: 18, arc: 115, knock: 95, col: '#ffcf8a', desc: 'Omas Geheimwaffe. Jetzt auch gegen Ratten.' },
  { name: 'Klappspaten', dmg: 11, cd: 0.40, range: 20, arc: 135, knock: 110, col: '#c2c3d6', desc: 'Gräbt Löcher. Auch in Gegner.' },
  { name: 'Grillzange XXL', dmg: 9, cd: 0.26, range: 21, arc: 100, knock: 70, col: '#ff9a3c', desc: 'Wendet Würstchen und Schicksale.' },
  { name: 'Laubbläser', dmg: 12, cd: 0.30, range: 25, arc: 150, knock: 240, col: '#8be35f', desc: 'Der Erzfeind jeder Sonntagsruhe.' },
  { name: 'Rostiges Schwert', dmg: 18, cd: 0.38, range: 22, arc: 120, knock: 110, col: '#e2a07a', desc: 'Endlich eine echte Waffe. Vorbesitzer: verschollen.' },
  { name: 'Diskokugel am Stiel', dmg: 21, cd: 0.36, range: 24, arc: 170, knock: 150, col: '#ff7ab8', desc: 'Für Gegner, die nicht tanzen wollen.' },
  { name: 'Goldene Klobürste', dmg: 30, cd: 0.34, range: 24, arc: 150, knock: 170, col: '#ffd23f', desc: 'Niemand weiß, wo sie war. Alle wissen, was sie kann.' },
];

const ENEMY = {
  rat: { name: 'Kellerratte', hp: 10, dmg: 4, spd: 50, hw: 4, hh: 3, xp: 3, gold: [1, 3], ai: 'chase', sight: 110, min: 1, w: 10 },
  slime: { name: 'Glibber', hp: 22, dmg: 6, spd: 34, hw: 5, hh: 3, xp: 5, gold: [2, 4], ai: 'hop', sight: 100, min: 1, w: 7 },
  bat: { name: 'Flatterling', hp: 8, dmg: 3, spd: 64, hw: 4, hh: 3, xp: 4, gold: [1, 3], ai: 'flutter', sight: 120, min: 2, w: 6 },
  mush: { name: 'Sporling', hp: 16, dmg: 5, spd: 16, hw: 4, hh: 3, xp: 6, gold: [2, 5], ai: 'shooter', sight: 115, min: 2, w: 5 },
  skel: { name: 'Knochenbeamter', hp: 40, dmg: 9, spd: 34, hw: 4, hh: 3, xp: 10, gold: [4, 8], ai: 'lunge', sight: 110, min: 4, w: 4 },
  mimic: { name: 'Beißkiste', hp: 34, dmg: 8, spd: 46, hw: 5, hh: 3, xp: 12, gold: [10, 20], ai: 'mimic', sight: 26, min: 3, w: 0 },
  boss: { name: 'Glibberkönig', hp: 180, dmg: 8, spd: 28, hw: 10, hh: 6, xp: 60, gold: [40, 60], ai: 'boss', sight: 150, min: 3, w: 0 },
};
const BOSS_VAR = [
  { name: 'Glibberkönig', spr: 'slime' },
  { name: 'Glibberkaiser', spr: 'slimeR' },
  { name: 'Glibbergott', spr: 'slimeP' },
  { name: 'Glibber-Imperator', spr: 'slimeG' },
];

const PERKS = [
  { id: 'mucki', name: 'Muckibude', desc: '+20 % Schaden', icon: 'i_sword', go: (p) => { p.dmgMul *= 1.2; } },
  { id: 'fell', name: 'Dickes Fell', desc: '+15 Max-Leben', icon: 'heart', go: (p) => { p.maxHp += 15; p.hp += 15; } },
  { id: 'schuhe', name: 'Turnschuhe', desc: '+10 % Lauftempo', icon: 'i_boot', max: 5, go: (p) => { p.speedMul *= 1.1; } },
  { id: 'finger', name: 'Flinke Finger', desc: '+15 % Angriffstempo', icon: 'i_bolt', max: 5, go: (p) => { p.atkMul *= 1.15; } },
  { id: 'arme', name: 'Lange Arme', desc: '+15 % Reichweite', icon: 'i_range', max: 4, go: (p) => { p.rangeMul *= 1.15; } },
  { id: 'pilz', name: 'Glückspilz', desc: '+7 % Krit-Chance', icon: 'i_star', max: 6, go: (p) => { p.crit += 0.07; } },
  { id: 'luft', name: 'Zweite Luft', desc: 'Jeder Sieg heilt 2 Leben', icon: 'potion', go: (p) => { p.lifeOnKill += 2; } },
  { id: 'magnet', name: 'Goldmagnet', desc: 'Größerer Sammelradius, +20 % Gold', icon: 'i_magnet', max: 3, go: (p) => { p.magnet *= 1.6; p.goldMul *= 1.2; } },
  { id: 'rampe', name: 'Rampensau', desc: '+30 % Zuschauer-Zuwachs', icon: 'i_eye', go: (p) => { p.viewMul *= 1.3; } },
  { id: 'uhr', name: 'Uhrmacher', desc: '+15 Sekunden pro Etage', icon: 'i_glass', max: 4, go: (p) => { p.timeBonus += 15; } },
  { id: 'horn', name: 'Hornhaut', desc: '−12 % erlittener Schaden', icon: 'i_shield', max: 5, go: (p) => { p.armor = 1 - (1 - p.armor) * 0.88; } },
  { id: 'kiste', name: 'Kistenglück', desc: 'Bessere Beute aus Kisten und Truhen', icon: 'box_g', max: 3, go: (p) => { p.luck += 1; } },
];
const PERK_BY_ID = Object.fromEntries(PERKS.map((p) => [p.id, p]));

const TIER = ['Bronze', 'Silber', 'Gold', 'Legendär'];
const BOXI = ['box_b', 'box_s', 'box_g', 'box_l'];

const ACH = [
  { id: 'ersttaeter', name: 'Ersttäter', desc: 'Besiege deinen ersten Gegner.', tier: 0, line: 'Dein erstes Opfer! Die Zuschauer klatschen. Zumindest einer.' },
  { id: 'doppel', name: 'Zwei auf einen Streich', desc: 'Besiege zwei Gegner mit einem Schlag.', tier: 0, line: 'Zwei auf einen Streich! Kennt man aus dem Märchen. Nur mit weniger Fliegen.' },
  { id: 'kammer', name: 'Kammerjäger', desc: 'Besiege 15 Kellerratten.', tier: 0, line: 'Fünfzehn Ratten. Das Gesundheitsamt schickt Blumen.' },
  { id: 'glibber', name: 'Wackelpudding-Profi', desc: 'Besiege 10 Glibber.', tier: 0, line: 'Du riechst jetzt nach Waldmeister. Steht dir.' },
  { id: 'paragraf', name: 'Paragrafenreiter', desc: 'Besiege einen Knochenbeamten.', tier: 0, line: 'Antrag auf Ableben: genehmigt. Stempel drauf.' },
  { id: 'mimikry', name: 'Kistenbeißer', desc: 'Besiege eine Beißkiste.', tier: 1, line: 'Eine Kiste, die zurückbeißt – und du beißt härter. Respekt.' },
  { id: 'kombo', name: 'Kombo-Kanone', desc: 'Schaffe eine Kombo ×5.', tier: 1, line: 'Kombo mal fünf! Die Regie dreht durch.' },
  { id: 'kratzer', name: 'Kratzerfrei', desc: 'Beende eine Etage ohne Schaden.', tier: 1, line: 'Kein Kratzer! Wie langweilig – äh, beeindruckend.' },
  { id: 'treppenwitz', name: 'Treppenwitz', desc: 'Steige mit weniger als 10 Sekunden Restzeit ab.', tier: 1, line: 'So knapp! Die Regie hatte den Abspann schon eingelegt.' },
  { id: 'frueh', name: 'Frühaufsteher', desc: 'Steige mit mehr als 90 Sekunden Restzeit ab.', tier: 0, line: 'So schnell wieder weg? Die Beute weint dir nach.' },
  { id: 'pazifist', name: 'Pazifist', desc: 'Beende eine Etage ohne einen einzigen Sieg.', tier: 1, line: 'Kein einziger Kampf. Die Zuschauer schlafen. Gratuliere.' },
  { id: 'messer', name: 'Auf Messers Schneide', desc: 'Überlebe mit weniger als 10 % Leben.', tier: 1, line: 'Dein Puls ist höher als unsere Einschaltquote.' },
  { id: 'schatz', name: 'Schatzsucher', desc: 'Öffne 5 Truhen.', tier: 0, line: 'Fünf Truhen! Du hast offensichtlich ein Problem.' },
  { id: 'kisten', name: 'Kistenfanatiker', desc: 'Öffne 10 Beutekisten.', tier: 1, line: 'Zehn Kisten. Die Glücksspielaufsicht hat Fragen.' },
  { id: 'goldesel', name: 'Goldesel', desc: 'Sammle insgesamt 300 Gold.', tier: 1, line: '300 Gold! Du bist jetzt offiziell zu reich für diesen Keller.' },
  { id: 'quote', name: 'Quotenkönig', desc: 'Erreiche 10.000 Zuschauer.', tier: 2, line: 'Zehntausend Zuschauer! Du bist berühmt. Und weiterhin in Lebensgefahr.' },
  { id: 'sponsor', name: 'Sponsorenliebling', desc: 'Erhalte 3 Sponsorenpakete.', tier: 1, line: 'Drei Sponsoren lieben dich. Die anderen haben noch keine Werbezeit gebucht.' },
  { id: 'durst', name: 'Durstig', desc: 'Trinke 5 Heiltränke.', tier: 0, line: 'Fünf Tränke. Wir müssen über dein Trinkverhalten reden.' },
  { id: 'standbild', name: 'Standbild', desc: 'Steh 10 Sekunden lang still.', tier: 0, line: 'Zehn Sekunden Stillstand. Neuer Rekord in Langeweile! Hier, eine Kiste, damit du aufwachst.' },
  { id: 'marathon', name: 'Sonntagsläufer', desc: 'Laufe insgesamt einen Kilometer.', tier: 0, line: 'Ein Kilometer! Dein Joggingausflug hat sich doch noch gelohnt.' },
  { id: 'koenig', name: 'Königsmörder', desc: 'Besiege einen Boss.', tier: 2, line: 'Der König ist tot! Die Requisite fragt, wer das jetzt aufwischt.' },
  { id: 'kellerkind', name: 'Kellerkind', desc: 'Erreiche Etage 5.', tier: 2, line: 'Etage fünf! Ab hier wird’s ungemütlich. Also ungemütlicher.' },
  { id: 'tief', name: 'Tiefstapler', desc: 'Erreiche Etage 10.', tier: 3, line: 'Etage zehn! Damit hat in der Regie keiner gerechnet. Wir müssen nachdrehen.' },
];
const ACH_BY_ID = Object.fromEntries(ACH.map((a) => [a.id, a]));

const SPONSORS = [
  { name: 'Zorg & Söhne Bestattungen', slogan: 'Wir sehen uns bald!' },
  { name: 'Quarkbrause', slogan: 'Erfrischung mit Klumpen.' },
  { name: 'Galakto-Versicherung', slogan: 'Versichert gegen alles. Außer Dungeons.' },
  { name: 'Mampf-O-Mat', slogan: 'Snacks aus Zutaten, die niemand aussprechen kann.' },
  { name: 'Möbelhaus Kriechbaum', slogan: 'Selbst aufbauen. Selbst schuld.' },
  { name: 'Hirnfrost-Eis', slogan: 'Kälter als ZYNIKAs Herz.' },
];

const JUNK = [
  { name: 'Einzelne Socke', text: 'Die andere ist auch irgendwo hier unten. Vermutlich glücklicher.' },
  { name: 'Rabattgutschein', text: 'Zorg & Söhne: 10 % auf die eigene Beerdigung.' },
  { name: 'Motivationsposter', text: '„Du schaffst das!“ steht drauf. Mehr kann es nicht.' },
  { name: 'Leere Chipstüte', text: 'Die Luft darin ist immerhin original.' },
  { name: 'Rubbellos', text: 'Leider kein Gewinn. Wie im echten Leben.' },
  { name: 'Ein Stein', text: 'Ein Stein. Wir sind genauso enttäuscht wie du.' },
  { name: 'Autogrammkarte', text: 'Von ZYNIKA signiert. Mit Lippenstift. Sie hat keine Lippen.' },
  { name: 'Bedienungsanleitung', text: 'Für eine Waffe, die du nicht hast. Seite 1: „Herzlichen Glückwunsch!“' },
];

// ZYNIKA – die Moderations-KI der Show
const LINES = {
  intro: 'Guten Abend, Galaxis! Hier ist ZYNIKA mit einer neuen Folge TIEFGANG – der einzigen Show mit echtem Tiefgang. Unser Kandidat: Nummer 4711, frisch vom Sonntagsjogging entführt.',
  floor1: 'Willkommen im Keller, Kandidat 4711! Finde die Treppe, bevor die Etage einstürzt. Und sei unterhaltsam – sonst schalten die Leute um.',
  floor: [
    'Etage {n}! Neue Etage, neues Glück. Altes Elend.',
    'Willkommen auf Etage {n}. Die Statik hier ist … optimistisch.',
    'Etage {n}. Unsere Versicherung geht seit Etage 2 nicht mehr ans Telefon.',
    'Etage {n}! Die Monster hier hatten noch kein Frühstück. Nur so als Info.',
    'Weiter geht’s auf Etage {n}. Bitte lächeln, Kamera 3 läuft.',
    'Etage {n}. Der Architekt dieser Ebene sitzt übrigens im Gefängnis. Zu Recht.',
  ],
  boss: [
    'Boss-Etage! Die Treppe bleibt versiegelt, bis {b} erledigt ist. Viel Glück. Wirklich. Ein bisschen.',
    'Achtung, Boss-Etage! {b} wartet an der Treppe. Und er ist nicht zum Kuscheln hier.',
  ],
  bossSeen: 'Begrüßt mit mir: {b}! Einen Applaus, bevor er euch auflöst!',
  bossDead: 'Der Boss ist erledigt, die Treppe ist offen! Die Requisite fragt, wer das jetzt aufwischt.',
  sealed: [
    'Versiegelt! Erst der Boss, dann die Treppe. So steht’s im Vertrag.',
    'Die Treppe ist zu. Frag {b}, der hat den Schlüssel. Irgendwo in sich drin.',
  ],
  idle: [
    'Hallo? Die Zuschauer zahlen nicht fürs Rumstehen.',
    'Spannend. Fast so spannend wie Farbe beim Trocknen.',
    'Kandidat 4711 meditiert. Die Quote auch.',
    'Wir schalten gleich zu einer Doku über Steine. Die hat mehr Action.',
    'Bewegung, bitte! Ich moderiere hier kein Standbild.',
  ],
  time30: [
    'Noch 30 Sekunden! Ich würde ja rennen. Hätte ich Beine.',
    'Dreißig Sekunden. Die Regie wettet schon auf deinen Abgang.',
    'Hörst du das Knacken in der Decke? Völlig normal. Nein, Quatsch – lauf!',
  ],
  time10: ['Zehn Sekunden! Das wird knapp. Ich liebe knapp.', 'Zehn! Neun! Ach, zähl selbst.'],
  lowHp: [
    'Du siehst nicht gut aus. Also noch weniger gut als sonst.',
    'Wenig Leben! Die Zuschauer lieben Drama. Ich liebe Einschaltquoten.',
    'Tipp vom Profi: Heiltrank. Trinken. Jetzt.',
  ],
  combo: [
    'Kombo! Die Regie hat gerade ihren Kaffee verschüttet.',
    'Gnadenlos! Unsere Altersfreigabe wackelt.',
    'Das war schön. Das zeigen wir später in Zeitlupe.',
  ],
  firstSeen: {
    rat: 'Eine Kellerratte. Die hat mehr Freunde als du. Und die kommen alle.',
    slime: 'Glibber! Lebendiger Wackelpudding. Bitte nicht probieren.',
    bat: 'Flatterlinge. Wie Fledermäuse, nur schlechter erzogen.',
    mush: 'Ein Sporling. Spuckt Sporen. Abstand halten – oder Luft anhalten.',
    skel: 'Ein Knochenbeamter! Seit 300 Jahren im Dienst und genau einmal Pause gemacht.',
    mimic: 'Eine Truhe! Moment … seit wann haben Truhen Zähne?',
  },
  potion: ['Heiltrank! Schmeckt nach Kirsche und Verzweiflung.', 'Prost! Auf ein langes Leben. Also, ein paar Minuten.'],
  noPotion: 'Keine Tränke mehr. Ganz schlechtes Timing.',
  chest: ['Eine Truhe! Bitte lass es keine Socke sein.', 'Truhe geöffnet. Die Steuerfahndung schaut zu.'],
  stairs: [
    'Abstieg geschafft! Die Etage stürzt jetzt ohne dich ein. Schade eigentlich.',
    'Geschafft! Hinter dir: Trümmer. Vor dir: noch mehr Trümmer.',
    'Treppe gefunden! Die Zuschauer sind leicht enttäuscht, dass du noch lebst.',
  ],
  levelUp: ['Level {n}! Du wirst stärker. Die Monster leider auch.', 'Aufgestiegen! Such dir was Schönes aus.'],
  weapon: 'Neue Waffe: {w}! Die Kampfrichter sind … unentschlossen.',
  shop: ['Werbepause! Kauf was, sonst wird’s peinlich.', 'Und jetzt: Werbung! Unsere Sponsoren haben Hunger. Auf dein Gold.'],
  death: [
    'Und das war’s für Kandidat 4711! Ein Applaus für den Hinterbliebenen-Fonds.',
    'Kandidat 4711 ist ausgeschieden. Nächste Woche: Kandidat 4712!',
    'Aus und vorbei! Die Putzkolonne ist schon unterwegs.',
  ],
  collapse: [
    'Eingestürzt. Mit dir drin. In der Branche nennen wir das ein Finale.',
    'Einsturz! Dabei hatten wir extra eine große Uhr aufgehängt.',
  ],
  quit: 'Aufgegeben? Na gut. Die Werbung läuft trotzdem.',
  boxOpen: [
    'Bronze. Immerhin nicht Holz.',
    'Silber! Fast so glänzend wie meine Moderation.',
    'GOLD! Die Zuschauer rasten aus. Also, ein bisschen.',
    'LEGENDÄR! So eine gab’s seit Staffel 12 nicht mehr!',
  ],
  junk: 'Ach, wie schön. Krempel. Ich hab ihn persönlich ausgesucht.',
  sponsor: 'Ein Paket von {s}! {slogan}',
};
