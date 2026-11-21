/* troxonomika - ocr-parser.js (v2)
   parseDocument(κείμενο) -> { fields, warnings }
   toForm(αποτέλεσμα)     -> τιμές έτοιμες για τη φόρμα υπόθεσης
   Καθαρές συναρτήσεις, χωρίς εξαρτήσεις, δουλεύουν offline.
   Δεν αποθηκεύουν τίποτα: ό,τι βρίσκουν το ελέγχει ο χρήστης στη φόρμα. */
(function (root) {
  'use strict';

  /* ---------- προετοιμασία κειμένου ---------- */
  // orig: το κείμενο με μονά κενά. flat: το ίδιο, χωρίς τόνους, με ίδιο μήκος,
  // ώστε οι θέσεις από το flat να διαβάζουν το orig (έτσι κρατούνται οι τόνοι στα πεδία κειμένου).
  function prepare(text) {
    let orig = String(text || '').replace(/\s+/g, ' ').trim(), flat = '';
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
  const MONTHS = { ιανουαριου: 1, φεβρουαριου: 2, μαρτιου: 3, απριλιου: 4, μαιου: 5, ιουνιου: 6,
                   ιουλιου: 7, αυγουστου: 8, σεπτεμβριου: 9, οκτωβριου: 10, νοεμβριου: 11, δεκεμβριου: 12 };

  /* ---------- πινακίδα ---------- */
  // Οι ελληνικές πινακίδες χρησιμοποιούν μόνο αυτά τα 14 γράμματα
  const PLATE_LETTERS = 'ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ';
  const LAT2GR = { A: 'Α', B: 'Β', E: 'Ε', Z: 'Ζ', H: 'Η', I: 'Ι', K: 'Κ', M: 'Μ', N: 'Ν', O: 'Ο', P: 'Ρ', T: 'Τ', Y: 'Υ', X: 'Χ' };
  const DIG2LET = { '0': 'Ο', '1': 'Ι', '2': 'Ζ', '8': 'Β' };
  const LET2DIG = { 'Ο': '0', 'O': '0', 'Ι': '1', 'I': '1', 'L': '1', '|': '1', 'Ζ': '2', 'Z': '2', 'Β': '8', 'B': '8', 'S': '5' };

  function fixLetter(c) {
    c = c.toUpperCase();
    c = LAT2GR[c] || DIG2LET[c] || c;
    return PLATE_LETTERS.includes(c) ? c : null;
  }
  function fixDigit(c) {
    if (/\d/.test(c)) return c;
    return LET2DIG[c.toUpperCase()] || null;
  }
  function fixPlate(a, b) {
    const L = [...a].map(fixLetter), D = [...b].map(fixDigit);
    if (L.includes(null) || D.includes(null)) return null;
    const plate = L.join('') + '-' + D.join('');
    return { plate, corrected: plate !== (a + '-' + b) };
  }
  function findPlate(flat, warnings) {
    const re = /(?<![A-Za-zΑ-Ωα-ω0-9])([A-Za-zΑ-Ωα-ω0-9]{3})\s?[-–—]\s?([A-Za-zΑ-Ωα-ω0-9]{3,4})(?![A-Za-zΑ-Ωα-ω0-9])/g;
    let m;
    while ((m = re.exec(flat))) {
      const r = fixPlate(m[1], m[2]);
      if (r) {
        if (r.corrected) warnings.push('Πινακίδα: το OCR διάβασε "' + m[1] + '-' + m[2] + '", διορθώθηκε σε ' + r.plate + '. Έλεγξέ την.');
        return r.plate;
      }
    }
    warnings.push('Δεν βρέθηκε πινακίδα.');
    return null;
  }

  /* ---------- άλλα πεδία ---------- */
  const DAY_WORDS = { δεκα: 10, δεκαπεντε: 15, εικοσι: 20, τριαντα: 30, σαραντα: 40, πενηντα: 50, εξηντα: 60,
                      ενενηντα: 90, εκατο: 100, εκατον: 100, διακοσιες: 200, πεντακοσιες: 500 };

  function parseDays(flat, warnings) {
    // OCR συχνά χάνει τη φράση «χρονικό διάστημα», αλλά διατηρεί το
    // ολογράφως + (αριθμητικά) + «ημερών». Δεν συμπληρώνουμε αν δεν υπάρχει σαφές μοτίβο.
    const m = flat.match(/(?:χρονικο\s+διαστημα|για\s+)?([α-ω]{2,15})\s*\(\s*([0-9οΟoOΙιl|]{1,4})\s*\)\s*ημερ/i)
      || flat.match(/(?:αφαιρεση[^.]{0,100})?\b(\d{1,3})\s*ημερ(?:ων|εσ)?/i);
    if (!m) return null;
    const fromWord = DAY_WORDS[String(m[1] || '').toLowerCase()] || null;
    const digits = String(m[2] || m[1] || '').replace(/[οΟoO]/g, '0').replace(/[Iιl|]/g, '1').replace(/\s/g, '');
    const fromDigits = /^\d{1,3}$/.test(digits) ? +digits : null;
    if (fromWord && fromDigits && fromWord !== fromDigits)
      warnings.push('Ημέρες αφαίρεσης: ολόγραφα ' + fromWord + ', αριθμητικά ' + fromDigits + '. Έλεγξέ το.');
    const days = fromDigits || fromWord;
    if (!days || days < 1 || days > 365) {
      warnings.push('Ημέρες αφαίρεσης: δεν διαβάστηκαν με ασφάλεια.');
      return null;
    }
    return days;
  }

  // Διορθώσεις OCR στον τόπο (κρατά τόνους και πεζά/κεφαλαία του εγγράφου)
  function cleanPlace(p) {
    return p
      .replace(/(\d+)\+([0-9οΟoO]{2,3})/g, (_, a, b) => a + '+' + b.replace(/[οΟoO]/g, '0'))
      // το OCR χάνει συχνά το "+" της χιλιομετρικής θέσης: 39370 χ/θ -> 39+370 χ/θ
      .replace(/(?<![\d+])(\d{1,3})\s*[^\d\sA-Za-zΑ-Ωα-ω]{0,3}\s*(\d{3})(?=\s*χ\s*[\/ήη|]?\s*θ)/i, '$1+$2')
      .replace(/χ\s*[\/ήη|]\s*θ/gi, 'χ/θ')
      .replace(/(Π\.Ε\.)[0οΟ]\./i, '$1Ο.')
      .replace(/\s+/g, ' ').trim();
  }

  // Αυστηρή ανάγνωση: αν το OCR δώσει κάτι που δεν μοιάζει με άρθρο, δεν γεμίζει το πεδίο (δεν μαντεύει)
  function parseArticle(raw) {
    const m = raw.match(/^(\d{1,3})(?:\s*[§ςσξ$S5]?\s*(\d{1,2}))?\s*([α-ω]{1,2})?$/i);
    if (!m || +m[1] > 150) return null;
    return { raw, art: m[1], par: m[2] || null, per: m[3] || null,
             label: m[1] + (m[2] ? ' παρ.' + m[2] : '') + (m[3] ? ' περ.' + m[3] : ''),
             short: m[1] + (m[2] ? '§' + m[2] : '') + (m[3] || '') };
  }

  function findService(flat) {
    const text = flat.toUpperCase().replace(/[\s,.;:]+/g, ' ');
    const found = [];
    // Πρώτα οι σαφείς ονομασίες υπηρεσιών, με ανοχή σε χαμένα κενά OCR.
    const patterns = [
      /ΤΜΗΜΑ\s*ΤΡΟΧΑΙΑΣ\s+([Α-ΩA-Z]{3,})/g,
      /ΤΡΟΧΑΙΑΣ\s+([Α-ΩA-Z]{3,})/g,
      /ΑΣΤΥΝΟΜΙΚΟ\s*ΤΜΗΜΑ\s+([Α-ΩA-Z]{3,})/g
    ];
    for (const re of patterns) {
      let m; while ((m = re.exec(text))) found.push((re === patterns[2] ? 'ΑΤ ' : 'ΤΤ ') + m[1]);
    }
    // Η υπηρεσία παραλήπτη δεν πρέπει να επιλεγεί ως υπηρεσία ανάθεσης.
    return found.find(s => !/ΚΑΛΑΜΑΡΙΑ|ΜΑΓΝΗΣΙΑ|ΘΕΣΣΑΛΟΝΙΚ/.test(s)) || null;
  }

  /* ---------- κύρια συνάρτηση ---------- */
  function parseDocument(rawText) {
    const warnings = [];
    const { orig, flat } = prepare(rawText);
    const f = {};
    let m;
    const cut = (mm, g) => (mm && mm.indices && mm.indices[g]) ? orig.slice(mm.indices[g][0], mm.indices[g][1]) : null;

    f.plate = findPlate(flat, warnings);

    m = flat.match(/(\d{1,2})\s+(ιανουαριου|φεβρουαριου|μαρτιου|απριλιου|μαιου|ιουνιου|ιουλιου|αυγουστου|σεπτεμβριου|οκτωβριου|νοεμβριου|δεκεμβριου)\s+(20\d\d)/i);
    f.docDate = m ? iso(m[1], MONTHS[m[2].toLowerCase()], m[3]) : null;

    f.service = findService(flat);
    if (!f.service) warnings.push('Δεν βρέθηκε υπηρεσία ανάθεσης.');

    m = flat.match(/αριθμ\.?\s*πρωτ\.?\s*:?\s*(\S+)/i);
    f.senderProtocol = m ? m[1] : null;

    m = flat.match(/αριθ\.?\s*(\d{8,14})\s+απο\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+πραξη/i);
    f.type = /πραξη\s+βεβαιωσης/i.test(flat) ? 'ΚΛΗΣΗ' : null;
    f.actNumber = m ? m[1] : null;
    f.actDate = m ? iso(m[2], m[3], m[4]) : null;

    m = flat.match(/στις\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+και\s+ωρα\s+(\d{1,2})[:.](\d{2})/i);
    f.violationDate = m ? iso(m[1], m[2], m[3]) : null;
    if (!f.violationDate && f.actDate) {
      f.violationDate = f.actDate;
      warnings.push('Ημερομηνία παράβασης: δεν διαβάστηκε σίγουρα, μπήκε η ημερομηνία της πράξης. Έλεγξέ την.');
    }
    f.violationTime = m ? String(m[4]).padStart(2, '0') + ':' + m[5] : null;

    m = /ωρα\s+\d{1,2}[:.]\d{2}\s+(?:στην|στη|στον|στο)?\s*(.+?)\s+διαπιστωθηκε/id.exec(flat);
    f.place = m ? cleanPlace(cut(m, 1)) : null;
    if (f.place && /χ\/θ/.test(f.place) && !/\+/.test(cut(m, 1)))
      warnings.push('Τόπος: έλεγξε τη χιλιομετρική θέση (το OCR δεν διάβασε το "+").');

    m = flat.match(/ταχυτητα\s+(\d{2,3})\s*\S{0,5}\s+αντι\s+του\s+ανωτατου\s+επιτρεπομενου\s+οριου\s+των\s+(\d{2,3})/i);
    f.speed = m ? { measured: +m[1], limit: +m[2] } : null;

    m = flat.match(/διαπιστωθηκε\s+(.+?)\s*,?\s*κατα\s+παραβαση/i);
    f.violationText = m ? m[1] : null;

    m = flat.match(/κατα\s+παραβαση\s+του\s+αρθρου\s+(.{1,20}?)\s+του\s+Ν\.?\s*(\d{4})\//i);
    f.article = m ? parseArticle(m[1]) : null;
    if (m && !f.article) warnings.push('Άρθρο: το OCR διάβασε "' + m[1] + '". Συμπλήρωσέ το χειροκίνητα.');
    f.law = m ? m[2] : null;

    // Στοιχεία ιδιοκτήτη: πρώτα το τυπικό μοτίβο, μετά ελεγχόμενη εναλλακτική
    // με άγκυρα «κάτοικος» για OCR που αλλοιώνει τη λέξη «ιδιοκτήτη».
    m = /στοιχεια\s+ιδιοκτητ[ηω]\s+(.+?)\s*,?\s*κατοικο[σς]\s+(.+?)\s*,?\s*περιφερεια/id.exec(flat);
    if (!m) m = /(?:ιδιοκτητ[ηω]|στοιχεια\s+.{0,18})\s+(.{4,100}?)\s*,?\s*κατοικο[σς]\s+(.{3,100}?)\s*,?\s*περιφερεια/id.exec(flat);
    if (!m) m = /(?:στοιχεια\s+)?(?:ιδιοκτητ[ηω]|ιδιοκτη[στ][ηω])[^,]{0,25}(.{4,90}?)\s+κατοικο[σς]\s+(.{3,100})\s+περιφερεια/id.exec(flat);
    if (m) {
      f.ownerFull = String(m[1]).replace(/[\s,]+$/g, '').toUpperCase();
      f.ownerName = f.ownerFull.split(/\s+(?:ΤΟΥ|ΤΗΣ)\s+/)[0].trim();
      const residence = String(m[2] || '').replace(/[\s,]+$/g, '');
      const a = /^(.{2,40}?),\s*οδο[σς]\s+(.+)$/i.exec(residence);
      f.address = a
        ? { city: a[1].toUpperCase(), street: a[2].trim() }
        : { city: null, street: null, raw: residence };
      if (!/\s/.test(f.ownerName) || f.ownerName.length < 5) warnings.push('Ονοματεπώνυμο: η αναγνώριση είναι αβέβαιη. Έλεγξέ το.');
    } else {
      f.ownerFull = f.ownerName = f.address = null;
      warnings.push('Δεν βρέθηκαν με ασφάλεια στοιχεία ιδιοκτήτη.');
    }

    const removal = /αφαιρεση[^.]{0,100}αδει[^.]{0,50}ικανοτη/i.test(flat);
    f.removal = {
      required: removal,
      days: removal ? parseDays(flat, warnings) : null,
      circulation: /αφαιρεση[^.]{0,200}?(πινακιδ|αδει[^.]{0,60}κυκλοφορια)/i.test(flat)
    };

    // Ρητές διατάξεις του εγγράφου. Αν η φράση δεν αναγνωριστεί με σαφήνεια, δεν βγαίνει τίποτα
    // και ισχύει ο κανόνας της εφαρμογής.
    // ΕΚΚΡΕΜΕΙ: δείγματα για "απόδοση μόνο με πληρωμή προστίμου" και "μόνο αποστολή στην υπηρεσία".
    f.clauses = {
      complaint169: /169\s*π\.?\s*κ/i.test(flat) && (/απειθεια/i.test(flat) || /αρνηση\s+προσελευσης/i.test(flat)),
      payNotRequired: /δεν\s+ειναι\s+υποχρεωτικο[^)]{0,80}αποδοση/i.test(flat)
    };

    return { fields: f, warnings };
  }

  /* ---------- τιμές για τη φόρμα ---------- */
  function violationKind(text) {
    const t = String(text || '');
    if (/ταχυτητ/i.test(t)) return 'Υπερβολική ταχύτητα';
    if (/κτεο|τεχνικο\s+ελεγχο/i.test(t)) return 'ΚΤΕΟ';
    if (/διοδι/i.test(t)) return 'Διόδια';
    if (/σταθμευ/i.test(t)) return 'Στάθμευση';
    return '';   // ποτέ "Απόφαση" από τη σάρωση: αυτό το επιλέγει ο χρήστης
  }

  function toForm(res) {
    const f = res.fields, o = { notes: [], info: [] };
    if (f.plate) o.plate = f.plate.replace('-', '');
    if (f.ownerFull) o.name = f.ownerFull;
    if (f.service) o.service = f.service;
    if (f.address && f.address.street) o.address = f.address.street;
    if (f.address && f.address.city && !/^ΚΑΛΑΜΑΡΙΑΣ?$/.test(f.address.city))
      o.info.push('Η πόλη κατοικίας είναι ' + f.address.city + ' (το πρότυπο πρόσκλησης γράφει "κάτοικο Καλαμαριάς").');
    const vt = violationKind(f.violationText);
    if (vt) o.violationType = vt;
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
