/* troxonomika - ocr-parser.js v3 (ανάλυση ανά πέρασμα OCR + συγχώνευση)
   parseDocument(κείμενο) -> { fields, warnings }
   toForm(αποτέλεσμα) -> τιμές έτοιμες για τη φόρμα υπόθεσης
   Offline επεξεργασία. Όλα τα πεδία χρειάζονται έλεγχο από τον χρήστη.
   Βελτιώσεις: καλύτερη ανίχνευση υπηρεσίας, ονόματος, διεύθυνσης. */
(function (root) {
  'use strict';

  function prepare(text) {
    // Αφαίρεση των section labels που προσθέτει το ocr-scan.js
    let cleaned = String(text || '').replace(/\[ΟΛΟΚΛΗΡΗ ΣΕΛΙΔΑ[^\]]*\]/g, '')
                                     .replace(/\[ΚΕΦΑΛΙΔΑ[^\]]*\]/g, '')
                                     .replace(/\[ΚΥΡΙΑ ΠΑΡΑΓΡΑΦΟΣ[^\]]*\]/g, '')
                                     .replace(/\[.+?\]/g, '');
    let orig = cleaned.replace(/\s+/g, ' ').trim();
    let flat = '';

    for (const ch of orig) {
      const b = ch.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .normalize('NFC');
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
    ιανουαριου: 1, φεβρουαριου: 2, μαρτιου: 3,
    απριλιου: 4, μαιου: 5, ιουνιου: 6,
    ιουλιου: 7, αυγουστου: 8, σεπτεμβριου: 9,
    οκτωβριου: 10, νοεμβριου: 11, δεκεμβριου: 12
  };

  /* ---------- ΠΙΝΑΚΙΔΑ ---------- */

  const PLATE_LETTERS = 'ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ';

  const LAT2GR = {
    A: 'Α', B: 'Β', E: 'Ε', Z: 'Ζ', H: 'Η',
    I: 'Ι', K: 'Κ', M: 'Μ', N: 'Ν', O: 'Ο',
    P: 'Ρ', T: 'Τ', Y: 'Υ', X: 'Χ'
  };

  const DIG2LET = {
    '0': 'Ο', '1': 'Ι', '2': 'Ζ', '8': 'Β'
  };

  const LET2DIG = {
    'Ο': '0', 'O': '0', 'Ι': '1', 'I': '1',
    'L': '1', '|': '1', 'Ζ': '2', 'Z': '2',
    'Β': '8', 'B': '8', 'S': '5'
  };

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
    const L = [...a].map(fixLetter);
    const D = [...b].map(fixDigit);
    if (L.includes(null) || D.includes(null)) return null;
    const plate = L.join('') + '-' + D.join('');
    return { plate, corrected: plate !== (a + '-' + b) };
  }

  function plateCandidate(raw) {
    const s = String(raw || '')
      .toUpperCase()
      .replace(/[‐‑‒–—−]/g, '-')
      .replace(/\s+/g, '');
    const m = s.match(/([Α-ΩA-Z0-9]{3})-?([Α-ΩA-Z0-9]{4})/);
    if (!m) return null;
    const r = fixPlate(m[1], m[2]);
    return r ? { plate: r.plate, corrected: r.corrected || !s.includes('-') } : null;
  }

  function findPlate(flat, warnings) {
    const contexts = [];
    const anchor = /(?:υπ\s*['’΄]?\s*αριθ|υπ\s*αριθ|αριθ\s*κυκλοφορ)/ig;
    let a;
    while ((a = anchor.exec(flat))) {
      contexts.push(flat.slice(a.index, Math.min(flat.length, a.index + 150)));
    }

    for (const c of contexts) {
      const m = c.match(/([Α-ΩA-Z0-9]{3})\s*[-‐‑‒–—]?\s*([Α-ΩA-Z0-9]{4})/i);
      if (m) {
        const r = plateCandidate(m[1] + '-' + m[2]);
        if (r) {
          warnings.push('Πινακίδα από «υπ\' αριθ.»: ' + r.plate + '. Απαιτείται οπτική επιβεβαίωση.');
          return r.plate;
        }
      }
    }

    const re = /(?<![A-Za-zΑ-Ωα-ω0-9])([A-Za-zΑ-Ωα-ω0-9]{3})\s?[-–—]?\s?([A-Za-zΑ-Ωα-ω0-9]{4})(?![A-Za-zΑ-Ωα-ω0-9])/g;
    let m;
    while ((m = re.exec(flat))) {
      const r = plateCandidate(m[1] + '-' + m[2]);
      if (r) {
        warnings.push('Πινακίδα εκτός βασικού συμφραζομένου: ' + r.plate + '. Επιβεβαίωση.');
        return r.plate;
      }
    }
    warnings.push('Δεν βρέθηκε πινακίδα με επαρκή βεβαιότητα.');
    return null;
  }

  /* ---------- ΗΜΕΡΕΣ ΑΦΑΙΡΕΣΗΣ ---------- */

  const DAY_WORDS = {
    δεκα: 10, δεκαπεντε: 15, εικοσι: 20, τριαντα: 30,
    σαραντα: 40, πενηντα: 50, εξηντα: 60, ενενηντα: 90,
    εκατο: 100, εκατον: 100, διακοσιες: 200, πεντακοσιες: 500,
    δεκαεννια: 19, δεκαοκτω: 18, εξηκοσι: 60, εβδομηκοσι: 70, ογδοηκοσι: 80
  };

  function parseDays(flat, warnings) {
    const m = flat.match(
      /(?:για\s+)?χρονικο\s+διαστημα\s+([α-ω]+)\s*\(\s*([^)]{1,8})\s*\)\s*ημερ/i
    );
    if (!m) {
      const wordOnly = flat.match(
        /(?:χρονικο\s+διαστημα\s+|για\s+χρονικο\s+διαστημα\s+)?(δεκα|δεκαπεντε|εικοσι|τριαντα|σαραντα|πενηντα|εξηντα|ενενηντα|εκατο|εκατον|ογδοηκοσι|εβδομηκοσι)\s+ημερ/i
      );
      if (wordOnly) return DAY_WORDS[wordOnly[1].toLowerCase()] || null;
      warnings.push('Ημέρες αφαίρεσης: δεν αναγνωρίστηκε με ασφάλεια η ολογράφως διάρκεια.');
      return null;
    }

    const fromWord = DAY_WORDS[m[1].toLowerCase()] || null;
    const digits = m[2]
      .replace(/[οΟoO]/g, '0')
      .replace(/[Iιl|]/g, '1')
      .replace(/\s/g, '');
    const fromDigits = /^\d{1,3}$/.test(digits) ? +digits : null;

    if (fromWord && fromDigits && fromWord !== fromDigits) {
      warnings.push('Διαφωνία OCR στις ημέρες: ολογράφως ' + fromWord +
        ', αριθμητικά ' + fromDigits + '. Επιλέχθηκαν ' + fromWord + ' ημέρες — επιβεβαίωση.');
    }
    const days = fromWord || fromDigits;
    if (!days) warnings.push('Ημέρες αφαίρεσης: δεν αναγνωρίστηκε ασφαλής αριθμός.');
    return days;
  }

  /* ---------- ΤΟΠΟΣ ---------- */

  function cleanPlace(p) {
    return p
      .replace(/(\d+)\+([0-9οΟoO]{2,3})/g, (_, a, b) => a + '+' + b.replace(/[οΟoO]/g, '0'))
      .replace(/(?<![\d+])(\d{1,3})\s*[^\d\sA-Za-zΑ-Ωα-ω]{0,3}\s*(\d{3})(?=\s*χ\s*[\/ήη|]?\s*θ)/i, '$1+$2')
      .replace(/χ\s*[\/ήη|]\s*θ/gi, 'χ/θ')
      .replace(/(Π\.Ε\.)[0οΟ]\./i, '$1Ο.')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------- ΑΡΘΡΟ ---------- */

  function parseArticle(raw) {
    const m = raw.match(/^(\d{1,3})(?:\s*(?:παρ\.?|[§ςσξ$S5])?\s*(\d{1,2}))?\s*(?:περ\.?\s*)?([α-ω]{1,2})?$/i);
    if (!m || +m[1] > 150) return null;
    return {
      raw, art: m[1], par: m[2] || null, per: m[3] || null,
      label: m[1] + (m[2] ? ' παρ.' + m[2] : '') + (m[3] ? ' περ.' + m[3] : ''),
      short: m[1] + (m[2] ? '§' + m[2] : '') + (m[3] || '')
    };
  }

  /* ---------- ΥΠΗΡΕΣΙΑ ΑΝΑΘΕΣΗΣ (ΒΕΛΤΙΩΜΕΝΗ) ---------- */

  function findService(flat) {
    const found = [];
    let m;

    // Διευρυμένα patterns για ΕΛ.ΑΣ.
    const patterns = [
      /ΤΜΗΜΑ\s*ΤΡΟΧΑΙΑΣ\s+([Α-ΩA-ZΑ-ΩΆ-Ώ]{3,})/gi,
      /Τ\.?\s*Τ\.?\s*([Α-ΩA-Z]{3,})/gi,
      /ΑΣΤΥΝΟΜΙΚΟ\s+ΤΜΗΜΑ\s+([Α-ΩA-ZΑ-ΩΆ-Ώ]{3,})/gi,
      /Α\.?\s*Τ\.?\s*([Α-ΩA-Z]{3,})/gi,
      /ΥΠΟΔΙΕΥΘΥΝΣΗ\s+ΤΡΟΧΑΙΑΣ\s+([Α-ΩA-Z]{3,})/gi,
      /ΔΙΕΥΘΥΝΣΗ\s+ΤΡΟΧΑΙΑΣ\s+([Α-ΩA-Z]{3,})/gi
    ];

    for (const re of patterns) {
      while ((m = re.exec(flat))) {
        const svc = m[1].toUpperCase();
        // Απόρριψη πολύ μικρών ή άκυρων
        if (svc.length >= 3) {
          found.push(svc);
        }
      }
    }

    // Προτίμηση σε υπηρεσίες που ΔΕΝ είναι Καλαμαριά (η υπηρεσία παραλαβής)
    const assignment = found.find(s => !/ΚΑΛΑΜΑΡΙΑ/.test(s));
    if (assignment) return 'ΤΤ ' + assignment;

    // Αν βρέθηκε μόνο Καλαμαριά, είναι η υπηρεσία παραλαβής
    if (found.length && /ΚΑΛΑΜΑΡΙΑ/.test(found[0])) return null;

    return found[0] ? 'ΤΤ ' + found[0] : null;
  }

  /* ---------- ΔΙΕΥΘΥΝΣΗ ΚΑΤΟΙΚΙΑΣ (ΒΕΛΤΙΩΜΕΝΗ) ---------- */

  function findAddress(flat, ownerIndex) {
    if (!ownerIndex) return null;
    // Ψάχνουμε μετά την αναφορά του ιδιοκτήτη
    const tail = flat.slice(ownerIndex, Math.min(flat.length, ownerIndex + 500));
    
    // Pattern: "κάτοικος ΠΟΛΗΣ, οδός ΟΝΟΜΑ ΑΡΙΘΜΟΣ"
    const m = tail.match(
      /κατοικ[οσς]\s+([Α-ΩA-Z][Α-ΩA-Z]+)[\s,]+(?:οδ[οσς]\s+)?([^,.\n]{3,60})\s+(\d+[Α-Ω]?(?:\s*[-–]\s*\d+)?)/i
    );
    if (m) {
      return {
        city: m[1],
        street: m[2].trim(),
        number: m[3]
      };
    }

    // Απλούστερο: μόνο "οδός ..."
    const streetM = tail.match(/οδ[οσς]\s+([^,.\n]{3,60})/i);
    if (streetM) {
      return {
        city: null,
        street: streetM[1].trim(),
        number: null
      };
    }

    // Ακόμα πιο απλό: "κάτοικος ΠΟΛΗΣ"
    const cityM = tail.match(/κατοικ[οσς]\s+([Α-ΩA-ZΑ-ΩΆ-Ώ][α-ωΑ-Ω]+)(?=[\s,]|$)/i);
    if (cityM) {
      return { city: cityM[1], street: null, number: null };
    }

    return null;
  }

  /* ---------- ΚΥΡΙΑ ΑΝΑΛΥΣΗ ---------- */

  function parseOne(rawText) {
    const warnings = [];
    const { orig, flat } = prepare(rawText);
    const f = {};

    let m;

    const cut = (mm, g) =>
      (mm && mm.indices && mm.indices[g])
        ? orig.slice(mm.indices[g][0], mm.indices[g][1])
        : null;

    f.plate = findPlate(flat, warnings);
    f.plateAnchored = warnings.some(w => w.indexOf('Πινακίδα από') === 0);

    m = flat.match(
      /(\d{1,2})\s+(ιανουαριου|φεβρουαριου|μαρτιου|απριλιου|μαιου|ιουνιου|ιουλιου|αυγουστου|σεπτεμβριου|οκτωβριου|νοεμβριου|δεκεμβριου)\s+(20\d\d)/i
    );
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
      f.vDateGuess = true;
      warnings.push('Ημερομηνία παράβασης: δεν διαβάστηκε σίγουρα, μπήκε η ημερομηνία της πράξης. Έλεγξέ την.');
    }

    f.violationTime = m ? String(m[4]).padStart(2, '0') + ':' + m[5] : null;

    m = /ωρα\s+\d{1,2}[:.]\d{2}\s+(?:στην|στη|στον|στο)?\s*(.+?)\s+διαπιστωθηκε/id.exec(flat);
    f.place = m ? cleanPlace(cut(m, 1)) : null;

    if (f.place && /χ\/θ/.test(f.place) && !/\+/.test(cut(m, 1))) {
      warnings.push('Τόπος: έλεγξε τη χιλιομετρική θέση (το OCR δεν διάβασε το "+").');
    }

    m = flat.match(/ταχυτητα\s+(\d{2,3})\s*\S{0,5}\s+αντι\s+του\s+ανωτατου\s+επιτρεπομενου\s+οριου\s+των\s+(\d{2,3})/i);
    f.speed = m ? { measured: +m[1], limit: +m[2] } : null;

    m = flat.match(/διαπιστωθηκε\s+(.+?)\s*,?\s*κατα\s+παραβαση/i);
    f.violationText = m ? m[1] : null;

    m = flat.match(/κατα\s+παραβαση\s+του\s+αρθρου\s+(.{1,20}?)\s+του\s+Ν\.?\s*(\d{4})\//i);
    f.article = m ? parseArticle(m[1]) : null;
    if (m && !f.article) warnings.push('Άρθρο: το OCR διάβασε "' + m[1] + '". Συμπλήρωσέ το χειροκίνητα.');
    f.law = m ? m[2] : null;

    /* ---------- ΟΝΟΜΑΤΕΠΩΝΥΜΟ ΙΔΙΟΚΤΗΤΗ (ΒΕΛΤΙΩΜΕΝΟ) ---------- */

    const ownerAnchor = /(?:στοιχεια\s+)?[α-ω]{0,4}διοκ[α-ω]{0,12}/ig;
    let om = null, oa;

    while ((oa = ownerAnchor.exec(flat))) {
      const tail = flat.slice(oa.index, Math.min(flat.length, oa.index + 250));
      
      // Πολλαπλά patterns για το όνομα
      const namePatterns = [
        /[\s:{,.-]*([Α-ΩA-Z]{3,}(?:\s+[Α-ΩA-Z]{3,}){1,2})\s+(?:του|της)\s+([Α-ΩA-Z]{3,})/i,
        /[\s:{,.-]*([Α-ΩA-Z]{4,}\s+[Α-ΩA-Z]{4,})/i
      ];

      for (const pat of namePatterns) {
        const nm = tail.match(pat);
        if (nm) {
          om = {
            name: nm[1].replace(/^[^Α-ΩA-Z]+/i, '').trim(),
            patronymic: nm[2] || null,
            index: oa.index
          };
          break;
        }
      }
      if (om) break;
    }

    if (om) {
      f.ownerFull = om.name.toUpperCase();
      f.ownerName = f.ownerFull;
      f.ownerNeedsReview = true;
      warnings.push('Ονοματεπώνυμο από ιδιοκτήτη: επιβεβαίωσε γράμμα προς γράμμα.');

      // Βελτιωμένη ανίχνευση διεύθυνσης
      f.address = findAddress(flat, om.index);
    } else {
      f.ownerFull = null;
      f.ownerName = null;
      f.address = null;
      warnings.push('Δεν βρέθηκε με ασφάλεια το ονοματεπώνυμο.');
    }

    /* ---------- ΑΦΑΙΡΕΣΗ ---------- */

    const removal = /αφαιρεση\s+της\s+αδειας\s+ικανοτητας/i.test(flat) ||
                    /αφαιρεση\s+αδειας\s+οδηγησης/i.test(flat);

    f.removal = {
      required: removal,
      days: removal ? parseDays(flat, warnings) : null,
      circulation: /αφαιρεση[^.]{0,200}?(πινακιδ|αδειας\s+κυκλοφοριας)/i.test(flat)
    };

    /* ---------- ΕΙΔΙΚΕΣ ΔΙΑΤΑΞΕΙΣ ---------- */

    f.clauses = {
      complaint169:
        /169\s*π\.?\s*κ/i.test(flat) &&
        (/απειθεια/i.test(flat) || /αρνηση\s+προσελευσης/i.test(flat)),
      payNotRequired:
        /δεν\s+ειναι\s+υποχρεωτικο[^)]{0,80}αποδοση/i.test(flat)
    };

    return { fields: f, warnings };
  }

  /* ---------- ΣΥΓΧΩΝΕΥΣΗ ΑΝΑ ΠΕΡΑΣΜΑ OCR ---------- */
  /* Το ocr-scan.js ενώνει 5 αναγνώσεις. Κάθε πέρασμα αναλύεται χωριστά και
     κάθε πεδίο παίρνει την τιμή που βρέθηκε στα περισσότερα περάσματα. */

  const LABEL_RE = /\[(?:ΟΛΟΚΛΗΡΗ ΣΕΛΙΔΑ|ΚΕΦΑΛΙΔΑ|ΚΥΡΙΑ ΠΑΡΑΓΡΑΦΟΣ)[^\]]*\]/g;
  const MAX_PLACE = 90, MAX_VTEXT = 160;

  function splitPasses(text) {
    const s = String(text || '');
    const parts = s.split(LABEL_RE).map(x => x.trim()).filter(x => x.length > 15);
    return parts.length ? parts : [s];
  }

  function vote(values) {
    const c = new Map();
    values.forEach((v, i) => {
      if (v === null || v === undefined || v === '') return;
      const k = typeof v === 'object' ? JSON.stringify(v) : String(v);
      const e = c.get(k) || { v, n: 0, i };
      e.n++; c.set(k, e);
    });
    let best = null;
    c.forEach(e => { if (!best || e.n > best.n || (e.n === best.n && e.i < best.i)) best = e; });
    return best ? best.v : null;
  }

  function parseDocument(rawText) {
    const rs = splitPasses(rawText).map(parseOne);
    const F = rs.map(r => r.fields);
    const pick = (fn, ok) => vote(F.map(fn).filter(v => v !== null && v !== undefined && (!ok || ok(v))));
    const f = {}, w = [];

    // πινακίδα: προτεραιότητα σε όσες βρέθηκαν δίπλα στο «υπ' αριθ.»
    const anch = F.filter(x => x.plate && x.plateAnchored);
    const pool = anch.length ? anch : F.filter(x => x.plate);
    f.plate = vote(pool.map(x => x.plate));
    const plates = Array.from(new Set(F.map(x => x.plate).filter(Boolean)));
    if (f.plate) w.push('Πινακίδα: ' + f.plate + '. Απαιτείται οπτική επιβεβαίωση.');
    else w.push('Δεν βρέθηκε πινακίδα με επαρκή βεβαιότητα.');
    if (plates.length > 1) w.push('Η πινακίδα διαβάστηκε διαφορετικά στα περάσματα: ' + plates.join(' / ') + '.');

    f.docDate = pick(x => x.docDate);
    f.service = pick(x => x.service);
    if (!f.service) w.push('Δεν βρέθηκε υπηρεσία ανάθεσης.');
    f.senderProtocol = pick(x => x.senderProtocol);
    f.type = pick(x => x.type);
    f.actNumber = pick(x => x.actNumber);
    f.actDate = pick(x => x.actDate);

    // ημερομηνία παράβασης: προτιμάται η πραγματική, όχι η εικασία από την πράξη
    f.violationDate = vote(F.filter(x => x.violationDate && !x.vDateGuess).map(x => x.violationDate));
    if (!f.violationDate) {
      f.violationDate = vote(F.map(x => x.violationDate));
      if (f.violationDate) w.push('Ημερομηνία παράβασης: δεν διαβάστηκε σίγουρα, μπήκε η ημερομηνία της πράξης. Έλεγξέ την.');
    }
    f.violationTime = pick(x => x.violationTime);

    // τόπος: όριο μήκους, ώστε ένα λάθος OCR να μη γεμίζει το πεδίο με σκουπίδια
    f.place = pick(x => x.place, p => p.length >= 3 && p.length <= MAX_PLACE);
    if (!f.place && F.some(x => x.place)) w.push('Τόπος: δεν διαβάστηκε με ασφάλεια. Συμπλήρωσέ τον χειροκίνητα.');
    if (f.place && /χ\/θ/.test(f.place) && !/\+/.test(f.place)) w.push('Τόπος: έλεγξε τη χιλιομετρική θέση (το OCR δεν διάβασε το "+").');

    f.speed = pick(x => x.speed);
    f.violationText = pick(x => x.violationText, t => t.length <= MAX_VTEXT);
    f.article = pick(x => x.article);
    f.law = pick(x => x.law);
    if (!f.article) {
      const aw = rs.map(r => r.warnings.find(x => x.indexOf('Άρθρο:') === 0)).find(Boolean);
      if (aw) w.push(aw);
    }

    // ιδιοκτήτης: η διεύθυνση λαμβάνεται από το ίδιο πέρασμα με το όνομα
    f.ownerFull = pick(x => x.ownerFull);
    f.ownerName = f.ownerFull;
    f.ownerNeedsReview = !!f.ownerFull;
    const same = F.filter(x => x.ownerFull && x.ownerFull === f.ownerFull);
    f.address = (same.find(x => x.address && x.address.street) || same.find(x => x.address) || {}).address || null;
    if (f.ownerFull) w.push('Ονοματεπώνυμο από ιδιοκτήτη: επιβεβαίωσε γράμμα προς γράμμα.');
    else w.push('Δεν βρέθηκε με ασφάλεια το ονοματεπώνυμο.');

    // αφαίρεση
    const required = F.some(x => x.removal && x.removal.required);
    const days = vote(F.map(x => (x.removal && x.removal.days) || null));
    f.removal = {
      required,
      days: required ? days : null,
      circulation: F.some(x => x.removal && x.removal.circulation)
    };
    if (required && !days) w.push('Ημέρες αφαίρεσης: δεν αναγνωρίστηκε ασφαλής αριθμός.');
    const dw = rs.map(r => r.warnings.find(x => x.indexOf('Διαφωνία OCR στις ημέρες') === 0)).find(Boolean);
    if (required && dw) w.push(dw);

    f.clauses = {
      complaint169: F.some(x => x.clauses && x.clauses.complaint169),
      payNotRequired: F.some(x => x.clauses && x.clauses.payNotRequired)
    };

    return { fields: f, warnings: w, passes: rs.length };
  }


  /* ---------- ΜΕΤΑΤΡΟΠΗ ΣΤΑ ΠΕΔΙΑ ΤΗΣ ΦΟΡΜΑΣ ---------- */

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
      const street = f.address.street;
      const num = f.address.number ? ' ' + f.address.number : '';
      o.address = street + num;
    }

    if (f.address && f.address.city &&
        !/^ΚΑΛΑΜΑΡΙΑΣ?$/.test(f.address.city)) {
      o.info.push('Η πόλη κατοικίας είναι ' + f.address.city +
        ' (το πρότυπο γράφει "κάτοικο Καλαμαριάς").');
    }

    const vt = violationKind(f.violationText);
    if (vt) o.violationType = vt;

    if (f.removal.required) {
      if (f.removal.days) o.removalDays = f.removal.days;
      o.removalWhat = f.removal.circulation ? 'both' : 'license';
    }

    if (f.violationDate) o.vDate = f.violationDate;
    if (f.place) o.vPlace = f.place;
    if (f.article) o.vArticle = f.article.short || f.article.raw;

    if (f.clauses.complaint169) {
      o.endRoute = 'complaint';
      o.notes.push('ΜΗΝΥΣΗ 169 Π.Κ. ΜΕΤΑ ΤΙΣ ΠΡΟΣΚΛΗΣΕΙΣ');
    }
    if (f.clauses.payNotRequired) {
      o.notes.push('ΑΠΟΔΟΣΗ ΧΩΡΙΣ ΠΛΗΡΩΜΗ ΠΡΟΣΤΙΜΟΥ');
    }

    return o;
  }

  const api = { parseDocument, toForm, prepare };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.OcrParser = api;
  }
})(typeof self !== 'undefined' ? self : this);