/* troxonomika - ocr-parser.js v6
   parseDocument(κείμενο) -> { fields, warnings }
   toForm(αποτέλεσμα) -> τιμές έτοιμες για τη φόρμα υπόθεσης
   Αρχή: ΜΗΔΕΝ επινοείται. Ύποπτα μεγάλα πεδία -> κενό + warning.
   Διορθώσεις v6:
   - Split ανά πέρασμα με ΓΕΝΙΚΟ pattern [..] (μελλοντικά ασφαλές).
   - Σκληρό όριο μήκους σε ΟΛΑ τα string πεδία.
   - Άρθρο: δέχεται «παρ.» / «περ.» / «§» / «ς» / «β».
   - Τόπος: απαιτεί χιλιομετρική θέση (ήδη v5). */
(function (root) {
  'use strict';

  function prepare(text) {
    let cleaned = String(text || '').replace(/\[[^\]]*\]/g, ' ');
    let orig = cleaned.replace(/\s+/g, ' ').trim();
    let flat = '';
    for (const ch of orig) {
      const b = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
      flat += b.length === ch.length ? b : ch;
    }
    if (flat.length !== orig.length) orig = flat;
    return { orig, flat };
  }

  const iso = (d, m, y) => {
    d = +d; m = +m; y = +y;
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  };

  const MONTHS = {
    ιανουαριου:1, φεβρουαριου:2, μαρτιου:3, απριλιου:4, μαιου:5, ιουνιου:6,
    ιουλιου:7, αυγουστου:8, σεπτεμβριου:9, οκτωβριου:10, νοεμβριου:11, δεκεμβριου:12
  };

  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  function hasVowel(s) { return /[ΑΕΙΟΥΩ]/.test(s); }
  function consonantRatio(s) {
    const L = [...s].filter(c => /[Α-ΩA-Z]/.test(c));
    if (!L.length) return 1;
    const v = L.filter(c => /[ΑΕΙΟΥΩ]/.test(c)).length;
    return 1 - v / L.length;
  }

  /* ---------- ΟΡΙΑ ΜΗΚΟΥΣ ---------- */
  const MAXLEN = { plate: 10, name: 60, service: 40, address: 80, place: 90, article: 20, violationText: 160, protocol: 30 };
  function bounded(value, key, warnings) {
    if (value == null) return null;
    const s = String(value);
    if (s.length > (MAXLEN[key] || 999)) {
      warnings.push('Πεδίο «' + key + '» φάνηκε ύποπτα μεγάλο (' + s.length + ' χρ.). Αθεωρήθηκε — συμπλήρωσέ το χειροκίνητα.');
      return null;
    }
    return value;
  }

  /* ---------- ΓΝΗΣΙΟΙ ΤΟΠΟΙ ---------- */
  const KNOWN_PLACES = [
    'ΒΟΛΟΥ','ΒΟΛΟ','ΛΑΡΙΣΑΣ','ΛΑΡΙΣΑ','ΛΑΜΙΑΣ','ΛΑΜΙΑ','ΚΑΛΑΜΑΡΙΑΣ','ΚΑΛΑΜΑΡΙΑ',
    'ΘΕΣΣΑΛΟΝΙΚΗΣ','ΘΕΣΣΑΛΟΝΙΚΗ','ΑΘΗΝΩΝ','ΑΘΗΝΑ','ΠΕΙΡΑΙΑΣ','ΠΕΙΡΑΙΑ','ΧΑΝΙΩΝ','ΧΑΝΙΑ',
    'ΗΡΑΚΛΕΙΟΥ','ΗΡΑΚΛΕΙΟ','ΡΟΔΟΥ','ΡΟΔΟΣ','ΙΩΑΝΝΙΝΩΝ','ΙΩΑΝΝΙΝΑ','ΑΡΤΑΣ','ΑΡΤΑ',
    'ΠΡΕΒΕΖΑΣ','ΠΡΕΒΕΖΑ','ΞΑΝΘΗΣ','ΞΑΝΘΗ','ΚΟΜΟΤΗΝΗΣ','ΚΟΜΟΤΗΝΗ','ΡΟΔΟΠΗΣ','ΡΟΔΟΠΗ',
    'ΕΒΡΟΥ','ΕΒΡΟΣ','ΔΡΑΜΑΣ','ΔΡΑΜΑ','ΚΑΒΑΛΑΣ','ΚΑΒΑΛΑ','ΣΕΡΡΩΝ','ΣΕΡΡΕΣ','ΚΙΛΚΙΣ',
    'ΘΕΣΠΡΩΤΙΑΣ','ΘΕΣΠΡΩΤΙΑ','ΜΑΓΝΗΣΙΑΣ','ΜΑΓΝΗΣΙΑ','ΠΙΕΡΙΑΣ','ΠΙΕΡΙΑ','ΚΑΡΔΙΤΣΑΣ',
    'ΚΑΡΔΙΤΣΑ','ΤΡΙΚΑΛΩΝ','ΤΡΙΚΑΛΑ','ΓΡΕΒΕΝΩΝ','ΓΡΕΒΕΝΑ','ΚΟΖΑΝΗΣ','ΚΟΖΑΝΗ','ΦΛΩΡΙΝΑΣ',
    'ΦΛΩΡΙΝΑ','ΚΑΣΤΟΡΙΑΣ','ΚΑΣΤΟΡΙΑ','ΛΗΤΗΣ','ΛΗΤΗ','ΘΕΡΜΗΣ','ΘΕΡΜΗ',
    'ΧΑΛΚΗΔΟΝΑΣ','ΧΑΛΚΗΔΟΝΑ','ΑΣΠΡΟΒΑΛΤΑΣ','ΑΣΠΡΟΒΑΛΤΑ','ΜΟΥΔΑΝΙΩΝ','ΜΟΥΔΑΝΙΑ',
    'ΤΟΥΜΠΑΣ','ΤΟΥΜΠΑ','ΚΑΣΣΑΝΔΡΕΙΑΣ','ΚΑΣΣΑΝΔΡΕΙΑ','ΤΗΝΟΥ','ΤΗΝΟΣ','ΧΑΛΚΙΔΙΚΗΣ',
    'ΧΑΛΚΙΔΙΚΗ','ΠΑΘΕ','ΕΙΣΑΓΓΕΛΙΑ','ΝΙΚΑΙΑΣ','ΝΙΚΑΙΑ','ΚΟΡΥΔΑΛΛΟΥ','ΚΟΡΥΔΑΛΛΟΣ',
    'ΑΓΙΩΝ','ΑΓΙΟΙ','ΚΗΦΙΣΙΑΣ','ΚΗΦΙΣΙΑ','ΜΑΡΟΥΣΙΟΥ','ΜΑΡΟΥΣΙ','ΧΑΛΑΝΔΡΙΟΥ','ΧΑΛΑΝΔΡΙ',
    'ΖΩΓΡΑΦΟΥ','ΖΩΓΡΑΦΟ','ΝΕΑΣΙΜΥΡΝΗΣ','ΝΕΑΣΜΥΡΝΗΣ','ΓΛΥΦΑΔΑΣ','ΓΛΥΦΑΔΑ','ΒΑΡΙΛΗΣ',
    'ΒΑΡΗΣ','ΚΑΤΟΠΟΥΔΙΑΣ','ΑΜΦΙΛΟΧΗΣ','ΑΡΤΗΣ','ΠΥΛΟΥ','ΠΥΛΟΣ','ΤΡΙΠΟΛΗΣ','ΤΡΙΠΟΛΗ',
    'ΚΑΛΑΜΑΤΑΣ','ΚΑΛΑΜΑΤΑ','ΜΕΣΣΗΝΗΣ','ΑΡΓΟΣ','ΑΡΓΟΥΣ','ΝΑΥΠΛΙΟΣ','ΝΑΥΠΛΙΑΣ',
    'ΚΟΡΙΝΘΟΣ','ΚΟΡΙΝΘΟΥ','ΛΟΥΤΡΑΚΙΟΥ','ΛΟΥΤΡΑΚΙ','ΔΕΛΦΩΝ','ΔΕΛΦΟΙ','ΑΜΦΙΣΣΑΣ',
    'ΑΜΦΙΣΑ','ΛΕΒΑΔΕΙΑΣ','ΛΕΒΑΔΕΙΑ','ΣΤΥΡΑΣ','ΣΤΥΡΑ','ΑΙΓΙΟΥ','ΑΙΓΙΟ','ΟΡΕΣΤΙΑΔΑΣ'
  ];
  const KNOWN_SET = new Set(KNOWN_PLACES);

  const PLACE_BLACKLIST = new Set([
    'ΙΔΙΟΚΤΗΤΗ','ΙΔΙΟΚΤΗ','ΟΔΟΣ','ΟΔΟΥ','ΚΑΤΟΙΚΟΣ','ΚΑΤΟΙΚΩΝ','ΚΑΤΟΙΚΙΑΣ','ΠΕΡΙΦΕΡΕΙΑ',
    'ΔΙΚΑΙΟΔΟΣΙΑΣ','ΑΥΤΟΚΙΝΗΤΟΥ','ΑΥΤΟΚΙΝΗΤΟ','ΙΧΕ','ΙΧΕΓ','ΑΡΙΘ','ΑΡΙΘΜ','ΑΡΙΘΜΟ',
    'ΠΡΑΞΗ','ΚΛΗΣΗ','ΟΔΗΓΟΣ','ΟΔΗΓΟΥ','ΟΔΗΓΟ','ΙΣΧΥΡΙΣΤΕΙ','ΔΗΛΩΣΗ','ΔΗΛΩΣΗΣ','ΥΠΕΥΘΥΝΗ',
    'ΠΡΟΣΚΛΗΣΗ','ΠΑΡΑΒΑΤΗ','ΠΑΡΑΒΑΤΗΣ','ΠΑΡΑΒΑΣΗΣ','ΠΑΡΑΒΑΣΗ','ΥΠΟΓΡΑΦΟΝΤΑ','ΕΝΣΤΑΣΕΩΣ',
    'ΠΡΟΘΕΣΜΙΑΣ','ΠΡΟΘΕΣΜΙΑ','ΗΜΕΡΟΜΗΝΙΑ','ΗΜΕΡΟΜΗΝΙΑΣ','ΒΕΒΑΙΩΣΗΣ','ΒΕΒΑΙΩΣΗ','ΔΙΑΠΙΣΤΩΣΗΣ',
    'ΤΑΧΥΤΗΤΑ','ΤΑΧΥΤΗΤΑΣ','ΟΡΙΟΥ','ΟΡΙΟ','ΑΝΩΤΑΤΟΥ','ΕΠΙΤΡΕΠΟΜΕΝΟΥ','ΕΠΙΤΡΕΠΟΜΕΝΗ','ΝΙΚΟΛΑΟΥ',
    'ΝΙΚΟΛΑΟ','ΝΙΚΟΛΑΟΣ','ΜΕ','ΤΗΝ','ΤΟΝ','ΤΟΥ','ΤΗΣ','ΑΠΟ','ΚΑΙ','ΔΕ','ΓΙΑ','ΜΕΤΑ','ΠΡΙΝ',
    'ΕΦΟΣΟΝ','ΔΙΑΦΟΡΕΤΙΚΑ','ΛΟΓΙΖΕΤΑΙ','ΕΙΝΑΙ','ΠΩΣ','ΔΕΝ','ΟΤΙ','ΠΟΥ','ΠΟΣ','ΠΟΙΟΣ','ΗΤΑΝ',
    'ΚΑΤΑ','ΧΡΟΝΟ','ΣΤΗ','ΣΤΗΝ','ΣΤΟΝ','ΣΤΟ','ΣΕ','ΣΑΣ','ΜΑΣ','ΣΟΥ','ΜΟΥ','ΔΙΑ','ΔΙΑΣΤΗΜΑ',
    'ΔΙΑΣΤΑΣΗ','ΔΙΑΣΗ','ΟΡΟΝΑΟ','ΠΡΟΝΑΟ','ΠΡΟΝΣΟΥ','ΕΝΑΛΛΑΚΤΙΚΗ','ΣΕΛΙΔΑ','ΚΕΦΑΛΙΔΑ','ΠΑΡΑΓΡΑΦΟΣ'
  ]);

  const SUFFIX_OK = /(ΑΣ|ΟΥ|ΗΣ|ΩΝ|ΕΩΣ|ΑΔΑΣ|ΙΝΩΝ|ΕΣ|Α|Ο|Η|Ω)$/;

  function cityOk(tok) {
    const t = String(tok || '').toUpperCase().replace(/[^Α-ΩA-Z]/g, '');
    if (t.length < 3 || t.length > 14) return null;
    if (PLACE_BLACKLIST.has(t)) return null;
    if (!hasVowel(t)) return null;
    if (KNOWN_SET.has(t)) return t;
    for (const k of KNOWN_PLACES) {
      if (Math.abs(k.length - t.length) <= 2 && lev(k, t) <= 2) return k;
    }
    if (t.length >= 4 && consonantRatio(t) < 0.8 && SUFFIX_OK.test(t)) return t;
    return null;
  }

  /* ---------- ΠΙΝΑΚΙΔΑ ---------- */
  const PLATE_LETTERS = 'ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ';
  const LAT2GR = { A:'Α',B:'Β',E:'Ε',Z:'Ζ',H:'Η',I:'Ι',K:'Κ',M:'Μ',N:'Ν',O:'Ο',P:'Ρ',T:'Τ',Y:'Υ',X:'Χ' };
  const DIG2LET = { '0':'Ο','1':'Ι','2':'Ζ','8':'Β' };
  const LET2DIG = { 'Ο':'0','O':'0','Ι':'1','I':'1','L':'1','|':'1','Ζ':'2','Z':'2','Β':'8','B':'8','S':'5' };

  function fixLetter(c) { c = c.toUpperCase(); c = LAT2GR[c] || DIG2LET[c] || c; return PLATE_LETTERS.includes(c) ? c : null; }
  function fixDigit(c) { if (/\d/.test(c)) return c; return LET2DIG[c.toUpperCase()] || null; }
  function fixPlate(a, b) {
    const L = [...a].map(fixLetter), D = [...b].map(fixDigit);
    if (L.includes(null) || D.includes(null)) return null;
    return L.join('') + '-' + D.join('');
  }
  function plateCandidate(raw) {
    const s = String(raw || '').toUpperCase().replace(/[‐‑‒–—−]/g, '-').replace(/\s+/g, '');
    const m = s.match(/([Α-ΩA-Z0-9]{3})-?([Α-ΩA-Z0-9]{4})/);
    if (!m) return null;
    return fixPlate(m[1], m[2]);
  }
  function findPlate(flat) {
    const contexts = [];
    const anchor = /(?:υπ\s*['’΄]?\s*αριθ|υπ\s*αριθ|αριθ\s*κυκλοφορ|οδηγός\s*του)/ig;
    let a;
    while ((a = anchor.exec(flat))) contexts.push(flat.slice(a.index, Math.min(flat.length, a.index + 160)));
    for (const c of contexts) {
      const m = c.match(/([Α-ΩA-Z0-9]{3})\s*[-‐‑‒–—]?\s*([Α-ΩA-Z0-9]{4})/i);
      if (m) { const p = plateCandidate(m[1] + '-' + m[2]); if (p) return p; }
    }
    const re = /(?<![A-Za-zΑ-Ωα-ω0-9])([A-Za-zΑ-Ωα-ω0-9]{3})\s?[-–—]?\s?([A-Za-zΑ-Ωα-ω0-9]{4})(?![A-Za-zΑ-Ωα-ω0-9])/g;
    let m;
    while ((m = re.exec(flat))) { const p = plateCandidate(m[1] + '-' + m[2]); if (p) return p; }
    return null;
  }

  /* ---------- ΗΜΕΡΕΣ (χωρίς \b) ---------- */
  const DAY_WORDS = {
    δεκα:10, δεκαπεντε:15, εικοσι:20, τριαντα:30, σαραντα:40, πενηντα:50,
    εξηντα:60, εβδομηκοντα:70, εβδομηκοσι:70, ογδοντα:80, ογδοηκοσι:80,
    ενενηντα:90, εκατο:100, εκατον:100, διακοσιες:200, πεντακοσιες:500,
    μια:1, δυο:2, τρεις:3, τρια:3, τεσσερις:4, τεσσερα:4,
    πεντε:5, εξι:6, επτα:7, εφτα:7, οκτω:8, οχτω:8, εννια:9, εννεα:9,
    δεκαεννια:19, δεκαοκτω:18, δεκαεπτα:17, δεκαεξι:16
  };
  const DAY_RE = Object.keys(DAY_WORDS).join('|');
  const PRE = '(?:^|[\\s,;:.()])';

  function parseDays(flat, warnings) {
    const reWord = new RegExp(
      PRE + '(?:για[\\s,;:.()]+)?(?:χρονικο|οροναο|προναο|προνοσο|χροναο)[^\\s]{0,4}[\\s,;:.()]*(?:διαστη|διασ|δισ|διαση|διασημα)[^\\s]{0,4}[\\s,;:.()]*(' + DAY_RE + ')\\s*(?:\\([^)]{0,8}\\))?\\s*ημερ', 'i'
    );
    let m = flat.match(reWord);
    if (!m) {
      const reAlone = new RegExp(PRE + '(' + DAY_RE + ')\\s*(?:\\([^)]{0,8}\\))?\\s*ημερ', 'i');
      m = flat.match(reAlone);
    }
    if (!m) { warnings.push('Ημέρες αφαίρεσης: δεν βρέθηκε ολογράφως διάρκεια.'); return null; }
    return DAY_WORDS[m[1].toLowerCase()] || null;
  }

  /* ---------- ΤΟΠΟΣ (απαιτεί χλθ) ---------- */
  function cleanKm(s) { return s.replace(/[οΟoO]/g, '0').replace(/[Iιl|]/g, '1').replace(/\s+/g, ''); }
  function findPlace(flat) {
    const km = flat.match(/(\d{1,3})\s*\+\s*(\d{2,3})/);
    if (!km) return null;
    const road = flat.match(/(Π\.?\s*Ε\.?\s*Ο\.?|Ε\.?\s*Ο\.?|Α\.?\s*Μ\.?|Θ\.?\s*Α\.?)/i);
    const seg = road ? flat.slice(road.index, Math.min(flat.length, road.index + 80)) : '';
    const toks = seg.split(/[^Α-ΩA-Z]+/).filter(Boolean);
    const cities = [];
    for (const t of toks) { const c = cityOk(t); if (c && !cities.includes(c)) cities.push(c); }
    const parts = [];
    parts.push(cleanKm(km[1]) + '+' + cleanKm(km[2]) + ' χ/θ');
    if (road) {
      const rn = road[1].replace(/\s+/g, '').replace(/ΠΕΟ/, 'Π.Ε.Ο.').replace(/ΕΟ/, 'Ε.Ο.').replace(/ΑΜ/, 'Α.Μ.').replace(/ΘΑ/, 'Θ.Α.');
      parts.push('της ' + rn);
    }
    if (cities.length >= 2) parts.push(cities[0] + ' - ' + cities[1]);
    else if (cities.length === 1) parts.push(cities[0]);
    else return null;
    return parts.join(' ');
  }

  /* ---------- ΑΡΘΡΟ (δέχεται παρ./περ./§/ς/β) ---------- */
  function buildArticle(art, par, per) {
    if (!art || +art > 150) return null;
    return { raw: art + (par ? '§' + par : '') + (per || ''), art: String(art), par: par || null, per: per || null,
      short: art + (par ? '§' + par : '') + (per || '') };
  }
  function findArticle(flat) {
    let m = flat.match(/αρθρου\s+(\d{1,3})\s*(?:παρ\.?\s*|περ\.?\s*|[§ςσξβ$S5]\s*)?(\d{1,2})?\s*(?:περ\.?\s*)?([α-ω]{1,3})?/i);
    if (m && m[1]) { const r = buildArticle(m[1], m[2], m[3]); if (r) return r; }
    m = flat.match(/(?<![0-9])(\d{1,3})\s*(?:παρ\.?\s*|περ\.?\s*|[§ςβ]\s*)(\d{1,2})\s*(?:περ\.?\s*)?([α-ω]{1,3})(?![α-ω])/i);
    if (m && m[1]) { const r = buildArticle(m[1], m[2], m[3]); if (r) return r; }
    return null;
  }

  /* ---------- ΥΠΗΡΕΣΙΑ ---------- */
  function findService(flat) {
    const anchors = [
      { re: /ΤΜΗΜΑ[^Α-Ω]{0,3}ΤΡΟΧΑΙΑΣ?/gi, type: 'ΤΤ' },
      { re: /ΑΣΤΥΝΟΜΙΚΟ[^Α-Ω]{0,3}ΤΜΗΜΑ/gi, type: 'ΑΤ' }
    ];
    const results = [];
    for (const { re, type } of anchors) {
      let m;
      while ((m = re.exec(flat))) {
        const tail = flat.slice(m.index + m[0].length, Math.min(flat.length, m.index + m[0].length + 40));
        const toks = tail.split(/[^Α-ΩA-Z]+/).filter(Boolean);
        for (const t of toks.slice(0, 3)) {
          const c = cityOk(t);
          if (c) { results.push({ type, city: c }); break; }
        }
      }
    }
    if (!results.length) return null;
    const tt = results.find(r => r.type === 'ΤΤ' && !/ΚΑΛΑΜΑΡΙΑ/.test(r.city));
    if (tt) return 'ΤΤ ' + tt.city;
    const other = results.find(r => !/ΚΑΛΑΜΑΡΙΑ/.test(r.city));
    if (other) return other.type + ' ' + other.city;
    return null;
  }

  /* ---------- ΟΝΟΜΑ ---------- */
  function nameTokenOk(t) {
    const u = t.toUpperCase();
    if (u.length < 3 || u.length > 15) return false;
    if (!/^[Α-Ω]+$/.test(u)) return false;
    if (PLACE_BLACKLIST.has(u)) return false;
    if (!hasVowel(u)) return false;
    if (consonantRatio(u) > 0.85) return false;
    return true;
  }
  function findOwner(flat) {
    const anchor = /(?:στοιχεια\s+)?[α-ω]{0,4}διοκ[α-ω]{0,12}/ig;
    let m;
    while ((m = anchor.exec(flat))) {
      const tail = flat.slice(m.index + m[0].length, Math.min(flat.length, m.index + 220));
      const toks = tail.split(/[^Α-Ωα-ω]+/).filter(Boolean).map(s => s.toUpperCase());
      const name = [];
      for (const t of toks) {
        if (/^(TOY|TIS|TOU|ΤΟΥ|ΤΗΣ)$/.test(t)) break;
        if (nameTokenOk(t)) name.push(t); else if (name.length) break;
      }
      if (name.length >= 2) {
        const joined = name.slice(0, 3).join(' ');
        const after = tail.toUpperCase();
        const lastTok = name[Math.min(name.length, 3) - 1];
        const idx = after.indexOf(lastTok);
        const rest = idx >= 0 ? after.slice(idx + lastTok.length) : after;
        const pat = rest.match(/(?:ΤΟΥ|ΤΗΣ)\s+([Α-Ω]{3,})/);
        return { name: joined, patronymic: pat ? pat[1] : null, index: m.index };
      }
    }
    return null;
  }
  function findAddress(flat, ownerIndex) {
    if (ownerIndex == null) return null;
    const tail = flat.slice(ownerIndex, Math.min(flat.length, ownerIndex + 400));
    const m = tail.match(/κατοικ[οσς]\s+([Α-Ω]{3,})[\s,]+(?:οδ[οσς]\s+)?([^,.\n]{3,50}?)\s+(\d+[Α-Ω]?(?:\s*[-–]\s*\d+)?)/i);
    if (m) { const city = cityOk(m[1]); return { city: city || m[1], street: m[2].trim(), number: m[3] }; }
    const s = tail.match(/οδ[οσς]\s+([^,.\n]{3,50}?)\s+(\d+[Α-Ω]?)/i);
    if (s) return { city: null, street: s[1].trim(), number: s[2] };
    return null;
  }

  /* ---------- ΑΝΑ ΠΕΡΑΣΜΑ ---------- */
  function parseOne(rawText) {
    const warnings = [];
    const { orig, flat } = prepare(rawText);
    const f = {};
    let m;
    const cut = (mm, g) => (mm && mm.indices && mm.indices[g]) ? orig.slice(mm.indices[g][0], mm.indices[g][1]) : null;

    f.plate = findPlate(flat);
    m = flat.match(/(\d{1,2})\s+(ιανουαριου|φεβρουαριου|μαρτιου|απριλιου|μαιου|ιουνιου|ιουλιου|αυγουστου|σεπτεμβριου|οκτωβριου|νοεμβριου|δεκεμβριου)\s+(20\d\d)/i);
    f.docDate = m ? iso(m[1], MONTHS[m[2].toLowerCase()], m[3]) : null;
    f.service = findService(flat);
    m = flat.match(/αριθμ\.?\s*πρωτ\.?\s*:?\s*(\S+)/i); f.senderProtocol = m ? m[1] : null;
    m = flat.match(/αριθ\.?\s*(\d{8,14})\s+απο\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+πραξη/i);
    f.type = /πραξη\s+βεβαιωσης/i.test(flat) ? 'ΚΛΗΣΗ' : null;
    f.actNumber = m ? m[1] : null; f.actDate = m ? iso(m[2], m[3], m[4]) : null;

    m = flat.match(/στις\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+και\s+ωρα\s+(\d{1,2})[:.](\d{2})/i);
    f.violationDate = m ? iso(m[1], m[2], m[3]) : null;
    f.violationTime = m ? String(m[4]).padStart(2, '0') + ':' + m[5] : null;
    if (!f.violationDate && f.actDate) { f.violationDate = f.actDate; f.vDateGuess = true; }

    f.place = findPlace(flat);
    m = flat.match(/ταχυτητα\s+(\d{2,3})\s*\S{0,5}\s+αντι\s+του\s+ανωτατου\s+επιτρεπομενου\s+οριου\s+των\s+(\d{2,3})/i);
    f.speed = m ? { measured: +m[1], limit: +m[2] } : null;
    m = flat.match(/διαπιστωθηκε\s+(.+?)\s*,?\s*κατα\s+παραβαση/i); f.violationText = m ? m[1] : null;
    f.article = findArticle(flat);
    m = flat.match(/κατα\s+παραβαση\s+του\s+αρθρου\s+.{1,20}?\s+του\s+Ν\.?\s*(\d{4})\//i); f.law = m ? m[1] : null;

    const om = findOwner(flat);
    if (om) { f.ownerFull = om.name; f.patronymic = om.patronymic; f.address = findAddress(flat, om.index); }
    else { f.ownerFull = null; f.address = null; }

    const removal = /αφαιρεση\s+της\s+αδειας\s+ικανοτητας/i.test(flat) || /αφαιρεση\s+αδειας\s+οδηγησης/i.test(flat);
    f.removal = { required: removal, days: removal ? parseDays(flat, warnings) : null,
      circulation: /αφαιρεση[^.]{0,200}?(πινακιδ|αδειας\s+κυκλοφοριας)/i.test(flat) };
    f.clauses = {
      complaint169: /169\s*π\.?\s*κ/i.test(flat) && (/απειθεια/i.test(flat) || /αρνηση\s+προσελευσης/i.test(flat)),
      payNotRequired: /δεν\s+ειναι\s+υποχρεωτικο[^)]{0,80}αποδοση/i.test(flat)
    };
    return { fields: f, warnings };
  }

  /* ---------- ΣΥΓΧΩΝΕΥΣΗ ---------- */
  // ΓΕΝΙΚΟ split: ΟΠΟΙΟΔΗΠΟΤΕ [label] χωρίζει τα περάσματα (μελλοντικά ασφαλές).
  function splitPasses(text) {
    const parts = String(text || '').split(/\[[^\]]*\]/g).map(x => x.trim()).filter(x => x.length > 15);
    return parts.length ? parts : [String(text || '')];
  }
  function tally(values) {
    const c = new Map();
    values.forEach((v, i) => {
      if (v === null || v === undefined || v === '') return;
      const k = typeof v === 'object' ? JSON.stringify(v) : String(v);
      const e = c.get(k) || { v, n: 0, i }; e.n++; c.set(k, e);
    });
    let best = null;
    c.forEach(e => { if (!best || e.n > best.n || (e.n === best.n && e.i < best.i)) best = e; });
    return best;
  }
  function vote(values, minVotes) {
    const t = tally(values);
    if (!t) return null;
    if (minVotes && t.n < minVotes) return null;
    return t.v;
  }

  function parseDocument(rawText) {
    const rs = splitPasses(rawText).map(parseOne);
    const F = rs.map(r => r.fields);
    const pick = (fn, ok) => vote(F.map(fn).filter(v => v !== null && v !== undefined && (!ok || ok(v))));
    const f = {}, w = [];

    const plateTally = tally(F.map(x => x.plate));
    f.plate = (plateTally && plateTally.n >= 2) ? plateTally.v : null;
    f.plate = bounded(f.plate, 'plate', w);
    const plates = Array.from(new Set(F.map(x => x.plate).filter(Boolean)));
    if (f.plate) w.push('Πινακίδα: ' + f.plate + '. Απαιτείται οπτική επιβεβαίωση από την εικόνα.');
    else if (plates.length) w.push('Πινακίδα: διαβάστηκε διαφορετικά (' + plates.join(' / ') + ') χωρίς πλειοψηφία. Διάβασέ την από την εικόνα και συμπλήρωσέ τη χειροκίνητα.');
    else w.push('Πινακίδα: δεν διαβάστηκε. Συμπλήρωσέ τη χειροκίνητα.');

    f.docDate = pick(x => x.docDate);
    f.service = bounded(pick(x => x.service), 'service', w);
    if (!f.service) w.push('Υπηρεσία ανάθεσης: δεν αναγνωρίστηκε. Συμπλήρωσέ τη χειροκίνητα.');
    f.senderProtocol = bounded(pick(x => x.senderProtocol), 'protocol', w);
    f.type = pick(x => x.type); f.actNumber = pick(x => x.actNumber); f.actDate = pick(x => x.actDate);

    f.violationDate = vote(F.filter(x => x.violationDate && !x.vDateGuess).map(x => x.violationDate));
    if (!f.violationDate) {
      f.violationDate = pick(x => x.violationDate);
      if (f.violationDate) w.push('Ημερομηνία παράβασης: εικασία από ημερομηνία πράξης. Έλεγξέ την.');
    } else w.push('Ημερομηνία παράβασης: ' + f.violationDate + '. Επιβεβαίωση.');
    f.violationTime = pick(x => x.violationTime);

    f.place = bounded(pick(x => x.place, p => p && p.length >= 4), 'place', w);
    if (!f.place) w.push('Τόπος παράβασης: δεν διαβάστηκε με βεβαιότητα (χιλιομετρική θέση). Συμπλήρωσέ τον χειροκίνητα.');

    f.speed = pick(x => x.speed);
    f.violationText = bounded(pick(x => x.violationText), 'violationText', w);
    f.article = pick(x => x.article);
    if (f.article) f.article = bounded(f.article, 'article', w) ? f.article : null;
    f.law = pick(x => x.law);
    if (!f.article) w.push('Άρθρο: δεν διαβάστηκε με βεβαιότητα. Συμπλήρωσέ το χειροκίνητα.');

    f.ownerFull = bounded(pick(x => x.ownerFull, n => n && n.split(' ').every(nameTokenOk)), 'name', w);
    f.ownerName = f.ownerFull;
    const same = F.filter(x => x.ownerFull === f.ownerFull);
    f.address = (same.find(x => x.address && x.address.street) || same.find(x => x.address) || {}).address || null;
    if (f.address && f.address.street) f.address.street = bounded(f.address.street, 'address', w) ? f.address.street : null;
    if (f.ownerFull) w.push('Ονοματεπώνυμο: ' + f.ownerFull + '. Επιβεβαίωσε γράμμα προς γράμμα.');
    else w.push('Ονοματεπώνυμο: δεν διαβάστηκε με βεβαιότητα. Συμπλήρωσέ το χειροκίνητα.');

    const required = F.some(x => x.removal && x.removal.required);
    const daysTally = tally(F.map(x => (x.removal && x.removal.days) || null));
    const days = (daysTally && daysTally.n >= 1) ? daysTally.v : null;
    f.removal = { required, days: required ? days : null, circulation: F.some(x => x.removal && x.removal.circulation) };
    if (required && !days) w.push('Ημέρες αφαίρεσης: δεν αναγνωρίστηκε ασφαλής αριθμός. Συμπλήρωσέ τες χειροκίνητα.');

    f.clauses = {
      complaint169: F.some(x => x.clauses && x.clauses.complaint169),
      payNotRequired: F.some(x => x.clauses && x.clauses.payNotRequired)
    };
    return { fields: f, warnings: w, passes: rs.length };
  }

  /* ---------- ΜΕΤΑΤΡΟΠΗ ΣΤΑ ΠΕΔΙΑ ---------- */
  function violationKind(text) {
    const t = String(text || '');
    if (/ταχυτητ/i.test(t)) return 'Υπερβολική ταχύτητα';
    if (/κτεο|τεχνικο\s+ελεγχο/i.test(t)) return 'ΚΤΕΟ';
    if (/διοδι/i.test(t)) return 'Διόδια';
    if (/σταθμευ/i.test(t)) return 'Στάθμευση';
    return '';
  }
  function toForm(res) {
    const f = res.fields;
    const o = { notes: [], info: [] };
    if (f.plate) o.plate = f.plate.replace('-', '');
    if (f.ownerFull) o.name = f.ownerFull;
    if (f.service) o.service = f.service;
    if (f.address && f.address.street) o.address = f.address.street + (f.address.number ? ' ' + f.address.number : '');
    if (f.address && f.address.city && !/^ΚΑΛΑΜΑΡΙΑΣ?$/.test(f.address.city))
      o.info.push('Η πόλη κατοικίας είναι ' + f.address.city + ' (το πρότυπο γράφει "κάτοικο Καλαμαριάς").');
    const vt = violationKind(f.violationText); if (vt) o.violationType = vt;
    if (f.removal.required) {
      if (f.removal.days) o.removalDays = f.removal.days;
      o.removalWhat = f.removal.circulation ? 'both' : 'license';
    }
    if (f.violationDate) o.vDate = f.violationDate;
    if (f.place) o.vPlace = f.place;
    if (f.article) o.vArticle = f.article.short || f.article.raw;
    if (f.clauses.complaint169) { o.endRoute = 'complaint'; o.notes.push('ΜΗΝΥΣΗ 169 Π.Κ. ΜΕΤΑ ΤΙΣ ΠΡΟΣΚΛΗΣΕΙΣ'); }
    if (f.clauses.payNotRequired) o.notes.push('ΑΠΟΔΟΣΗ ΧΩΡΙΣ ΠΛΗΡΩΜΗ ΠΡΟΣΤΙΜΟΥ');
    return o;
  }

  const api = { parseDocument, toForm, prepare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OcrParser = api;
})(typeof self !== 'undefined' ? self : this);
