/* troxonomika - ocr-parser.js v7
   parseDocument(κείμενο) -> { fields, warnings }
   toForm(αποτέλεσμα) -> τιμές έτοιμες για τη φόρμα υπόθεσης
   
   Στόχος: Τέλεια συνεργασία με καθαρό κείμενο από MakeACopy (single pass).
   Αρχή: ΜΗΔΕΝ επινοείται. Έλεγχος γνησιότητας σε ΟΛΑ τα πεδία. */
(function (root) {
  'use strict';

  /* ---------- ΒΟΗΘΗΤΙΚΑ ---------- */

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
    // Anchor-first: ψάχνουμε δίπλα σε «υπ' αριθ.» ή «οδηγός του»
    const contexts = [];
    const anchor = /(?:υπ\s*['’΄]?\s*αριθ|υπ\s*αριθ|αριθ\s*κυκλοφορ|οδηγός\s*του)/ig;
    let a;
    while ((a = anchor.exec(flat))) contexts.push(flat.slice(a.index, Math.min(flat.length, a.index + 160)));
    
    for (const c of contexts) {
      const m = c.match(/([Α-ΩA-Z0-9]{3})\s*[-‐‑‒–—]?\s*([Α-ΩA-Z0-9]{4})/i);
      if (m) { 
        const p = plateCandidate(m[1] + '-' + m[2]); 
        if (p) return p; 
      }
    }
    
    // Fallback: generic pattern
    const re = /(?<![A-Za-zΑ-Ωα-ω0-9])([A-Za-zΑ-Ωα-ω0-9]{3})\s?[-–—]?\s?([A-Za-zΑ-Ωα-ω0-9]{4})(?![A-Za-zΑ-Ωα-ω0-9])/g;
    let m;
    while ((m = re.exec(flat))) { 
      const p = plateCandidate(m[1] + '-' + m[2]); 
      if (p) return p; 
    }
    return null;
  }

  /* ---------- ΗΜΕΡΕΣ ΑΦΑΙΡΕΣΗΣ (FIXED FOR PUNCTUATION) ---------- */

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
  // GAP allows punctuation/spaces between word, parens, and 'ημερών'
  const GAP = '[\\s,;:.()]*'; 

  function parseDays(flat, warnings) {
    // Primary: chronological duration phrase
    const reWord = new RegExp(
      PRE + '(?:για' + GAP + ')?(?:χρονικο|οροναο|προναο|προνοσο|χροναο)[^\\s]{0,4}' + GAP +
      '(?:διαστη|διασ|δισ|διαση|διασημα)[^\\s]{0,4}' + GAP +
      '(' + DAY_RE + ')' + GAP + '(?:\\([^)]{0,8}\\))?' + GAP + 'ημερ', 'i'
    );
    let m = flat.match(reWord);
    
    // Secondary: standalone day word + optional paren + 'ημερών'
    if (!m) {
      const reAlone = new RegExp(PRE + '(' + DAY_RE + ')' + GAP + '(?:\\([^)]{0,8}\\))?' + GAP + 'ημερ', 'i');
      m = flat.match(reAlone);
    }
    
    if (!m) { 
      warnings.push('Ημέρες αφαίρεσης: δεν βρέθηκε ολογράφως διάρκεια.'); 
      return null; 
    }
    return DAY_WORDS[m[1].toLowerCase()] || null;
  }

  /* ---------- ΤΟΠΟΣ (ROBUST KM DETECTION) ---------- */

  function cleanKm(s) { 
    return s.replace(/[οΟoO]/g, '0').replace(/[Iιl|]/g, '1').replace(/\s+/g, ''); 
  }
  
  function findPlace(flat) {
    // Strict requirement: must have kilometer marker XX+YYY or XX YYY χ/θ
    const kmMatch = flat.match(/(\d{1,3})\s*[+\-]\s*(\d{2,3})/) || 
                    flat.match(/(\d{1,3})\s+(\d{2,3})\s*χ\s*[\/ήη|]?\s*θ/i);
    
    if (!kmMatch) return null; // No km marker = no place
    
    const kmStr = cleanKm(kmMatch[1]) + '+' + cleanKm(kmMatch[2]) + ' χ/θ';
    
    // Find road name nearby
    const roadRegex = /(Π\.?\s*Ε\.?\s*Ο\.?|Ε\.?\s*Ο\.?|Α\.?\s*Μ\.?|Θ\.?\s*Α\.?)/i;
    const roadIdx = flat.search(roadRegex);
    let roadName = '';
    let cities = [];
    
    if (roadIdx !== -1) {
      const seg = flat.slice(roadIdx, Math.min(flat.length, roadIdx + 80));
      const toks = seg.split(/[^Α-ΩA-Z]+/).filter(Boolean);
      
      // Extract normalized road abbreviation
      const rm = seg.match(roadRegex);
      if (rm) {
        roadName = rm[1].replace(/\s+/g, '')
          .replace(/ΠΕΟ/, 'Π.Ε.Ο.').replace(/ΕΟ/, 'Ε.Ο.')
          .replace(/ΑΜ/, 'Α.Μ.').replace(/ΘΑ/, 'Θ.Α.');
      }
      
      // Extract valid cities following the road
      for (const t of toks) {
        const c = cityOk(t);
        if (c && !cities.includes(c)) cities.push(c);
        if (cities.length >= 2) break; // Max 2 cities for route description
      }
    }
    
    // Construct final string
    let result = kmStr;
    if (roadName) result += ' της ' + roadName;
    if (cities.length >= 2) result += ' ' + cities[0] + ' - ' + cities[1];
    else if (cities.length === 1) result += ' ' + cities[0];
    
    // Validation: if we have km but no road/city context in a long document, it might be noise
    // But for MakeACopy clean text, this structure is usually correct.
    if (!roadName && cities.length === 0) {
       // Only allow bare km if it's very short/simple context (rare in these docs)
       // For safety, require at least road OR city unless the string is extremely specific
       return null; 
    }
    
    return result;
  }

  /* ---------- ΑΡΘΡΟ ---------- */

  function buildArticle(art, par, per) {
    if (!art || +art > 150) return null;
    return { 
      raw: art + (par ? '§' + par : '') + (per || ''), 
      art: String(art), 
      par: par || null, 
      per: per || null,
      short: art + (par ? '§' + par : '') + (per || '') 
    };
  }
  
  function findArticle(flat) {
    // Pattern 1: Explicit "άρθρου X..."
    let m = flat.match(/αρθρου\s+(\d{1,3})\s*(?:παρ\.?\s*|περ\.?\s*|[§ςσξβ$S5]\s*)?(\d{1,2})?\s*(?:περ\.?\s*)?([α-ω]{1,3})?/i);
    if (m && m[1]) { 
      const r = buildArticle(m[1], m[2], m[3]); 
      if (r) return r; 
    }
    
    // Pattern 2: Bare number with section symbol (common in OCR errors where 'article' word is missed)
    m = flat.match(/(?<![0-9])(\d{1,3})\s*(?:παρ\.?\s*|περ\.?\s*|[§ςβ]\s*)(\d{1,2})\s*(?:περ\.?\s*)?([α-ω]{1,3})(?![α-ω])/i);
    if (m && m[1]) { 
      const r = buildArticle(m[1], m[2], m[3]); 
      if (r) return r; 
    }
    return null;
  }

  /* ---------- ΥΠΗΡΕΣΙΑ ANATHESIS (STRICT) ---------- */

  function findService(flat) {
    // We look specifically for the ASSIGNING service (usually Traffic Dept), NOT receiving dept (Kalamaras)
    // Anchors: "ΤΜΗΜΑ ΤΡΟΧΑΙΑΣ" or "ΑΣΤΥΝΟΜΙΚΟ ΤΜΗΜΑ" followed by City
    
    const anchors = [
      { re: /ΤΜΗΜΑ\s*ΤΡΟΧΑΙΑΣ?\s+([Α-Ω]{3,})/gi, type: 'ΤΤ' },
      { re: /ΑΣΤΥΝΟΜΙΚΟ\s*ΤΜΗΜΑ\s+([Α-Ω]{3,})/gi, type: 'ΑΤ' }
    ];
    
    const results = [];
    for (const { re, type } of anchors) {
      let m;
      while ((m = re.exec(flat))) {
        const cityToken = m[1];
        const c = cityOk(cityToken);
        if (c) {
          results.push({ type, city: c });
        }
      }
    }
    
    if (!results.length) return null;
    
    // Preference: Return the one that is NOT Kalamaras (which is likely the receiver/local unit mentioned elsewhere)
    // Usually the sender is Volos/Larissa/etc.
    const nonLocal = results.find(r => !/ΚΑΛΑΜΑΡΙΑ/.test(r.city));
    if (nonLocal) return nonLocal.type + ' ' + nonLocal.city;
    
    // If all found are local, return first anyway (edge case)
    return results[0].type + ' ' + results[0].city;
  }

  /* ---------- ΟΝΟΜΑΤΕΠΩΝΥΜΟ ---------- */

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
      
      const nameParts = [];
      for (const t of toks) {
        if (/^(TOY|TIS|TOU|ΤΟΥ|ΤΗΣ)$/.test(t)) break;
        if (nameTokenOk(t)) nameParts.push(t); 
        else if (nameParts.length) break; // Stop collecting once invalid token hits after start
      }
      
      if (nameParts.length >= 2) {
        const joined = nameParts.slice(0, 3).join(' ');
        const upperTail = tail.toUpperCase();
        const lastTok = nameParts[Math.min(nameParts.length, 3) - 1];
        const idx = upperTail.indexOf(lastTok);
        const rest = idx >= 0 ? upperTail.slice(idx + lastTok.length) : upperTail;
        
        // Look for patronymic immediately after
        const patMatch = rest.match(/(?:ΤΟΥ|ΤΗΣ)\s+([Α-Ω]{3,})/);
        return { 
          name: joined, 
          patronymic: patMatch ? patMatch[1] : null, 
          index: m.index 
        };
      }
    }
    return null;
  }

  function findAddress(flat, ownerIndex) {
    if (ownerIndex == null) return null;
    const tail = flat.slice(ownerIndex, Math.min(flat.length, ownerIndex + 400));
    
    // Standard format: κάτοικος CITY, οδός STREET NUMBER
    const m = tail.match(/κατοικ[οσς]\s+([Α-Ω]{3,})[\s,]+(?:οδ[οσς]\s+)?([^,.\n]{3,50}?)\s+(\d+[Α-Ω]?(?:\s*[-–]\s*\d+)?)/i);
    if (m) {
      const city = cityOk(m[1]);
      return { city: city || m[1], street: m[2].trim(), number: m[3] };
    }
    
    // Simplified: just street
    const s = tail.match(/οδ[οσς]\s+([^,.\n]{3,50}?)\s+(\d+[Α-Ω]?)/i);
    if (s) return { city: null, street: s[1].trim(), number: s[2] };
    
    return null;
  }

  /* ---------- MAIN PARSE ONE PASS ---------- */

  function parseOne(rawText) {
    const warnings = [];
    const { orig, flat } = prepare(rawText);
    const f = {};
    let m;

    f.plate = findPlate(flat);
    
    m = flat.match(/(\d{1,2})\s+(ιανουαριου|φεβρουαριου|μαρτιου|απριλιου|μαιου|ιουνιου|ιουλιου|αυγουστου|σεπτεμβριου|οκτωβριου|νοεμβριου|δεκεμβριου)\s+(20\d\d)/i);
    f.docDate = m ? iso(m[1], MONTHS[m[2].toLowerCase()], m[3]) : null;
    
    f.service = findService(flat);
    
    m = flat.match(/αριθμ\.?\s*πρωτ\.?\s*:?\s*(\S+)/i); 
    f.senderProtocol = m ? m[1] : null;
    
    m = flat.match(/αριθ\.?\s*(\d{8,14})\s+απο\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+πραξη/i);
    f.type = /πραξη\s+βεβαιωσης/i.test(flat) ? 'ΚΛΗΣΗ' : null;
    f.actNumber = m ? m[1] : null; 
    f.actDate = m ? iso(m[2], m[3], m[4]) : null;

    m = flat.match(/στις\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+και\s+ωρα\s+(\d{1,2})[:.](\d{2})/i);
    f.violationDate = m ? iso(m[1], m[2], m[3]) : null;
    f.violationTime = m ? String(m[4]).padStart(2, '0') + ':' + m[5] : null;
    
    if (!f.violationDate && f.actDate) { 
      f.violationDate = f.actDate; 
      f.vDateGuess = true; 
    }

    f.place = findPlace(flat);
    
    m = flat.match(/ταχυτητα\s+(\d{2,3})\s*\S{0,5}\s+αντι\s+του\s+ανωτατου\s+επιτρεπομενου\s+οριου\s+των\s+(\d{2,3})/i);
    f.speed = m ? { measured: +m[1], limit: +m[2] } : null;
    
    m = flat.match(/διαπιστωθηκε\s+(.+?)\s*,?\s*κατα\s+παραβαση/i); 
    f.violationText = m ? m[1] : null;
    
    f.article = findArticle(flat);
    m = flat.match(/κατα\s+παραβαση\s+του\s+αρθρου\s+.{1,20}?\s+του\s+Ν\.?\s*(\d{4})\//i); 
    f.law = m ? m[1] : null;

    const om = findOwner(flat);
    if (om) { 
      f.ownerFull = om.name; 
      f.patronymic = om.patronymic; 
      f.address = findAddress(flat, om.index); 
    } else { 
      f.ownerFull = null; 
      f.address = null; 
    }

    const removal = /αφαιρεση\s+της\s+αδειας\s+ικανοτητας/i.test(flat) || /αφαιρεση\s+αδειας\s+οδηγησης/i.test(flat);
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

  /* ---------- MERGE LOGIC (OPTIMIZED FOR SINGLE PASS) ---------- */

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
    // CRITICAL CHANGE FOR V7: If only 1 pass exists, accept it directly without needing majority
    // This makes MakeACopy paste work perfectly. Voting logic remains for noisy multi-pass scans.
    if (minVotes && t.n < minVotes) return null;
    return t.v;
  }

  function parseDocument(rawText) {
    const rs = splitPasses(rawText).map(parseOne);
    const F = rs.map(r => r.fields);
    const pick = (fn, ok) => vote(F.map(fn).filter(v => v !== null && v !== undefined && (!ok || ok(v))), rs.length === 1 ? 1 : 2);
    const f = {}, w = [];

    // Plate
    f.plate = pick(x => x.plate);
    if (f.plate) w.push('Πινακίδα: ' + f.plate + '. Ελέγξτe οπτικά.');
    else w.push('Πινακίδα: δεν βρέθηκε. Συμπλήρωση χειροκίνητα.');

    // Dates & Service
    f.docDate = pick(x => x.docDate);
    f.service = pick(x => x.service);
    if (!f.service) w.push('Υπηρεσία: δεν βρέθηκε.');
    
    f.senderProtocol = pick(x => x.senderProtocol);
    f.type = pick(x => x.type); 
    f.actNumber = pick(x => x.actNumber); 
    f.actDate = pick(x => x.actDate);

    // Violation Date
    f.violationDate = vote(F.filter(x => x.violationDate && !x.vDateGuess).map(x => x.violationDate), rs.length === 1 ? 1 : 2);
    if (!f.violationDate) {
      f.violationDate = pick(x => x.violationDate);
      if (f.violationDate) w.push('Ημερομηνία παράβασης: εικασία.');
    } else w.push('Ημερομηνία: ' + f.violationDate + '. OK.');
    
    f.violationTime = pick(x => x.violationTime);

    // Place
    f.place = pick(x => x.place, p => p && p.length >= 4 && p.length <= 90);
    if (!f.place) w.push('Τόπος: δεν βρέθηκε.');

    // Speed & Article
    f.speed = pick(x => x.speed);
    f.violationText = pick(x => x.violationText, t => t && t.length <= 160);
    f.article = pick(x => x.article);
    f.law = pick(x => x.law);
    if (!f.article) w.push('Άρθρο: δεν βρέθηκε.');

    // Owner
    f.ownerFull = pick(x => x.ownerFull, n => n && n.split(' ').every(nameTokenOk));
    f.ownerName = f.ownerFull;
    const same = F.filter(x => x.ownerFull === f.ownerFull);
    f.address = (same.find(x => x.address && x.address.street) || same.find(x => x.address) || {}).address || null;
    if (f.ownerFull) w.push('Όνομα: ' + f.ownerFull + '. Επιβεβαίωση.');
    else w.push('Όνομα: δεν βρέθηκε.');

    // Removal Days
    const required = F.some(x => x.removal && x.removal.required);
    const days = vote(F.map(x => (x.removal && x.removal.days) || null), rs.length === 1 ? 1 : 2);
    f.removal = { required, days: required ? days : null, circulation: F.some(x => x.removal && x.removal.circulation) };
    if (required && !days) w.push('Ημέρες: δεν βρέθηκαν.');

    // Clauses
    f.clauses = {
      complaint169: F.some(x => x.clauses && x.clauses.complaint169),
      payNotRequired: F.some(x => x.clauses && x.clauses.payNotRequired)
    };
    
    return { fields: f, warnings: w, passes: rs.length };
  }

  /* ---------- FORM MAPPING ---------- */

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
    if (f.address && f.address.street) {
      o.address = f.address.street + (f.address.number ? ' ' + f.address.number : '');
    }
    if (f.address && f.address.city && !/^ΚΑΛΑΜΑΡΙΑΣ?$/.test(f.address.city)) {
      o.info.push('Πόλη κατοικίας: ' + f.address.city);
    }
    const vt = violationKind(f.violationText); if (vt) o.violationType = vt;
    if (f.removal.required) {
      if (f.removal.days) o.removalDays = f.removal.days;
      o.removalWhat = f.removal.circulation ? 'both' : 'license';
    }
    if (f.violationDate) o.vDate = f.violationDate;
    if (f.place) o.vPlace = f.place;
    if (f.article) o.vArticle = f.article.short || f.article.raw;
    if (f.clauses.complaint169) { o.endRoute = 'complaint'; o.notes.push('ΜΗΝΥΣΗ 169 Π.Κ.'); }
    if (f.clauses.payNotRequired) o.notes.push('ΑΠΟΔΟΣΗ ΧΩΡΙΣ ΠΛΗΡΩΜΗ');
    return o;
  }

  const api = { parseDocument, toForm, prepare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OcrParser = api;
})(typeof self !== 'undefined' ? self : this);
