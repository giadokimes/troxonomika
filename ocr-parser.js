
/* troxonomika - ocr-parser.js
   Ανάλυση OCR κειμένου ελληνικών εγγράφων.
   Οι αναγνωρισμένες τιμές είναι προτάσεις και απαιτούν επιβεβαίωση.
*/
(function (root) {
  'use strict';

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .replace(/[‐-‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanLine = (value) => normalize(value)
    .replace(/[|_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  function linesOf(text) {
    return String(text || '')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(cleanLine)
      .filter(Boolean);
  }

  function greekLookalikes(value) {
    return String(value || '')
      .replace(/[A]/g, 'Α')
      .replace(/[B]/g, 'Β')
      .replace(/[E]/g, 'Ε')
      .replace(/[Z]/g, 'Ζ')
      .replace(/[H]/g, 'Η')
      .replace(/[I]/g, 'Ι')
      .replace(/[K]/g, 'Κ')
      .replace(/[M]/g, 'Μ')
      .replace(/[N]/g, 'Ν')
      .replace(/[O]/g, 'Ο')
      .replace(/[P]/g, 'Ρ')
      .replace(/[T]/g, 'Τ')
      .replace(/[Y]/g, 'Υ')
      .replace(/[X]/g, 'Χ');
  }

  function latinLookalikes(value) {
    return String(value || '')
      .replace(/[Α]/g, 'A')
      .replace(/[Β]/g, 'B')
      .replace(/[Ε]/g, 'E')
      .replace(/[Ζ]/g, 'Z')
      .replace(/[Η]/g, 'H')
      .replace(/[Ι]/g, 'I')
      .replace(/[Κ]/g, 'K')
      .replace(/[Μ]/g, 'M')
      .replace(/[Ν]/g, 'N')
      .replace(/[Ο]/g, 'O')
      .replace(/[Ρ]/g, 'P')
      .replace(/[Τ]/g, 'T')
      .replace(/[Υ]/g, 'Y')
      .replace(/[Χ]/g, 'X');
  }

  function extractPlate(text) {
    const source = normalize(text).toUpperCase();
    const candidates = new Map();

    const patterns = [
      /([Α-ΩA-Z]{3})[\s\-_.]*([0-9ΟΙΖΒS]{4})/g
    ];

    function normalizePlateLetters(value) {
      return latinLookalikes(greekLookalikes(value))
        .replace(/[^A-Z]/g, '');
    }

    function normalizePlateDigits(value) {
      return value
        .replace(/Ο/g, '0')
        .replace(/Ι/g, '1')
        .replace(/Ζ/g, '2')
        .replace(/Β/g, '8')
        .replace(/S/g, '5')
        .replace(/[^0-9]/g, '');
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source)) !== null) {
        const letters = normalizePlateLetters(match[1]);
        const digits = normalizePlateDigits(match[2]);

        if (letters.length === 3 && digits.length === 4) {
          const plate = letters + '-' + digits;
          candidates.set(plate, (candidates.get(plate) || 0) + 1);
        }
      }
    }

    const sorted = [...candidates.entries()]
      .sort((a, b) => b[1] - a[1]);

    return {
      value: sorted.length ? sorted[0][0] : '',
      candidates: sorted.map(([value, count]) => ({ value, count }))
    };
  }

  function extractService(text) {
    const lines = linesOf(text);
    const keywords = [
      'ΥΠΗΡΕΣΙΑ',
      'ΤΜΗΜΑ',
      'ΔΙΕΥΘΥΝΣΗ',
      'ΑΣΤΥΝΟΜΙΚΟ ΤΜΗΜΑ',
      'ΤΜΗΜΑ ΤΡΟΧΑΙΑΣ',
      'ΤΡΟΧΑΙΑ'
    ];

    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      if (keywords.some(k => upper.includes(k))) {
        const candidate = line
          .replace(/^(ΑΠΟ|ΠΡΟΣ|ΑΠΟ ΤΗΝ|ΑΠΟ ΤΟ)\s*[:\-]?\s*/i, '')
          .replace(/^(ΥΠΗΡΕΣΙΑ|ΤΜΗΜΑ|ΔΙΕΥΘΥΝΣΗ)\s*[:\-]?\s*/i, '')
          .trim();

        if (candidate.length >= 5) {
          matches.push(candidate);
        }

        if (
          lines[i + 1] &&
          lines[i + 1].length >= 5 &&
          lines[i + 1].length <= 100 &&
          /ΑΣΤΥΝ|ΤΡΟΧ|ΔΙΕΥΘΥΝ|ΤΜΗΜΑ|ΥΠΟΔΙΕΥΘΥΝ/i.test(lines[i + 1])
        ) {
          matches.push(lines[i + 1]);
        }
      }
    }

    const unique = [...new Set(matches)];

    return {
      value: unique[0] || '',
      candidates: unique
    };
  }

  function isLikelyName(value) {
    const v = cleanLine(value)
      .replace(/[0-9]/g, '')
      .trim();

    if (v.length < 7 || v.length > 85) return false;
    if (/^[^Α-ΩA-Z]*$/i.test(v)) return false;
    if (/^[0-9\s.,:/-]+$/.test(v)) return false;
    if (/^(ΑΡΙΘΜ|ΗΜΕΡ|ΠΙΝΑΚ|ΥΠΗΡΕΣ|ΤΜΗΜ|ΔΙΕΥΘΥΝ|ΘΕΜΑ|ΣΧΕΤ)/i.test(v)) return false;
    if (v.split(/\s+/).length < 2) return false;

    return true;
  }

  function extractOwner(text) {
    const lines = linesOf(text);
    const candidates = [];

    const labels = [
      /(?:ΙΔΙΟΚΤΗΤΗ|ΙΔΙΟΚΤΗΤΗΣ|ΚΑΤΟΧΟΣ|ΟΝΟΜΑΤΕΠΩΝΥΜΟ|ΕΠΩΝΥΜΟ|ΟΝΟΜΑ)\s*[:\-]?\s*(.+)/i,
      /(?:ΤΟΥ|ΤΗΣ)\s+ΚΥΡΙΟΥ\s+(.+)/i
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of labels) {
        const match = line.match(pattern);
        if (match && match[1] && isLikelyName(match[1])) {
          candidates.push(match[1].trim());
        }
      }

      const ownership = line.match(
        /\b(?:ΤΟΥ|ΤΗΣ)\s+([Α-ΩA-Z][Α-ΩA-Z\s.'-]{5,70})/i
      );

      if (ownership && isLikelyName(ownership[1])) {
        candidates.push(ownership[1]);
      }

      if (
        /ΟΝΟΜΑΤΕΠΩΝΥΜΟ|ΙΔΙΟΚΤΗΤΗ|ΚΑΤΟΧΟΣ/i.test(line) &&
        lines[i + 1] &&
        isLikelyName(lines[i + 1])
      ) {
        candidates.push(lines[i + 1]);
      }
    }

    const unique = [...new Set(
      candidates.map(v => v.replace(/\s+/g, ' ').trim())
    )];

    return {
      value: unique[0] || '',
      candidates: unique
    };
  }

  const numberWords = {
    'ΜΙΑ': 1,
    'ΕΝΑ': 1,
    'ΕΝΑΣ': 1,
    'ΔΥΟ': 2,
    'ΤΡΙΑ': 3,
    'ΤΡΕΙΣ': 3,
    'ΤΕΣΣΕΡΑ': 4,
    'ΤΕΣΣΑΡΑ': 4,
    'ΠΕΝΤΕ': 5,
    'ΕΞΙ': 6,
    'ΕΠΤΑ': 7,
    'ΟΚΤΩ': 8,
    'ΕΝΝΕΑ': 9,
    'ΔΕΚΑ': 10,
    'ΕΝΤΕΚΑ': 11,
    'ΔΩΔΕΚΑ': 12,
    'ΔΕΚΑΤΡΕΙΣ': 13,
    'ΔΕΚΑΤΕΣΣΕΡΙΣ': 14,
    'ΔΕΚΑΠΕΝΤΕ': 15,
    'ΔΕΚΑΕΞΙ': 16,
    'ΔΕΚΑΕΠΤΑ': 17,
    'ΔΕΚΑΟΚΤΩ': 18,
    'ΔΕΚΑΕΝΝΕΑ': 19,
    'ΕΙΚΟΣΙ': 20,
    'ΤΡΙΑΝΤΑ': 30,
    'ΣΑΡΑΝΤΑ': 40,
    'ΠΕΝΗΝΤΑ': 50,
    'ΕΞΗΝΤΑ': 60,
    'ΕΒΔΟΜΗΝΤΑ': 70,
    'ΟΓΔΟΝΤΑ': 80,
    'ΕΝΕΝΗΝΤΑ': 90,
    'ΕΚΑΤΟ': 100
  };

  function extractDays(text) {
    const source = normalize(text).toUpperCase();

    const wordFirst = source.match(
      /\b(ΕΙΚΟΣΙ|ΤΡΙΑΝΤΑ|ΣΑΡΑΝΤΑ|ΠΕΝΗΝΤΑ|ΕΞΗΝΤΑ|ΕΒΔΟΜΗΝΤΑ|ΟΓΔΟΝΤΑ|ΕΝΕΝΗΝΤΑ|ΕΚΑΤΟ|ΠΕΝΤΕ|ΔΕΚΑ|ΔΥΟ|ΤΡΙΑ|ΤΕΣΣΕΡΑ|ΕΞΙ|ΕΠΤΑ|ΟΚΤΩ|ΕΝΝΕΑ)\b[^.\n]{0,45}\bΗΜΕΡ/i
    );

    if (wordFirst) {
      const word = wordFirst[1];
      const value = numberWords[word];

      if (value) {
        return {
          value,
          source: 'words',
          candidates: []
        };
      }
    }

    const numeric = source.match(
      /\b(\d{1,3})\s*(?:\(\s*\d{1,3}\s*\)\s*)?ΗΜΕΡ/i
    );

    if (numeric) {
      return {
        value: Number(numeric[1]),
        source: 'digits',
        candidates: []
      };
    }

    return {
      value: null,
      source: '',
      candidates: []
    };
  }

  function parse(text) {
    const plate = extractPlate(text);
    const service = extractService(text);
    const owner = extractOwner(text);
    const days = extractDays(text);

    return {
      plate: plate.value,
      plateCandidates: plate.candidates,
      service: service.value,
      serviceCandidates: service.candidates,
      owner: owner.value,
      ownerCandidates: owner.candidates,
      days: days.value,
      daysSource: days.source,
      rawText: String(text || ''),
      needsReview: true
    };
  }

  // Συμβατότητα με το app.js που καλεί parseDocument().
  function parseDocument(text) {
    return parse(text);
  }

  root.OcrParser = {
    parse,
    parseDocument,
    extractPlate,
    extractService,
    extractOwner,
    extractDays
  };

})(typeof self !== 'undefined' ? self : this);
