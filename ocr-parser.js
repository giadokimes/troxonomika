/* troxonomika - ocr-parser.js v8
   parseDocument(κείμενο) -> { fields, warnings }
   toForm(αποτέλεσμα) -> τιμές για τη φόρμα
   Διορθώσεις v8:
   - PRE/GAP: σωστά escaped \s (ήταν 's' literal -> καμία εύρεση ημερών)
   - Παρενθέσεις: σωστά \( \) στα regex ημερών
   - Ώρα: capture group για λεπτά (ήταν :. χωρίς group)
   - Πινακίδα: αυστηρό anchor «υπ' αριθ.» + ψηφία-μόνο στο 2ο μέρος
   - Υπηρεσία: δέχεται Τ.Τ./ΤΤ/ΤΜΗΜΑ ΤΡΟΧΑΙΑΣ, επιστρέφει πλήρη ονομασία
   - Άρθρο: προεπιλογή βάσει είδους παράβασης γίνεται στο app.js */
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

  /* ---------- ΤΟΠΟΙ ---------- */

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
    'ΚΗΦΙΣΙΑΣ','ΚΗΦΙΣΙΑ','ΜΑΡΟΥΣΙΟΥ','ΜΑΡΟΥΣΙ','ΧΑΛΑΝΔΡΙΟΥ','ΧΑΛΑΝΔΡΙ',
    'ΖΩΓΡΑΦΟΥ','ΖΩΓΡΑΦΟ','ΝΕΑΣΜΥΡΝΗΣ','ΓΛΥΦΑΔΑΣ','ΓΛΥΦΑΔΑ','ΒΑΡΗΣ',
    'ΑΜΦΙΛΟΧΙΑΣ','ΠΥΛΟΥ','ΠΥΛΟΣ','ΤΡΙΠΟΛΗΣ','ΤΡΙΠΟΛΗ','ΚΑΛΑΜΑΤΑΣ','ΚΑΛΑΜΑΤΑ',
    'ΜΕΣΣΗΝΗΣ','ΑΡΓΟΥΣ','ΝΑΥΠΛΙΟΥ','ΚΟΡΙΝΘΟΥ','ΛΟΥΤΡΑΚΙΟΥ','ΑΜΦΙΣΣΑΣ',
    'ΛΕΒΑΔΕΙΑΣ','ΑΙΓΙΟΥ','ΟΡΕΣΤΙΑΔΑΣ','ΒΕΡΟΙΑΣ','ΕΔΕΣΣΑΣ','ΝΑΟΥΣΑΣ','ΓΙΑΝΝΙΤΣΩΝ',
    'ΑΛΕΞΑΝΔΡΕΙΑΣ','ΚΙΛΚΙΣ','ΠΟΛΥΓΥΡΟΥ','ΑΡΝΑΙΑΣ','ΣΤΑΥΡΟΥ','ΑΣΣΗΡΟΥ'
  ];
  const KNOWN_SET = new Set(KNOWN_PLACES);

  const PLACE_BLACKLIST = new Set([
    'ΙΔΙΟΚΤΗΤΗ','ΙΔΙΟΚΤΗ','ΟΔΟΣ','ΟΔΟΥ','ΚΑΤΟΙΚΟΣ','ΚΑΤΟΙΚΩΝ','ΚΑΤΟΙΚΙΑΣ','ΠΕΡΙΦΕΡΕΙΑ',
    'ΔΙΚΑΙΟΔΟΣΙΑΣ','ΑΥΤΟΚΙΝΗΤΟΥ','ΑΥΤΟΚΙΝΗΤΟ','ΙΧΕ','ΙΧΕΓ','ΑΡΙΘ','ΑΡΙΘΜ','ΑΡΙΘΜΟ',
    'ΠΡΑΞΗ','ΚΛΗΣΗ','ΟΔΗΓΟΣ','ΟΔΗΓΟΥ','ΟΔΗΓΟ','ΙΣΧΥΡΙΣΤΕΙ','ΔΗΛΩΣΗ','ΔΗΛΩΣΗΣ','ΥΠΕΥΘΥΝΗ',
    'ΠΡΟΣΚΛΗΣΗ','ΠΑΡΑΒΑΤΗ','ΠΑΡΑΒΑΤΗΣ','ΠΑΡΑΒΑΣΗΣ','ΠΑΡΑΒΑΣΗ','ΥΠΟΓΡΑΦΟΝΤΑ','ΕΝΣΤΑΣΕΩΣ',
    'ΠΡΟΘΕΣΜΙΑΣ','ΠΡΟΘΕΣΜΙΑ','ΗΜΕΡΟΜΗΝΙΑ','ΗΜΕΡΟΜΗΝΙΑΣ','ΒΕΒΑΙΩΣΗΣ','ΒΕΒΑΙΩΣΗ','ΔΙΑΠΙΣΤΩΣΗΣ',
    'ΤΑΧΥΤΗΤΑ','ΤΑΧΥΤΗΤΑΣ','ΟΡΙΟΥ','ΟΡΙΟ','ΑΝΩΤΑΤΟΥ','ΕΠΙΤΡΕΠΟΜΕΝΟΥ','ΕΠΙΤΡΕΠΟΜΕΝΗ',
    'ΝΙΚΟΛΑΟΥ','ΝΙΚΟΛΑΟ','ΝΙΚΟΛΑΟΣ','ΜΕ','ΤΗΝ','ΤΟΝ','ΤΟΥ','ΤΗΣ','ΑΠΟ','ΚΑΙ','ΔΕ','ΓΙΑ',
    'ΜΕΤΑ','ΠΡΙΝ','ΕΦΟΣΟΝ','ΔΙΑΦΟΡΕΤΙΚΑ','ΛΟΓΙΖΕΤΑΙ','ΕΙΝΑΙ','ΠΩΣ','ΔΕΝ','ΟΤΙ','ΠΟΥ',
    'ΠΟΣ','ΠΟΙΟΣ','ΗΤΑΝ','ΚΑΤΑ','ΧΡΟΝΟ','ΣΤΗ','ΣΤΗΝ','ΣΤΟΝ','ΣΤΟ','ΣΕ','ΣΑΣ','ΜΑΣ',
    'ΣΟΥ','ΜΟΥ','ΔΙΑ','ΔΙΑΣΤΗΜΑ','ΔΙΑΣΤΑΣΗ','ΔΙΑΣΗ','ΕΝΑΛΛΑΚΤΙΚΗ','ΣΕΛΙΔΑ','ΚΕΦΑΛΙΔΑ',
    'ΠΑΡΑΓΡΑΦΟΣ','ΤΜΗΜΑ','ΤΡΟΧΑΙΑΣ','ΑΣΤΥΝΟΜΙΚΟ','ΔΙΕΥΘΥΝΣΗ','ΥΠΟΔΙΕΥΘΥΝΣΗ','ΑΡΧΗΓΕΙΟ',
    'ΕΛΛΗΝΙΚΗ','ΔΗΜΟΚΡΑΤΙΑ','ΠΡΟΣ','ΘΕΜΑ','ΣΧΕΤ','ΑΝΤΙΤΥΠΑ','ΕΚΘΕΣΗ','ΑΦΑΙΡΕΣΗ'
  ]);

  const SUFFIX_OK = /(ΑΣ|ΟΥ|ΗΣ|ΩΝ|ΕΩΣ|ΑΔΑΣ|ΙΝΩΝ|ΕΣ|Α|Ο|Η|Ω)$/;

  function cityOk(tok) {
    const t = String(tok || '').toUpperCase().replace(/[^Α-ΩA-Z]/g, '');
    if (t.length < 3 || t.length > 16) return null;
    if (PLACE_BLACKLIST.has(t)) return null;
    if (!hasVowel(t)) return null;
    if (KNOWN_SET.has(t)) return t;
    for (const k of KNOWN_PLACES) {
      if (Math.abs(k.length - t.length) <= 2 && lev(k, t) <= 2) return k;
    }
    if (t.length >= 4 && consonantRatio(t) < 0.8 && SUFFIX_OK.test(t)) return t;
    return null;
  }

  function cityKnownOnly(tok) {
    const t = String(tok || '').toUpperCase().replace(/[^Α-ΩA-Z]/g, '');
    if (t.length < 4 || t.length > 16 || PLACE_BLACKLIST.has(t)) return null;
    if (KNOWN_SET.has(t)) return t;
    if (t.length >= 6) {
      for (const k of KNOWN_PLACES) { if (Math.abs(k.length - t.length) <= 1 && lev(k, t) <= 1) return k; }
    }
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

  // Καθαρισμός OCR συγχύσεων σε μικτό token (π.χ. Β0ο -> ΒΟΟ, 57ο1 -> 5701)
  function plateCandidate(raw) {
    const s = String(raw || '').toUpperCase().replace(/[‐‑‒–—−]/g, '-').replace(/\s+/g, '');
    const m = s.match(/([Α-ΩA-Z0-9]{3})-?([Α-ΩA-Z0-9]{4})/);
    if (!m) return null;
    return fixPlate(m[1], m[2]);
  }

  function findPlate(flat) {
    // 1) ΑΥΣΤΗΡΟ anchor: «υπ' αριθ.» / «υπ αριθ.» / «αρ. κυκλοφορίας» / «οδηγός του»
    //    Το επόμενο token μετά το anchor είναι η πινακίδα. Δεν ψάχνουμε αλλού μέσα στο context.
    const anchors = [
      /υπ\s*['’΄`]?\s*αριθ\.?\s*/ig,
      /αριθ\.?\s*κυκλοφοριας\s*/ig,
      /οδηγος\s+του\s+υπ\.?\s*αριθ\.?\s*/ig
    ];
    for (const re of anchors) {
      let a;
      while ((a = re.exec(flat))) {
        const tail = flat.slice(a.index + a[0].length, Math.min(flat.length, a.index + a[0].length + 40));
        // Παίρνουμε το ΠΡΩΤΟ token σχήματος XXX-XXXX (όχι αριθμό πράξης 12 ψηφίων)
        const m = tail.match(/^\s*([Α-ΩA-Z0-9]{3})\s*[-‐‑‒–—]?\s*([Α-ΩA-Z0-9]{4})(?![0-9Α-ΩA-Z])/i);
        if (m) {
          const p = plateCandidate(m[1] + '-' + m[2]);
          if (p) return p;
        }
      }
    }
    // 2) Fallback: πινακίδα με παύλα οπουδήποτε (η παύλα είναι ισχυρή ένδειξη)
    let m;
    const dashed = /(?<![A-Za-zΑ-Ωα-ω0-9])([Α-ΩA-Z]{3})\s*[-‐‑‒–—]\s*([0-9]{4})(?![0-9])/g;
    while ((m = dashed.exec(flat))) {
      const p = plateCandidate(m[1] + '-' + m[2]);
      if (p) return p;
    }
    // 3) Τελευταία προσπάθεια: 3 γράμματα + 4 ψηφία χωρίς παύλα
    const plain = /(?<![A-Za-zΑ-Ωα-ω0-9])([Α-ΩA-Z]{3})\s?([0-9]{4})(?![A-Za-zΑ-Ωα-ω0-9])/g;
    while ((m = plain.exec(flat))) {
      const p = plateCandidate(m[1] + '-' + m[2]);
      if (p) return p;
    }
    return null;
  }

  /* ---------- ΗΜΕΡΕΣ ΑΦΑΙΡΕΣΗΣ ---------- */

  const DAY_WORDS = {
    μια:1, δυο:2, τρεις:3, τρια:3, τεσσερις:4, τεσσερα:4, πεντε:5, εξι:6,
    επτα:7, εφτα:7, οκτω:8, οχτω:8, εννια:9, εννεα:9, δεκα:10,
    δεκαπεντε:15, δεκαεξι:16, δεκαεπτα:17, δεκαοκτω:18, δεκαεννια:19,
    εικοσι:20, τριαντα:30, σαραντα:40, πενηντα:50, εξηντα:60,
    εβδομηκοντα:70, εβδομηκοσι:70, ογδοντα:80, ογδοηκοσι:80,
    ενενηντα:90, εκατο:100, εκατον:100, διακοσιες:200, πεντακοσιες:500
  };
  // Μακρύτερες λέξεις πρώτες ώστε να μη «κλέψει» το δεκα από το δεκαπεντε
  const DAY_RE = Object.keys(DAY_WORDS).sort((a, b) => b.length - a.length).join('|');
  const GAP = '[\\s,;:.()]*';

  function parseDays(flat, warnings) {
    // «τριάντα (30) ημερών» / «τριάντα (80). ημερών» / «τριάντα ημερών»
    const reAlone = new RegExp('(' + DAY_RE + ')' + GAP + '(?:\\([^)]{0,8}\\))?' + GAP + 'ημερ', 'i');
    let m = flat.match(reAlone);
    if (!m) {
      const reWord = new RegExp(
        '(?:χρονικο|χρονο)' + GAP + '(?:διαστημα|διαστη|διασ|διαση)' + GAP +
        '(' + DAY_RE + ')' + GAP + '(?:\\([^)]{0,8}\\))?' + GAP + 'ημερ', 'i'
      );
      m = flat.match(reWord);
    }
    if (!m) { warnings.push('Ημέρες αφαίρεσης: δεν βρέθηκε ολογράφως διάρκεια.'); return null; }
    const days = DAY_WORDS[m[1].toLowerCase()] || null;
    // Έλεγχος διαφωνίας με τον αριθμό στην παρένθεση (η ολογράφως υπερισχύει πάντα)
    const par = flat.slice(m.index).match(/\((\d{1,3})\)/);
    if (days && par && +par[1] !== days) {
      warnings.push('Ημέρες: ολογράφως ' + days + ', στην παρένθεση ' + par[1] + '. Κρατήθηκαν ' + days + ' — επιβεβαίωσε.');
    }
    return days;
  }

  /* ---------- ΤΟΠΟΣ ---------- */

  function cleanKm(s) { return String(s).replace(/[οΟoO]/g, '0').replace(/[Iιl|]/g, '1').replace(/\s+/g, ''); }

  function findPlace(flat) {
    const kmMatch = flat.match(/(\d{1,3})\s*\+\s*(\d{2,3})/) ||
                    flat.match(/(\d{1,3})\s+(\d{2,3})\s*χ\s*[\/ήη|]?\s*θ/i);
    if (!kmMatch) return null;
    const kmStr = cleanKm(kmMatch[1]) + '+' + cleanKm(kmMatch[2]) + ' χ/θ';

    const roadRegex = /(Π\.?\s*Ε\.?\s*Ο\.?|Ε\.?\s*Ο\.?|Α\.?\s*Μ\.?|Θ\.?\s*Α\.?)/i;
    const roadIdx = flat.search(roadRegex);
    let roadName = '', cities = [];
    if (roadIdx !== -1) {
      const seg = flat.slice(roadIdx, Math.min(flat.length, roadIdx + 90));
      const rm = seg.match(roadRegex);
      if (rm) {
        roadName = rm[1].replace(/\s+/g, '')
          .replace(/ΠΕΟ/, 'Π.Ε.Ο.').replace(/ΕΟ/, 'Ε.Ο.')
          .replace(/ΑΜ/, 'Α.Μ.').replace(/ΘΑ/, 'Θ.Α.');
      }
      const toks = seg.split(/[^Α-Ωα-ωA-Za-z]+/).filter(Boolean);
      for (const t of toks) {
        const c = (t === t.toUpperCase()) ? cityOk(t) : cityKnownOnly(t);
        if (c && !cities.includes(c)) cities.push(c);
        if (cities.length >= 2) break;
      }
    }
    let result = kmStr;
    if (roadName) result += ' της ' + roadName;
    if (cities.length >= 2) result += ' ' + cities[0] + ' - ' + cities[1];
    else if (cities.length === 1) result += ' ' + cities[0];
    if (!roadName && cities.length === 0) return null;
    return result;
  }

  /* ---------- ΑΡΘΡΟ ---------- */

  function buildArticle(art, par, per) {
    if (!art || +art > 150) return null;
    return { raw: art + (par ? '§' + par : '') + (per || ''), art: String(art),
      par: par || null, per: per || null, short: art + (par ? '§' + par : '') + (per || '') };
  }

  function findArticle(flat) {
    let m = flat.match(/αρθρου\s+(\d{1,3})\s*(?:παρ\.?\s*|περ\.?\s*|[§ςσξβ$S5]\s*)?(\d{1,2})?\s*(?:περ\.?\s*)?([α-ω]{1,3})?/i);
    if (m && m[1]) { const r = buildArticle(m[1], m[2], m[3]); if (r) return r; }
    m = flat.match(/(?<![0-9])(\d{1,3})\s*(?:παρ\.?\s*|περ\.?\s*|[§ςβ]\s*)(\d{1,2})\s*(?:περ\.?\s*)?([α-ω]{1,3})(?![α-ω])/i);
    if (m && m[1]) { const r = buildArticle(m[1], m[2], m[3]); if (r) return r; }
    return null;
  }

  /* ---------- ΥΠΗΡΕΣΙΑ ΑΝΑΘΕΣΗΣ ---------- */
  // Επιστρέφει ΠΛΗΡΗ ονομασία («Τμήμα Τροχαίας Βόλου»), όχι συντομογραφία.

  const CITY_TITLE = {
    ΒΟΛΟΥ:'Βόλου', ΒΟΛΟ:'Βόλου', ΛΑΡΙΣΑΣ:'Λάρισας', ΛΑΡΙΣΑ:'Λάρισας',
    ΛΑΜΙΑΣ:'Λαμίας', ΚΑΛΑΜΑΡΙΑΣ:'Καλαμαριάς', ΚΑΛΑΜΑΡΙΑ:'Καλαμαριάς',
    ΘΕΣΣΑΛΟΝΙΚΗΣ:'Θεσσαλονίκης', ΘΕΡΜΗΣ:'Θέρμης', ΘΕΡΜΗ:'Θέρμης',
    ΛΗΤΗΣ:'Λητής', ΛΗΤΗ:'Λητής', ΓΡΕΒΕΝΩΝ:'Γρεβενών', ΧΑΛΚΗΔΟΝΑΣ:'Χαλκηδόνας',
    ΧΑΛΚΗΔΟΝΑ:'Χαλκηδόνας', ΑΣΠΡΟΒΑΛΤΑΣ:'Ασπροβάλτας', ΜΟΥΔΑΝΙΩΝ:'Μουδανιών',
    ΤΟΥΜΠΑΣ:'Τούμπας', ΚΑΣΣΑΝΔΡΕΙΑΣ:'Κασσάνδρειας', ΤΗΝΟΥ:'Τήνου',
    ΧΑΛΚΙΔΙΚΗΣ:'Χαλκιδικής', ΜΑΓΝΗΣΙΑΣ:'Μαγνησίας', ΦΘΙΩΤΙΔΑΣ:'Φθιώτιδας',
    ΠΙΕΡΙΑΣ:'Πιερίας', ΚΑΡΔΙΤΣΑΣ:'Καρδίτσας', ΤΡΙΚΑΛΩΝ:'Τρικάλων',
    ΚΟΖΑΝΗΣ:'Κοζάνης', ΦΛΩΡΙΝΑΣ:'Φλώρινας', ΚΑΣΤΟΡΙΑΣ:'Καστοριάς',
    ΙΩΑΝΝΙΝΩΝ:'Ιωαννίνων', ΑΡΤΑΣ:'Άρτας', ΠΡΕΒΕΖΑΣ:'Πρέβεζας',
    ΘΕΣΠΡΩΤΙΑΣ:'Θεσπρωτίας', ΞΑΝΘΗΣ:'Ξάνθης', ΚΟΜΟΤΗΝΗΣ:'Κομοτηνής',
    ΡΟΔΟΠΗΣ:'Ροδόπης', ΕΒΡΟΥ:'Έβρου', ΔΡΑΜΑΣ:'Δράμας', ΚΑΒΑΛΑΣ:'Καβάλας',
    ΣΕΡΡΩΝ:'Σερρών', ΚΙΛΚΙΣ:'Κιλκίς', ΒΕΡΟΙΑΣ:'Βέροιας', ΕΔΕΣΣΑΣ:'Έδεσσας',
    ΝΑΟΥΣΑΣ:'Νάουσας', ΓΙΑΝΝΙΤΣΩΝ:'Γιαννιτσών', ΑΛΕΞΑΝΔΡΕΙΑΣ:'Αλεξάνδρειας',
    ΠΟΛΥΓΥΡΟΥ:'Πολυγύρου', ΑΡΝΑΙΑΣ:'Αρναίας', ΣΤΑΥΡΟΥ:'Σταυρού',
    ΗΡΑΚΛΕΙΟΥ:'Ηρακλείου', ΧΑΝΙΩΝ:'Χανίων', ΡΟΔΟΥ:'Ρόδου',
    ΑΘΗΝΩΝ:'Αθηνών', ΠΕΙΡΑΙΑΣ:'Πειραιά', ΝΙΚΑΙΑΣ:'Νίκαιας',
    ΚΟΡΥΔΑΛΛΟΥ:'Κορυδαλλού', ΚΗΦΙΣΙΑΣ:'Κηφισίας', ΜΑΡΟΥΣΙΟΥ:'Μαρουσίου',
    ΧΑΛΑΝΔΡΙΟΥ:'Χαλανδρίου', ΖΩΓΡΑΦΟΥ:'Ζωγράφου', ΓΛΥΦΑΔΑΣ:'Γλυφάδας',
    ΒΑΡΗΣ:'Βάρης', ΤΡΙΠΟΛΗΣ:'Τρίπολης', ΚΑΛΑΜΑΤΑΣ:'Καλαμάτας',
    ΜΕΣΣΗΝΗΣ:'Μεσσήνης', ΑΡΓΟΥΣ:'Άργους', ΝΑΥΠΛΙΟΥ:'Ναυπλίου',
    ΚΟΡΙΝΘΟΥ:'Κορίνθου', ΛΟΥΤΡΑΚΙΟΥ:'Λουτρακίου', ΑΜΦΙΣΣΑΣ:'Άμφισσας',
    ΛΕΒΑΔΕΙΑΣ:'Λειβαδιάς', ΑΙΓΙΟΥ:'Αιγίου', ΟΡΕΣΤΙΑΔΑΣ:'Ορεστιάδας',
    ΠΥΛΟΥ:'Πύλου', ΑΜΦΙΛΟΧΙΑΣ:'Αμφιλοχίας'
  };

  function cityTitle(tok) {
    const u = String(tok || '').toUpperCase().replace(/[^Α-Ω]/g, '');
    if (CITY_TITLE[u]) return CITY_TITLE[u];
    const known = cityOk(u);
    if (known && CITY_TITLE[known]) return CITY_TITLE[known];
    return u.charAt(0) + u.slice(1).toLowerCase();
  }

  function findService(flat) {
    // Δέχεται: ΤΜΗΜΑ ΤΡΟΧΑΙΑΣ X · Τ.Τ. X · ΤΤ X · ΑΣΤΥΝΟΜΙΚΟ ΤΜΗΜΑ X · Α.Τ. X · ΑΤ X
    const patterns = [
      { re: /ΤΜΗΜΑ\s+ΤΡΟΧΑΙΑΣ\s+([Α-Ω]{3,})/gi, full: 'Τμήμα Τροχαίας' },
      { re: /Τ\s*\.\s*Τ\s*\.\s*([Α-Ω]{3,})/gi,     full: 'Τμήμα Τροχαίας' },
      { re: /\bΤΤ\s+([Α-Ω]{3,})/gi,               full: 'Τμήμα Τροχαίας' },
      { re: /ΑΣΤΥΝΟΜΙΚΟ\s+ΤΜΗΜΑ\s+([Α-Ω]{3,})/gi, full: 'Αστυνομικό Τμήμα' },
      { re: /Α\s*\.\s*Τ\s*\.\s*([Α-Ω]{3,})/gi,     full: 'Αστυνομικό Τμήμα' },
      { re: /\bΑΤ\s+([Α-Ω]{3,})/gi,               full: 'Αστυνομικό Τμήμα' },
      { re: /ΥΠΟΔΙΕΥΘΥΝΣΗ\s+ΤΡΟΧΑΙΑΣ\s+([Α-Ω]{3,})/gi, full: 'Υποδιεύθυνση Τροχαίας' },
      { re: /ΔΙΕΥΘΥΝΣΗ\s+ΤΡΟΧΑΙΑΣ\s+([Α-Ω]{3,})/gi,    full: 'Διεύθυνση Τροχαίας' }
    ];
    const found = [];
    for (const p of patterns) {
      let m;
      while ((m = p.re.exec(flat))) {
        const c = cityOk(m[1]);
        if (c) found.push({ full: p.full + ' ' + cityTitle(c), city: c });
      }
    }
    if (!found.length) return null;
    // Η υπηρεσία ανάθεσης ΔΕΝ είναι η τοπική (Καλαμαριά = παραλήπτης)
    const sender = found.find(r => !/ΚΑΛΑΜΑΡΙΑ/.test(r.city));
    return (sender || found[0]).full;
  }

  /* ---------- ΟΝΟΜΑΤΕΠΩΝΥΜΟ ---------- */

  function nameTokenOk(t) {
    const u = String(t).toUpperCase();
    if (u.length < 3 || u.length > 16) return false;
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
      const parts = [];
      for (const t of toks) {
        if (/^(ΤΟΥ|ΤΗΣ)$/.test(t)) break;
        if (nameTokenOk(t)) parts.push(t);
        else if (parts.length) break;
      }
      if (parts.length >= 2) {
        const joined = parts.slice(0, 3).join(' ');
        const up = tail.toUpperCase();
        const lastTok = parts[Math.min(parts.length, 3) - 1];
        const idx = up.indexOf(lastTok);
        const rest = idx >= 0 ? up.slice(idx + lastTok.length) : up;
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
    if (m) return { city: cityOk(m[1]) || m[1], street: m[2].trim(), number: m[3] };
    const s = tail.match(/οδ[οσς]\s+([^,.\n]{3,50}?)\s+(\d+[Α-Ω]?)/i);
    if (s) return { city: null, street: s[1].trim(), number: s[2] };
    return null;
  }

  /* ---------- ΑΝΑ ΠΕΡΑΣΜΑ ---------- */

  function parseOne(rawText) {
    const warnings = [];
    const { flat } = prepare(rawText);
    const f = {};
    let m;

    f.plate = findPlate(flat);

    m = flat.match(/(\d{1,2})\s+(ιανουαριου|φεβρουαριου|μαρτιου|απριλιου|μαιου|ιουνιου|ιουλιου|αυγουστου|σεπτεμβριου|οκτωβριου|νοεμβριου|δεκεμβριου)\s+(20\d\d)/i);
    f.docDate = m ? iso(m[1], MONTHS[m[2].toLowerCase()], m[3]) : null;

    f.service = findService(flat);

    m = flat.match(/αριθμ\.?\s*πρωτ\.?\s*:?\s*(\S+)/i);
    f.senderProtocol = m ? m[1] : null;

    m = flat.match(/αριθ\.?\s*(\d{8,14})\s+απο\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+πραξη/i);
    f.type = /πραξη\s+βεβαιωσης/i.test(flat) ? 'Κλήση' : null;
    f.actNumber = m ? m[1] : null;
    f.actDate = m ? iso(m[2], m[3], m[4]) : null;

    // Ώρα: ΣΩΣΤΟ capture group για λεπτά
    m = flat.match(/στις\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+και\s+ωρα\s+(\d{1,2})[:.](\d{2})/i);
    f.violationDate = m ? iso(m[1], m[2], m[3]) : null;
    f.violationTime = m ? String(m[4]).padStart(2, '0') + ':' + m[5] : null;
    if (!f.violationDate && f.actDate) { f.violationDate = f.actDate; f.vDateGuess = true; }

    f.place = findPlace(flat);

    m = flat.match(/ταχυτητα\s+(\d{2,3})\s*\S{0,5}\s+αντι\s+του\s+ανωτατου\s+επιτρεπομενου\s+οριου\s+των\s+(\d{2,3})/i);
    f.speed = m ? { measured: +m[1], limit: +m[2] } : null;

    m = flat.match(/διαπιστωθηκε\s+(.+?)\s*,?\s*κατα\s+παραβαση/i);
    f.violationText = m ? m[1] : null;

    f.article = findArticle(flat);
    m = flat.match(/κατα\s+παραβαση\s+του\s+αρθρου\s+.{1,20}?\s+του\s+Ν\.?\s*(\d{4})\//i);
    f.law = m ? m[1] : null;

    const om = findOwner(flat);
    if (om) { f.ownerFull = om.name; f.patronymic = om.patronymic; f.address = findAddress(flat, om.index); }
    else { f.ownerFull = null; f.address = null; }

    const removal = /αφαιρεση\s+της\s+αδειας\s+ικανοτητας/i.test(flat) ||
                    /αφαιρεση\s+αδειας\s+οδηγησης/i.test(flat) ||
                    /αφαιρεση[^.]{0,60}αδειας/i.test(flat);
    f.removal = {
      required: removal,
      days: removal ? parseDays(flat, warnings) : null,
      circulation: /αφαιρεση[^.]{0,200}?(πινακιδ|αδειας\s+κυκλοφοριας)/i.test(flat)
    };

    f.clauses = {
      complaint169: /169\s*π\.?\s*κ/i.test(flat) && (/απειθεια/i.test(flat) || /αρνηση\s+προσελευσης/i.test(flat)),
      payNotRequired: /δεν\s+ειναι\s+υποχρεωτικο[^)]{0,80}αποδοση/i.test(flat)
    };

    return { fields: f, warnings };
  }

  /* ---------- ΣΥΓΧΩΝΕΥΣΗ ---------- */

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
    const single = rs.length === 1;
    const pick = (fn, ok) => vote(F.map(fn).filter(v => v !== null && v !== undefined && (!ok || ok(v))), single ? 1 : 2);
    const f = {}, w = [];

    f.plate = pick(x => x.plate);
    if (f.plate) w.push('Πινακίδα: ' + f.plate + ' — έλεγξε οπτικά από το έγγραφο.');
    else w.push('Πινακίδα: δεν βρέθηκε. Συμπλήρωσέ τη χειροκίνητα.');

    f.docDate = pick(x => x.docDate);
    f.service = pick(x => x.service);
    if (!f.service) w.push('Υπηρεσία ανάθεσης: δεν βρέθηκε.');

    f.senderProtocol = pick(x => x.senderProtocol);
    f.type = pick(x => x.type);
    f.actNumber = pick(x => x.actNumber);
    f.actDate = pick(x => x.actDate);

    f.violationDate = vote(F.filter(x => x.violationDate && !x.vDateGuess).map(x => x.violationDate), single ? 1 : 2);
    if (!f.violationDate) {
      f.violationDate = pick(x => x.violationDate);
      if (f.violationDate) w.push('Ημερομηνία παράβασης: εικασία από την πράξη — έλεγξέ την.');
    }
    f.violationTime = pick(x => x.violationTime);

    f.place = pick(x => x.place, p => p && p.length >= 4 && p.length <= 90);
    if (!f.place) w.push('Τόπος: δεν βρέθηκε με βεβαιότητα.');

    f.speed = pick(x => x.speed);
    f.violationText = pick(x => x.violationText, t => t && t.length <= 160);
    f.article = pick(x => x.article);
    f.law = pick(x => x.law);
    if (!f.article) w.push('Άρθρο: δεν βρέθηκε.');

    f.ownerFull = pick(x => x.ownerFull, n => n && n.split(' ').every(nameTokenOk));
    f.ownerName = f.ownerFull;
    const same = F.filter(x => x.ownerFull === f.ownerFull);
    f.address = (same.find(x => x.address && x.address.street) || same.find(x => x.address) || {}).address || null;
    if (f.ownerFull) w.push('Ονοματεπώνυμο: ' + f.ownerFull + ' — επιβεβαίωσε γράμμα προς γράμμα.');
    else w.push('Ονοματεπώνυμο: δεν βρέθηκε.');

    const required = F.some(x => x.removal && x.removal.required);
    const days = vote(F.map(x => (x.removal && x.removal.days) || null), single ? 1 : 2);
    f.removal = { required, days: required ? days : null, circulation: F.some(x => x.removal && x.removal.circulation) };
    if (required && !days) w.push('Ημέρες αφαίρεσης: δεν βρέθηκαν.');
    rs.forEach(r => r.warnings.forEach(x => { if (/^Ημέρες:/.test(x) && !w.includes(x)) w.push(x); }));

    f.clauses = {
      complaint169: F.some(x => x.clauses && x.clauses.complaint169),
      payNotRequired: F.some(x => x.clauses && x.clauses.payNotRequired)
    };

    return { fields: f, warnings: w, passes: rs.length };
  }

  /* ---------- ΜΕΤΑΤΡΟΠΗ ΣΕ ΠΕΔΙΑ ΦΟΡΜΑΣ ---------- */

  function violationKind(text, speed) {
    const t = String(text || '');
    if (speed || /ταχυτητ/i.test(t)) return 'Υπερβολική ταχύτητα';
    if (/κτεο|τεχνικο\s+ελεγχο/i.test(t)) return 'ΚΤΕΟ';
    if (/διοδι/i.test(t)) return 'Διόδια';
    if (/σταθμευ/i.test(t)) return 'Στάθμευση';
    if (/μεθ|αλκοολ|αιθυλικ/i.test(t)) return 'Μέθη';
    return '';
  }

  function toForm(res) {
    const f = res.fields;
    const o = { notes: [], info: [] };
    if (f.plate) o.plate = f.plate.replace('-', '');
    if (f.ownerFull) o.name = f.ownerFull;
    if (f.service) o.service = f.service;
    if (f.address && f.address.street) o.address = f.address.street + (f.address.number ? ' ' + f.address.number : '');
    if (f.address && f.address.city && !/^ΚΑΛΑΜΑΡΙΑ/.test(f.address.city)) o.info.push('Πόλη κατοικίας: ' + f.address.city);
    const vt = violationKind(f.violationText, f.speed);
    if (vt) o.violationType = vt;
    if (f.removal.required) {
      if (f.removal.days) o.removalDays = f.removal.days;
      o.removalWhat = f.removal.circulation ? 'both' : 'license';
    }
    if (f.violationDate) o.vDate = f.violationDate;
    if (f.place) o.vPlace = f.place;
    if (f.article) o.vArticle = f.article.short || f.article.raw;
    if (f.type) o.docType = f.type;
    if (f.clauses.complaint169) { o.endRoute = 'complaint'; o.notes.push('ΜΗΝΥΣΗ 169 Π.Κ.'); }
    if (f.clauses.payNotRequired) o.notes.push('ΑΠΟΔΟΣΗ ΧΩΡΙΣ ΠΛΗΡΩΜΗ');
    return o;
  }

  const api = { parseDocument, toForm, prepare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OcrParser = api;
})(typeof self !== 'undefined' ? self : this);