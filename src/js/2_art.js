// ---------- Pixel-Art (alles im Code gezeichnet) ----------
const PAL = {
  k: '#140c1c', K: '#2b1d36', w: '#f4f4f4', W: '#c2c3d6', g: '#8b8ba3', G: '#56566e',
  s: '#f2c49b', S: '#c98c66', h: '#5b3a29', r: '#e2434b', R: '#962637',
  t: '#2ec4b6', T: '#1b7f80', b: '#3d3d58', y: '#ffd23f', Y: '#c9901a',
  o: '#ff9a3c', O: '#b8611e', n: '#9a6a44', N: '#5e3d27',
  l: '#8be35f', L: '#3fa34d', m: '#24603a', p: '#b36bd6', P: '#6a3a8c',
  c: '#7fe0ff', C: '#3a8fd6', i: '#ff7ab8', I: '#c23d7e', e: '#ece3c8', E: '#b3a682',
  q: '#7a6a8e', Q: '#54466a', z: '#33293f', Z: '#1e1828',
};

const SPR_DEF = {
  // Kandidat 4711 – Trainingsanzug, Stirnband, Turnschuhe
  hero_a: { r: [
    '................',
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhhk...',
    '...krrrrrrrrk...',
    '...khhsssssssk..',
    '...khssssskssk..',
    '...kSsssssSsk...',
    '....kSssssk.....',
    '....kttwwttk....',
    '...kttttwttttk..',
    '...ksTttwtttTsk.',
    '....kTttwttTk...',
    '....kTTTkTTTk...',
    '....kwwbkwwbk...',
    '....kkkk.kkkk...',
  ] },
  hero_b: { from: 'hero_a', patch: {
    13: '...kTTTk.kTTk...',
    14: '...kwwbk.kwbk...',
    15: '...kkkk..kkk....',
  } },
  // Kellerratte
  rat_a: { o: { g: '#9c8a7a', G: '#6b5b4e' }, r: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...........kk...',
    '.....kkkkkkkiik.',
    '....kgggggggggk.',
    'kk.kggggggggkgk.',
    '.kkgggggggggggik',
    '...kGgggggggGGk.',
    '....kkGkkkkGkk..',
    '....kk....kk....',
    '................',
  ] },
  rat_b: { from: 'rat_a', o: { g: '#9c8a7a', G: '#6b5b4e' }, patch: {
    9: 'k...kgggggggggk.',
    10: '.k.kggggggggkgk.',
    11: '..kgggggggggggik',
    13: '....kGkkkkkGkk..',
    14: '.....kk...kk....',
  } },
  // Glibber
  slime_a: { r: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......kkkk......',
    '....kkllllkk....',
    '...kllwwlllLk...',
    '..kllwlllllllk..',
    '..kllllllllllk..',
    '.klllkllllkllLk.',
    '.kllllllllllLLk.',
    '.kLlllllllllLLk.',
    '.kLLLLLLLLLLLLk.',
    '..kkkkkkkkkkkk..',
    '................',
  ] },
  slime_b: { r: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkllwwlllkk..',
    '..kllwllllllLLk.',
    '.kllllllllllllk.',
    '.kllkllllllkllk.',
    'kllllllllllllLLk',
    'kLlllllllllllLLk',
    'kLLLLLLLLLLLLLLk',
    '.kkkkkkkkkkkkkk.',
    '................',
  ] },
  // Flatterling
  bat_a: { r: [
    '................',
    '................',
    '.k............k.',
    '.kk..........kk.',
    '.kPk..k..k..kPk.',
    '.kPPk.kkkk.kPPk.',
    '.kPPPkppppkPPPk.',
    '..kPPprpprpPPk..',
    '...kkppppppkk...',
    '.....kpkkpk.....',
    '......k..k......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ] },
  bat_b: { r: [
    '................',
    '................',
    '................',
    '................',
    '......k..k......',
    '......kkkk......',
    '..kkkkppppkkkk..',
    '.kPPPprpprpPPPk.',
    'kPPPkppppppkPPPk',
    'kPPk.kpkkpk.kPPk',
    'kPk...k..k...kPk',
    'kk............kk',
    '................',
    '................',
    '................',
    '................',
  ] },
  // Sporling
  mush_a: { r: [
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkrrwrrrrkk..',
    '..krrwwrrrrwrrk.',
    '..krrrrrrrwwrrk.',
    '.kRrrrrrrrrrrRRk',
    '.kkRRRRRRRRRRRkk',
    '...kkeeeeeeekk..',
    '....keekeekek...',
    '....keeeeeeek...',
    '....kEeeeeeEk...',
    '....kEEEEEEEk...',
    '.....kkkkkkk....',
    '................',
  ] },
  mush_b: { r: [
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkrrwrrrrkk..',
    '..krrwwrrrrwrrk.',
    '.krrrrrrrrwwrrRk',
    '.kRrrrrrrrrrrRRk',
    '.kkRRRRRRRRRRRkk',
    '...kkeeeeeeekk..',
    '....keekeekek...',
    '....keeeeeeek...',
    '....keekkkeek...',
    '....kEeeeeeEk...',
    '....kEEEEEEEk...',
    '.....kkkkkkk....',
    '................',
  ] },
  // Knochenbeamter
  skel_a: { o: { Q: '#4a4f6e' }, r: [
    '................',
    '.....kkkkkk.....',
    '....keeeeeek....',
    '...keeeeeeeek...',
    '...kekkeekkek...',
    '...keeekkeeek...',
    '....keEeEeEk....',
    '.....kkkkkk.....',
    '....kQwrrwQk....',
    '...kQQwrrwQQk...',
    '..keQQQrRQQQek..',
    '..keQQQRrQQQek..',
    '...kQQQQQQQQk...',
    '....kQQkkQQk....',
    '....keekkeek....',
    '................',
  ] },
  skel_b: { from: 'skel_a', o: { Q: '#4a4f6e' }, patch: {
    13: '....kQQk.kQQk...',
    14: '...keek..keek...',
  } },
  chest: { r: [
    '................',
    '................',
    '...kkkkkkkkkk...',
    '..knnnnnnnnnnk..',
    '..knNNNNNNNNnk..',
    '..kyyyyyyyyyyk..',
    '..knnnnnnnnnnk..',
    '..kkkkkyykkkkk..',
    '..kNNNNyyNNNNk..',
    '..knnnnYYnnnnk..',
    '..knnnnnnnnnnk..',
    '..kyyyyyyyyyyk..',
    '..knnnnnnnnnnk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ] },
  chest_open: { r: [
    '................',
    '..kkkkkkkkkkkk..',
    '..knnnnnnnnnnk..',
    '..kNNNNNNNNNNk..',
    '..kkkkkkkkkkkk..',
    '..kKKKKKKKKKKk..',
    '..kKKyKKKwKKKk..',
    '..kkkkkkkkkkkk..',
    '..kNNNNNNNNNNk..',
    '..knnnnnnnnnnk..',
    '..knnnnnnnnnnk..',
    '..kyyyyyyyyyyk..',
    '..knnnnnnnnnnk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ] },
  // Beißkiste
  mimic: { r: [
    '................',
    '..kkkkkkkkkkkk..',
    '..knnnnnnnnnnk..',
    '..kNNyNNNNyNNk..',
    '..kwkwkwkwkwkk..',
    '..kRRRRRRRRRRk..',
    '..kRRiiiiiiRRk..',
    '..kRiiiiiiiiRk..',
    '..kkwkwkwkwkwk..',
    '..kyyyyyyyyyyk..',
    '..knnnnYYnnnnk..',
    '..knnnnnnnnnnk..',
    '..kNNNNNNNNNNk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ] },
  stairs: { r: [
    'kkkkkkkkkkkkkkkk',
    'kQQQQQQQQQQQQQQk',
    'kQWWWWWWWWWWWWQk',
    'kQGGGGGGGGGGGGQk',
    'kQggggggggggggQk',
    'kQzzzzzzzzzzzzQk',
    'kQGGGGGGGGGGGGQk',
    'kQKKKKKKKKKKKKQk',
    'kQzzzzzzzzzzzzQk',
    'kQkkkkkkkkkkkkQk',
    'kQKKKKKKKKKKKKQk',
    'kQkkkkkkkkkkkkQk',
    'kQkkkkkkkkkkkkQk',
    'kQkkkkkkkkkkkkQk',
    'kQQQQQQQQQQQQQQk',
    'kkkkkkkkkkkkkkkk',
  ] },
  torch_a: { r: [
    '................',
    '................',
    '........y.......',
    '.......yy.......',
    '......yoy.......',
    '......ooyo......',
    '......oroo......',
    '.......rr.......',
    '......kNNk......',
    '......kNNk......',
    '.......kk.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ] },
  torch_b: { from: 'torch_a', patch: {
    2: '.......y........',
    3: '.......yy.......',
    4: '......yyoy......',
    5: '......oyoo......',
    6: '......ooro......',
  } },
  bones: { r: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..ee.......ee...',
    '..eEe.....eEe...',
    '...eEEEEEEEe....',
    '..eEe.....eEe...',
    '..ee.......ee...',
    '................',
    '................',
  ] },
  crate: { r: [
    '................',
    '.kkkkkkkkkkkkkk.',
    '.knnnnnnnnnnnnk.',
    '.knNNNNNNNNNNnk.',
    '.knNnnnyynnnNnk.',
    '.knNnnyyyynnNnk.',
    '.knNyyyyyyyyNnk.',
    '.knNnyyyyyynNnk.',
    '.knNnnyyyynnNnk.',
    '.knNnyynnyynNnk.',
    '.knNnynnnnynNnk.',
    '.knNNNNNNNNNNnk.',
    '.knnnnnnnnnnnnk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
  ] },
  potion: { r: [
    '................',
    '.......kk.......',
    '......knnk......',
    '......kkkk......',
    '.......kWk......',
    '.......kWk......',
    '......kWWWk.....',
    '.....kWrrrWk....',
    '....kWrrrrrrk...',
    '....krrwrrrrk...',
    '....krwrrrrRk...',
    '....krrrrrrRk...',
    '....kRrrrrRRk...',
    '.....kRRRRRk....',
    '......kkkkk.....',
    '................',
  ] },
  coin: { r: [
    '..kkkk..',
    '.kyyyyk.',
    'kyywyyYk',
    'kywyyyYk',
    'kyyyyyYk',
    'kyyyyYYk',
    '.kYYYYk.',
    '..kkkk..',
  ] },
  heart: { r: [
    '........',
    '.kk.kk..',
    'krrkrrk.',
    'krwrrrk.',
    'krrrrRk.',
    '.krrRk..',
    '..kRk...',
    '...k....',
  ] },
  box: { r: [
    '................',
    '.....kk..kk.....',
    '....kCCkkCCk....',
    '....kCkCCkCk....',
    '.....kkCCkk.....',
    '..kkkkkCCkkkkk..',
    '..kAAAACCAAAAk..',
    '..kBBBBCCBBBBk..',
    '..kkkkkCCkkkkk..',
    '...kAAACCAAAk...',
    '...kAAACCAAAk...',
    '...kAAACCAAAk...',
    '...kBBBCCBBBk...',
    '...kBBBCCBBBk...',
    '...kkkkkkkkkk...',
    '................',
  ] },
  box_b: { from: 'box', o: { A: '#e08a4a', B: '#a85a2a', C: '#ffd23f' } },
  box_s: { from: 'box', o: { A: '#dfe3f0', B: '#9aa0b8', C: '#7fe0ff' } },
  box_g: { from: 'box', o: { A: '#ffd23f', B: '#c9901a', C: '#ff4f8b' } },
  box_l: { from: 'box', o: { A: '#c58cff', B: '#7a4fc0', C: '#ffd23f' } },
  crown: { r: [
    'y...y...y',
    'yy.yyy.yy',
    'yyyyyyyyy',
    'yryycyyry',
    'yyyyyyyyy',
    'YYYYYYYYY',
  ] },
  // ZYNIKA, die Moderations-KI
  zyn_a: { o: { P: '#d8336f' }, r: [
    '....k......k....',
    '.....k....k.....',
    '......k..k......',
    '.kkkkkkkkkkkkkk.',
    '.kPPPPPPPPPPPPk.',
    '.kPkkkkkkkkkPPk.',
    '.kPkccccccckPyk.',
    '.kPkcwkcwkckPPk.',
    '.kPkccccccckPyk.',
    '.kPkcckkkcckPPk.',
    '.kPkccccccckPPk.',
    '.kPkkkkkkkkkPPk.',
    '.kPPPPPPPPPPPPk.',
    '.kkkkkkkkkkkkkk.',
    '...kk......kk...',
    '................',
  ] },
  zyn_b: { from: 'zyn_a', o: { P: '#d8336f' }, patch: {
    9: '.kPkckkkkkckPPk.',
    10: '.kPkcckrkcckPPk.',
  } },
  // Icons
  i_glass: { r: [
    '.kkkkkkkkkk.',
    '.knnnnnnnnk.',
    '..kyyyyyyk..',
    '...kyyyyk...',
    '....kyyk....',
    '.....kk.....',
    '.....kk.....',
    '....k..k....',
    '...k.yy.k...',
    '..kyyyyyyk..',
    '.knnnnnnnnk.',
    '.kkkkkkkkkk.',
  ] },
  i_eye: { r: [
    '...kkkkk...',
    '.kkwwwwwkk.',
    'kwwwkkkwwwk',
    'kwwkCwCkwwk',
    'kwwwkkkwwwk',
    '.kkwwwwwkk.',
    '...kkkkk...',
  ] },
  i_skull: { r: [
    '..kkkk..',
    '.kwwwwk.',
    'kwwwwwwk',
    'kwkwwkwk',
    'kwwwwwwk',
    '.kwkkwk.',
    '.kwwwwk.',
    '..kkkk..',
  ] },
  i_star: { r: [
    '....k....',
    '...kyk...',
    'kkkyyykkk',
    'kyyyyyyyk',
    '.kyyyyyk.',
    '..kyyyk..',
    '.kyykyyk.',
    '.kyk.kyk.',
    '.kk...kk.',
  ] },
  i_boot: { r: [
    '..kkkk.....',
    '..ktTk.....',
    '..ktTkk....',
    '..kttwwk...',
    '.ktttwwwkk.',
    'kttttttttwk',
    'kwwwwwwwwwk',
    '.kkkkkkkkk.',
  ] },
  i_shield: { r: [
    'kkkkkkkkkk',
    'kWWWWWWWgk',
    'kWccccccgk',
    'kWccccccgk',
    'kWccccccgk',
    '.kWccccgk.',
    '.kWccccgk.',
    '..kWccgk..',
    '...kWgk...',
    '....kk....',
  ] },
  i_bolt: { r: [
    '....kkk.',
    '...kyyk.',
    '..kyyk..',
    '.kyyk...',
    'kyyyykkk',
    'kkkyyyyk',
    '...kyyk.',
    '..kyyk..',
    '..kyk...',
    '.kyk....',
    '.kk.....',
  ] },
  i_magnet: { r: [
    'kkkk..kkkk',
    'kwwk..kwwk',
    'kwwk..kwwk',
    'krrk..krrk',
    'krrk..krrk',
    'krrk..krrk',
    'krrrkkrrrk',
    '.krrrrrrk.',
    '..kkkkkk..',
  ] },
  i_range: { r: [
    '...k....k...',
    '..kk....kk..',
    '.kwkkkkkkwk.',
    'kwwwwwwwwwwk',
    '.kwkkkkkkwk.',
    '..kk....kk..',
    '...k....k...',
  ] },
  i_sword: { r: [
    '..........kk',
    '.........kwk',
    '........kwWk',
    '.......kwWk.',
    '......kwWk..',
    '..kk.kwWk...',
    '..kYkwWk....',
    '...kYWk.....',
    '...knYk.....',
    '..knkkYk....',
    '.knk..kk....',
    '.kk.........',
  ] },
  i_sock: { r: [
    '..kkkkk...',
    '..kwwwk...',
    '..krrrk...',
    '..kwwwk...',
    '..kwwwk...',
    '..kwwwk...',
    '..kwwwwk..',
    '..kwwwwwk.',
    '.kwwwwwwwk',
    '.kwwwwwwwk',
    '..kkkkkkk.',
    '..........',
  ] },
  // Waffen (senkrecht)
  w0: { r: [
    '................',
    '...kkkkkkkkkk...',
    '...kGggggggGk...',
    '...kkkkkkkkkk...',
    '......kWWk......',
    '......kWWk......',
    '.....kkkkkk.....',
    '.....kCccCk.....',
    '.....kCwcCk.....',
    '.....kCwcCk.....',
    '.....kCccCk.....',
    '.....kCccCk.....',
    '.....kCccCk.....',
    '.....kkkkkk.....',
    '....kGGGGGGk....',
    '....kkkkkkkk....',
  ] },
  w1: { o: { o: '#e8bf8a', O: '#b47c4a' }, r: [
    '................',
    '.......kk.......',
    '......kNNk......',
    '......kNNk......',
    '.....kkkkkk.....',
    '.....kwooOk.....',
    '.....kwooOk.....',
    '.....koooOk.....',
    '.....koooOk.....',
    '.....koooOk.....',
    '.....kooOOk.....',
    '.....kkkkkk.....',
    '......kNNk......',
    '......kNNk......',
    '.......kk.......',
    '................',
  ] },
  w2: { r: [
    '....kkkkkkkk....',
    '....kNNNNNNk....',
    '....kkkNNkkk....',
    '......knnk......',
    '......knnk......',
    '......knnk......',
    '......knnk......',
    '......knnk......',
    '.....kkkkkk.....',
    '....kWWWWWWk....',
    '....kWggggGk....',
    '....kWggggGk....',
    '.....kWggGk.....',
    '......kWGk......',
    '.......kk.......',
    '................',
  ] },
  w3: { r: [
    '......kkkk......',
    '.....kWWWWk.....',
    '.....kWkkWk.....',
    '....kWk..kWk....',
    '....krk..krk....',
    '....krk..krk....',
    '....krk..krk....',
    '....kWk..kWk....',
    '...kWk....kWk...',
    '...kWk....kWk...',
    '...kWk....kWk...',
    '..kWk......kWk..',
    '..kWk......kWk..',
    '..kWWk....kWWk..',
    '..kkk......kkk..',
    '................',
  ] },
  w4: { r: [
    '................',
    '....kkkkkk......',
    '....kk..kk......',
    '...kkkkkkkkk....',
    '...kllllllLk....',
    '...klwllllLk....',
    '...kllllllLk....',
    '...kLLLLLLLk....',
    '...kkkkkkkkk....',
    '.....kGGk.......',
    '.....kGGk.......',
    '.....kGGk.......',
    '.....kGGk.......',
    '....kGGGGk......',
    '....kkkkkk......',
    '................',
  ] },
  w5: { r: [
    '.......kk.......',
    '......kWOk......',
    '......kWgk......',
    '......kWOk......',
    '......kWgk......',
    '......kOgk......',
    '......kWgk......',
    '......kWOk......',
    '......kWgk......',
    '...kkkkkkkkkk...',
    '...kYYYYYYYYk...',
    '...kkkkNNkkkk...',
    '......kNNk......',
    '......kNNk......',
    '.....kYYYYk.....',
    '.....kkkkkk.....',
  ] },
  w6: { r: [
    '................',
    '.....kkkkkk.....',
    '....kWcWcWck....',
    '...kWcWcWcWck...',
    '...kcWcWiWcWk...',
    '...kWcWcWcWck...',
    '...kcWcWcWcWk...',
    '....kcWcWcWk....',
    '.....kkkkkk.....',
    '......knnk......',
    '......knnk......',
    '......knnk......',
    '......knnk......',
    '......knnk......',
    '......kNNk......',
    '.......kk.......',
  ] },
  w7: { r: [
    '...k.k.k.k.k....',
    '...kWkWkWkWk....',
    '..kWWWWWWWWWk...',
    '..kWWWWWWWWWk...',
    '..kWWWWWWWWWk...',
    '...kyyyyyyyk....',
    '......kyyk......',
    '......kyYk......',
    '......kyYk......',
    '......kyYk......',
    '......kyYk......',
    '......kyYk......',
    '......kyYk......',
    '.....kyyyYk.....',
    '.....kYYYYk.....',
    '......kkkk......',
  ] },
};
// Boss-Farbvarianten (Glibber in Rot, Lila, Gold)
for (const [suf, over] of [
  ['R', { l: '#ff8a8a', L: '#c23d4e' }],
  ['P', { l: '#c79bff', L: '#7a4fc0' }],
  ['G', { l: '#ffe680', L: '#c9901a' }],
]) {
  SPR_DEF['slime' + suf + '_a'] = { from: 'slime_a', o: over };
  SPR_DEF['slime' + suf + '_b'] = { from: 'slime_b', o: over };
}

const SPR = {};
const SPRW = {};
const SPR_ERR = [];
function rowsOf(name) {
  const d = SPR_DEF[name];
  let rows = d.r ? d.r.slice() : rowsOf(d.from).slice();
  if (d.patch) for (const k in d.patch) rows[+k] = d.patch[k];
  return rows;
}
function buildSprite(name) {
  const d = SPR_DEF[name];
  const rows = rowsOf(name);
  const w = rows[0].length, h = rows.length;
  rows.forEach((row, j) => { if (row.length !== w) SPR_ERR.push(name + ' Zeile ' + j + ': ' + row.length); });
  const c = mkCanvas(w, h), x = c.getContext('2d');
  const over = d.o || (d.from && SPR_DEF[d.from].o) || null;
  for (let j = 0; j < h; j++) {
    const row = rows[j];
    for (let i = 0; i < w; i++) {
      const ch = row[i];
      if (!ch || ch === '.') continue;
      const col = (over && over[ch]) || PAL[ch];
      if (!col) continue;
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    }
  }
  return c;
}
function whiteOf(c) {
  const w = mkCanvas(c.width, c.height), x = w.getContext('2d');
  x.drawImage(c, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#fff';
  x.fillRect(0, 0, w.width, w.height);
  return w;
}

// ---------- Prozedurale Kacheln ----------
const TILE = { floor: [], front: [], top: null };
function px(x, i, j, col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
function floorTile(r, v) {
  const c = mkCanvas(TS, TS), x = c.getContext('2d');
  const base = ['#4b3e48', '#483b45', '#4d404a', '#463a44'][v];
  x.fillStyle = base; x.fillRect(0, 0, TS, TS);
  for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) {
    const q = r();
    if (q < 0.1) px(x, i, j, '#56495a');
    else if (q > 0.92) px(x, i, j, '#3b303a');
  }
  x.fillStyle = '#5c4f60';
  x.fillRect(1, 1, 15, 1); x.fillRect(0, 9, 8, 1); x.fillRect(9, 9, 7, 1);
  x.fillStyle = '#2a2129';
  x.fillRect(0, 0, TS, 1); x.fillRect(0, 8, TS, 1);
  x.fillRect(0, 1, 1, 7); x.fillRect(8, 9, 1, 7);
  if (v === 2) { // Riss
    let i = 3 + ((r() * 6) | 0), j = 2;
    while (j < 14) { px(x, i, j, '#2a2129'); j++; i += r() < 0.5 ? -1 : 1; i = clamp(i, 1, 14); }
  }
  if (v === 3) { // Moos
    for (let k = 0; k < 14; k++) px(x, 2 + ((r() * 12) | 0), 10 + ((r() * 5) | 0), r() < 0.5 ? '#3f5a3e' : '#4d6b47');
  }
  return c;
}
function frontTile(r) {
  const c = mkCanvas(TS, TS), x = c.getContext('2d');
  x.fillStyle = '#2b2331'; x.fillRect(0, 0, TS, 3);
  x.fillStyle = '#7a6889'; x.fillRect(0, 3, TS, 1);
  x.fillStyle = '#5a4a68'; x.fillRect(0, 4, TS, 12);
  for (let j = 4; j < 15; j++) for (let i = 0; i < TS; i++) {
    const q = r();
    if (q < 0.1) px(x, i, j, '#65547a'); else if (q > 0.93) px(x, i, j, '#4c3e59');
  }
  x.fillStyle = '#2f2638';
  for (let row = 0; row < 3; row++) {
    const y = 4 + row * 4;
    x.fillRect(0, y + 3, TS, 1);
    const off = row % 2 ? 4 : 0;
    for (let bx = off; bx < TS; bx += 8) x.fillRect(bx, y, 1, 3);
  }
  x.fillStyle = '#6b5a7d';
  for (let row = 0; row < 3; row++) x.fillRect(0, 4 + row * 4, TS, 1);
  x.fillStyle = '#211a27'; x.fillRect(0, 15, TS, 1);
  return c;
}
function topTile(r) {
  const c = mkCanvas(TS, TS), x = c.getContext('2d');
  x.fillStyle = '#2b2331'; x.fillRect(0, 0, TS, TS);
  for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) {
    const q = r();
    if (q < 0.08) px(x, i, j, '#332a3b'); else if (q > 0.94) px(x, i, j, '#241d2a');
  }
  return c;
}

// ---------- Mini-Pixelschrift 3x5 ----------
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001',
  5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '!': '010010010000010', '+': '000010111010000', '-': '000000111000000', ':': '000010000010000', '.': '000000000000010',
  '?': '110001010000010', '%': '101001010100101', '/': '001001010100100', ' ': '000000000000000',
};
function drawText(x, str, cx, y, col, sc) {
  sc = sc || 1;
  str = String(str).toUpperCase().replace(/Ä/g, 'A').replace(/Ö/g, 'O').replace(/Ü/g, 'U').replace(/ß/g, 'SS');
  const w = str.length * 4 * sc - sc;
  const x0 = Math.round(cx - w / 2), y0 = Math.round(y);
  for (let pass = 0; pass < 2; pass++) {
    x.fillStyle = pass ? col : '#140c1c';
    const o = pass ? 0 : sc;
    for (let n = 0; n < str.length; n++) {
      const g = FONT[str[n]];
      if (!g) continue;
      const gx = x0 + n * 4 * sc;
      for (let i = 0; i < 15; i++) if (g.charCodeAt(i) === 49) x.fillRect(gx + (i % 3) * sc + o, y0 + ((i / 3) | 0) * sc + o, sc, sc);
    }
  }
}

// ---------- Aufbau & Icons für die Oberfläche ----------
const URLC = {};
function sprURL(name, scale) {
  scale = scale || 4;
  const key = name + '@' + scale;
  if (URLC[key]) return URLC[key];
  const s = SPR[name];
  if (!s) return '';
  const c = mkCanvas(s.width * scale, s.height * scale), x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(s, 0, 0, c.width, c.height);
  return (URLC[key] = c.toDataURL());
}
function buildArt() {
  for (const k in SPR_DEF) { SPR[k] = buildSprite(k); SPRW[k] = whiteOf(SPR[k]); }
  const r = mulberry32(4711);
  for (let v = 0; v < 4; v++) TILE.floor.push(floorTile(r, v));
  for (let v = 0; v < 3; v++) TILE.front.push(frontTile(r));
  TILE.top = topTile(r);
  if (SPR_ERR.length) console.warn('Sprite-Fehler:', SPR_ERR.join(' | '));
}
