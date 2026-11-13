(() => {
  const KEY = 'troxonomika_final_v24';
  const OLD = [...Array(22)].map((_, i) => 'troxonomika_final_v' + (22 - i))
    .concat(['ypotheseis_pwa_v1','ypotheseis.v1','troxonomika.cases.v1','ypotheseis.v2','ypotheseis_gemini_v1']);
  OLD.unshift('troxonomika_final_v23');

  // ---------- Ρυθμίσεις & Σταθερές ----------
  const ST = {
    search:      { l: 'Προς Αναζήτηση', t: 'info', a: 'Εκκρεμεί αναζήτηση τηλεφώνου' },
    to_call:     { l: 'Προς Κλήση', t: 'info', a: '' },
    informed:    { l: 'Ενημερώθηκε', t: 'warn', a: 'Αναμονή 5 ημερών για πρόσκληση' },
    appointment: { l: 'Κλεισμένο Ραντεβού', t: 'info', a: '' },
    no_show:     { l: 'Μη Προσέλευση', t: 'bad', a: 'Δεν προσήλθε στο ραντεβού' },
    suspended:   { l: 'Σε Αφαίρεση', t: 'info', a: '' },
    to_return:   { l: 'Προς Απόδοση', t: 'bad', a: 'Έληξε η αφαίρεση' },
    inv1_create: { l: 'Προς δημιουργία 1η Πρόσκλησης', t: 'warn', a: 'Δημιουργία 1ης πρόσκλησης' },
    inv1_next:   { l: 'Προς αποστολή 1η Πρόσκλησης', t: 'warn', a: 'Αποστολή 1ης' },
    inv1_sent:   { l: 'Αναμονή 1ου Αποδεικτικού', t: 'warn', a: 'Καταχώρηση αποδεικτικού' },
    inv1_wait:   { l: 'Αναμονή 10ημ. (1ο Αποδ.)', t: 'warn', a: '' },
    inv2_create: { l: 'Προς δημιουργία 2η Πρόσκλησης', t: 'warn', a: 'Δημιουργία 2ης πρόσκλησης' },
    inv2_next:   { l: 'Προς αποστολή 2η Πρόσκλησης', t: 'warn', a: 'Αποστολή 2ης' },
    inv2_sent:   { l: 'Αναμονή 2ου Αποδεικτικού', t: 'warn', a: 'Καταχώρηση αποδεικτικού' },
    inv2_wait:   { l: 'Αναμονή 10ημ. (2ο Αποδ.)', t: 'warn', a: '' },
    inv3_create: { l: 'Προς δημιουργία 3η Πρόσκλησης', t: 'warn', a: 'Δημιουργία 3ης πρόσκλησης' },
    inv3_next:   { l: 'Προς αποστολή 3η Πρόσκλησης', t: 'warn', a: 'Αποστολή 3ης' },
    inv3_sent:   { l: 'Αναμονή 3ου Αποδεικτικού', t: 'warn', a: 'Καταχώρηση αποδεικτικού' },
    inv3_wait:   { l: 'Αναμονή 10ημ. (3ο Αποδ.)', t: 'warn', a: '' },
    transmittal: { l: 'Προς διαβίβαση στην Υπηρεσία', t: 'bad', a: 'Δημιουργία διαβιβαστικού και αποστολή στην Υπηρεσία' },
    pol_rem:     { l: 'Αφαίρεση — εκκρεμεί POL', t: 'bad', a: '' },
    pol_ret:     { l: 'Απόδοση — εκκρεμεί POL', t: 'bad', a: '' },
    complaint:   { l: 'Προς Μήνυση', t: 'bad', a: 'Υποβολή μήνυσης' },
    closed:      { l: 'Ολοκληρωμένη', t: 'ok', a: '' }
  };
  const URG = ['pol_rem','pol_ret','to_return','transmittal','complaint','inv1_create','inv2_create','inv3_create','inv1_next','inv2_next','inv3_next'];
  const BANNER = {
    pol_rem: 'Καταχώρηση POL (αφαίρεση)',
    pol_ret: 'Καταχώρηση POL (απόδοση)',
    to_return: 'Προς απόδοση διπλώματος',
    transmittal: 'Δημιουργία διαβιβαστικού',
    complaint: 'Υποβολή μήνυσης',
    inv1_create: 'Δημιουργία 1ης πρόσκλησης', inv2_create: 'Δημιουργία 2ης πρόσκλησης', inv3_create: 'Δημιουργία 3ης πρόσκλησης',
    inv1_next: 'Αποστολή 1ης πρόσκλησης', inv2_next: 'Αποστολή 2ης πρόσκλησης', inv3_next: 'Αποστολή 3ης πρόσκλησης',
    move: 'Μετακίνηση φακέλου',
    soon: 'Επικείμενη απόδοση διπλώματος (έως 3 ημ.)',
    'flag:pol_rem': 'Καταχώρηση POL (αφαίρεση)', 'flag:pol_ret': 'Καταχώρηση POL (απόδοση)'
  };
  const FOLDERS = {
    'Τηλέφωνα': ['Με ραντεβού', 'Χωρίς ραντεβού'],
    'Προσκλήσεις': ['1η πρόσκληση', '2η πρόσκληση', '3η πρόσκληση'],
    'Αναμονή αποδεικτικού': ['Αναμονή αποδεικτικού'],
    'Εκκρεμότητες': ['Αναζήτηση τηλεφώνου', 'Αποστολή πρόσκλησης', 'Διαβίβαση σε Υπηρεσία', 'Καταχώρηση POL']
  };
  const VIOL = ['Υπερβολική ταχύτητα','ΚΤΕΟ','Διόδια','Στάθμευση','Απόφαση'];
  const BLANK_DATES = { phone:'', appt:'', susp:'', return:'', inv1Send:'', inv1Proof:'', inv2Send:'', inv2Proof:'', inv3Send:'', inv3Proof:'', inv1Create:'', inv2Create:'', inv3Create:'', returned:'', closed:'', closedKind:'', callRes:'', searchNone:'', docRecv:'', polRem:'', polRet:'', oos:'', oosDest:'', oosReason:'' };

  let cases = [], folderF = 'all', stateF = 'all', q = '';

  // ---------- Utilities ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const todayStr = () => iso(new Date());
  const fmt = v => v ? new Date(v + 'T12:00:00').toLocaleDateString('el-GR') : '—';
  const sd = (v) => { if (!v) return '—'; const [y, m, d] = v.split('-'); return d + '/' + m + (y !== String(new Date().getFullYear()) ? '/' + y : ''); };
  const telHref = (x) => 'tel:' + x.replace(/[^\d+]/g, '');
  const phoneList = (p) => String(p || '').split(/[\/,;\n]+/).map(x => x.trim()).filter(x => x.replace(/\D/g, '').length >= 7);
  const plus = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const LAT = { A:'Α', B:'Β', E:'Ε', Z:'Ζ', H:'Η', I:'Ι', K:'Κ', M:'Μ', N:'Ν', O:'Ο', P:'Ρ', T:'Τ', Y:'Υ', X:'Χ' };
  const toGreek = s => String(s ?? '').toUpperCase().replace(/[A-Z]/g, ch => LAT[ch] || ch);
  const normPlate = s => toGreek(s).replace(/[\s\-–.]/g, '');
  const fold = s => toGreek(String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  // ---------- Υπολογισμός Αργιών ----------
  const getOrthodoxEaster = (year) => {
    const a = year % 4, b = year % 7, c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 13);
    return date;
  };

  const isHoliday = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    const md = `${m}-${day}`;
    if (['1-1', '1-6', '3-25', '5-1', '8-15', '10-26', '10-28', '12-25', '12-26'].includes(md)) return true;
    const easter = getOrthodoxEaster(y);
    const diff = Math.round((Date.UTC(y, m - 1, day) - Date.UTC(easter.getFullYear(), easter.getMonth(), easter.getDate())) / 86400000);
    if ([-48, -2, 1, 50].includes(diff)) return true;
    return false;
  };

  const isWeekend = (dateStr) => { const w = new Date(dateStr + 'T12:00:00').getDay(); return w === 0 || w === 6; };
  const isNonWorking = (dateStr) => isWeekend(dateStr) || isHoliday(dateStr);

  const shiftForward = (dateStr) => { let d = new Date(dateStr + 'T12:00:00'); while (isNonWorking(iso(d))) d.setDate(d.getDate() + 1); return iso(d); };
  const shiftBackward = (dateStr) => { let d = new Date(dateStr + 'T12:00:00'); while (isNonWorking(iso(d))) d.setDate(d.getDate() - 1); return iso(d); };
  const addDays = (dateStr, days, dir = 'forward') => {
    if (!dateStr) return '';
    let d = new Date(dateStr + 'T12:00:00'); d.setDate(d.getDate() + Number(days));
    return dir === 'backward' ? shiftBackward(iso(d)) : shiftForward(iso(d));
  };
  const isDue = (dateStr) => !!dateStr && dateStr <= todayStr();

  // ---------- Αποθήκευση & Migration ----------
  let locked = false;
  const save = () => {
    if (locked) { alert('Η εφαρμογή είναι μόνο για ανάγνωση επειδή απέτυχε η μεταφορά δεδομένων. Δεν αποθηκεύτηκε τίποτα.'); return; }
    localStorage.setItem(KEY, JSON.stringify(cases));
  };
  const get = (id) => cases.find(x => x.id === id);
  const stripNo = (f) => String(f || '').replace(/^[0-9]\.\s*/, '');

  const mapOld = (o) => {
    const s = (o.status || '').toLowerCase();
    const m = { search:'search', to_call:'to_call', informed:'informed', called:'informed',
      appointment:'appointment', appt:'appointment', removed:'suspended', suspended:'suspended',
      to_return:'to_return', inv1_sent:'inv1_sent', invite1:'inv1_sent', inv1_proof:'inv2_next',
      inv2_sent:'inv2_sent', invite2:'inv2_sent', inv2_proof:'inv3_next', inv3_sent:'inv3_sent',
      invite3:'inv3_sent', inv3_proof:'return_service', return_service:'return_service', closed:'closed', done:'closed' };
    if (s === 'new') return o.phone ? 'to_call' : 'search';
    return m[s] || (o.phone ? 'to_call' : 'search');
  };

  const migrateBase = (o) => {
    if (o.state && o.dates) {
      o.folder = stripNo(o.folder);
      o.dates = { ...BLANK_DATES, ...o.dates };
      o.history = o.history || [];
      return o;
    }
    const c = {
      id: o.id || uid(), plate: o.plate || o.ref || '', name: o.name || o.fullName || '',
      service: o.service || '', phone: o.phone || '',
      receivedDate: o.receivedDate || o.dateReceived || todayStr(),
      folder: stripNo(o.folder || o.folderLocation),
      violationType: o.violationType || '', fine: o.fine || o.fineAmount || '',
      requiresLicense: o.requiresLicense !== false && o.hasRemoval !== false,
      removalDays: o.removalDays || o.suspDays || 30, notes: o.notes || '',
      state: mapOld(o), history: o.history || [],
      dates: { ...BLANK_DATES,
        phone: o.phoneDate || o.callDate || '', appt: o.apptDate || o.appointmentDate || '',
        susp: o.suspDate || o.removalDate || o.arrivedDate || '', return: o.returnDate || '',
        inv1Send: o.inv1Send || o.invite1Date || o.invite1 || '', inv1Proof: o.inv1Proof || o.proof1 || '',
        inv2Send: o.inv2Send || o.invite2Date || o.invite2 || '', inv2Proof: o.inv2Proof || o.proof2 || '',
        inv3Send: o.inv3Send || o.invite3Date || o.invite3 || '', inv3Proof: o.inv3Proof || o.proof3 || '',
        closed: o.closedDate || '' }
    };
    if (c.dates.susp && c.removalDays && !c.dates.return) c.dates.return = addDays(c.dates.susp, c.removalDays);
    return c;
  };

  const mig = { plates: 0, inv: 0, ret: 0, rem: 0, svc: 0, back: [] };
  const endState = (c) => c.violationType === 'Απόφαση' ? 'complaint' : 'transmittal';
  const ev = (c, d, t, r) => { c.ev = c.ev || []; c.ev.push({ d: d || todayStr(), t, r: r || '' }); };
  const parseFmt = (a) => { const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(a || ''); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : ''; };
  
  const buildEv = (c) => {
    const out = [];
    (c.history || []).forEach(h => {
      const a = String(h.action || ''), d = h.date || todayStr(), ap = parseFmt(a);
      const rv = ap ? 'ραντεβού στις ' + sd(ap) : 'ραντεβού';
      let m;
      if (/^ΔΕΝ ΒΡΕΘΗΚΕ ΤΗΛΕΦΩΝΟ/.test(a)) out.push({ d, t: 'Αναζήτηση τηλεφώνου', r: 'δεν βρέθηκε' });
      else if ((m = /^ΚΑΤΑΧΩΡΗΣΗ ΤΗΛΕΦΩΝΟΥ: (.*)$/.exec(a))) out.push({ d, t: 'Αναζήτηση τηλεφώνου', r: 'βρέθηκε (' + m[1] + ')' });
      else if (/^ΚΛΗΣΗ ΧΩΡΙΣ/.test(a)) out.push({ d, t: 'Κλήση', r: 'δεν απάντησε' });
      else if (/^ΕΝΗΜΕΡΩΘΗΚΕ/.test(a)) out.push({ d, t: 'Κλήση', r: 'ενημερώθηκε, θα καλέσει ο ίδιος' });
      else if (/^ΑΡΝΗΘΗΚΕ/.test(a)) out.push({ d, t: 'Κλήση', r: 'αρνήθηκε ή αναβάλλει' });
      else if (/^ΕΠΙΚΟΙΝΩΝΗΣΕ/.test(a)) out.push({ d, t: 'Επικοινώνησε ο πολίτης', r: rv });
      else if (/^ΝΕΟ ΡΑΝΤΕΒΟΥ/.test(a)) out.push({ d, t: 'Αλλαγή ραντεβού', r: 'νέο ' + rv });
      else if (/^ΡΑΝΤΕΒΟΥ:/.test(a)) out.push({ d, t: 'Κλήση', r: rv });
      else if (/^ΕΠΙΣΤΡΟΦΗ ΣΤΗΝ ΥΠΗΡΕΣΙΑ/.test(a)) out.push({ d: c.dates.closed || d, t: 'Επιστροφή στην Υπηρεσία' });
      else if (/^ΠΑΡΕΛΑΒΕ ΤΟ ΕΓΓΡΑΦΟ/.test(a)) out.push({ d: ap || d, t: 'Παραλαβή εγγράφου από τον πολίτη (χωρίς αφαίρεση)' });
      else if (/^ΔΗΜΙΟΥΡΓΙΑ ΔΙΑΒΙΒΑΣΤΙΚΟΥ/.test(a)) out.push({ d: ap || d, t: 'Διαβιβαστικό προς την Υπηρεσία' });
      else if (/^ΥΠΟΒΛΗΘΗΚΕ ΜΗΝΥΣΗ/.test(a)) out.push({ d: ap || d, t: 'Μήνυση' });
      else if (/^ΕΓΙΝΕ:.*POL \(ΑΦΑΙΡΕΣΗ\)/.test(a)) out.push({ d, t: 'Καταχώρηση POL (αφαίρεση)' });
      else if (/^ΕΓΙΝΕ:.*POL \(ΑΠΟΔΟΣΗ\)/.test(a)) out.push({ d, t: 'Καταχώρηση POL (απόδοση)' });
      else if (/^ΑΠΟΔΟΣΗ ΚΑΙ ΚΛΕΙΣΙΜΟ/.test(a) && !c.dates.returned) c.dates.returned = ap || c.dates.closed || d;
    });
    return out;
  };
  
  const step3 = (c) => { c.ev = buildEv(c); c.schema = 3; return step4(c); };
  // Σχήμα 4: τα γεγονότα καταγράφονται ως δεδομένα· η φάση και το ιστορικό προκύπτουν από αυτά
  const step4 = (c) => {
    const D = c.dates, evs = c.ev || [], last = (p) => evs.filter(p).pop();
    c._old = c.state;
    const call = last(e => /^(Κλήση|2η κλήση)$/.test(e.t));
    if (call && !D.callRes) {
      const r = call.r || '';
      D.callRes = /δεν απάντησε/.test(r) ? 'noanswer' : /αρνήθηκε/.test(r) ? 'refused' : /^ραντεβού/.test(r) ? 'booked' : /ενημερώθηκε/.test(r) ? 'informed' : '';
      if (!D.phone && D.callRes) D.phone = call.d;
    }
    if (!D.callRes && c.state === 'informed' && D.phone) D.callRes = 'informed';
    const sn = last(e => e.t === 'Αναζήτηση τηλεφώνου' && /δεν βρέθηκε/.test(e.r || '')); if (sn && !D.searchNone) D.searchNone = sn.d;
    const dr = last(e => /χωρίς αφαίρεση/.test(e.t)); if (dr && !D.docRecv) D.docRecv = dr.d;
    const pr = last(e => e.t === 'Καταχώρηση POL (αφαίρεση)'); if (pr && !D.polRem) D.polRem = pr.d;
    const pa = last(e => e.t === 'Καταχώρηση POL (απόδοση)'); if (pa && !D.polRet) D.polRet = pa.d;
    const cl = last(e => /^(Διαβιβαστικό|Επιστροφή στην Υπηρεσία|Μήνυση)/.test(e.t));
    if (cl) { if (!D.closed) D.closed = cl.d; if (!D.closedKind) D.closedKind = cl.t === 'Μήνυση' ? 'complaint' : 'transmittal'; }
    if (c.state === 'closed') {
      if (!D.closed) D.closed = evs.length ? evs[evs.length - 1].d : todayStr();
      if (!D.closedKind) D.closedKind = 'transmittal';
    }
    c.ev = []; c.schema = 4;
    return c;
  };
  
  const upgrade = (c) => {
    if (c.schema >= 4) return c;
    if (c.schema === 3) return step4(c);
    if (c.schema === 2) return step3(c);
    c.flags = c.flags || []; c.history = c.history || [];
    const np = normPlate(c.plate);
    if (np !== c.plate) { c.plate = np; mig.plates++; }
    const m = { inv1_next: 'inv1_create', inv2_next: 'inv2_create', inv3_next: 'inv3_create' };
    if (m[c.state]) { c.state = m[c.state]; mig.inv++; }
    if (c.state === 'return_service') { c.state = endState(c); mig.svc++; }
    if (c.dates.susp && c.removalDays) {
      const r = addDays(c.dates.susp, c.removalDays);
      if (r !== c.dates.return) { c.dates.return = r; mig.ret++; }
    }
    if (c.state === 'to_return' && c.dates.return && !isDue(c.dates.return)) { c.state = 'suspended'; mig.back.push(c.plate + ' ' + c.name); }
    if (!c.dates.susp && c.removalDays === 30 && c.state !== 'suspended' && c.state !== 'to_return') { c.removalDays = 0; c.requiresLicense = false; mig.rem++; }
    c.schema = 2;
    return step3(c);
  };
  // Καταργημένες καταστάσεις -> τρέχουσα πορεία (η 2η κλήση δεν υπάρχει πια)
  const RETIRED = { recall: 'inv1_create' };
  const fixState = (c) => { if (RETIRED[c.state]) { c.state = RETIRED[c.state]; setMove(c); } return c; };
  const migrate = (o) => fixState(upgrade(migrateBase(o)));

  const load = () => {
    try {
      const cur = localStorage.getItem(KEY);
      if (cur) { 
        cases = (JSON.parse(cur) || []).map(migrate);
        tick(); reportMig();
        return; 
      }
    } catch (e) {}
    for (const k of OLD) {
      let arr = null;
      try { arr = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { continue; }
      if (!Array.isArray(arr) || !arr.length) continue;
      try {
        const out = arr.map(migrate);
        if (out.length !== arr.length) throw new Error('count');
        cases = out; save();
        tick(); reportMig();
        const t = ['Μεταφέρθηκαν ' + out.length + ' υποθέσεις. Τα παλιά δεδομένα δεν διαγράφηκαν.'];
        setTimeout(() => alert(t.join('\n')), 400);
      } catch (e) {
        locked = true; cases = [];
        setTimeout(() => alert('Η μεταφορά δεδομένων απέτυχε. Δεν διαγράφηκε τίποτα και δεν θα αποθηκευτεί τίποτα νέο μέχρι να διορθωθεί.'), 400);
      }
      return;
    }
    cases = [];
  };

  const checkBackup = () => {
    const last = localStorage.getItem('last_backup');
    const warn = $('#backupWarning');
    warn.style.display = (!last || (Date.now() - Number(last)) > 7 * 86400000) ? 'flex' : 'none';
  };

  // ---------- Φάση υπόθεσης: υπολογίζεται από τα δεδομένα και την τρέχουσα ημερομηνία ----------
  const invDates = (D) => [1, 2, 3].flatMap(n => [D['inv' + n + 'Create'], D['inv' + n + 'Send'], D['inv' + n + 'Proof']]).filter(Boolean);
  const lastSent = (D) => [3, 2, 1].find(n => D['inv' + n + 'Send']) || 0;
  const derive = (c) => {
    const D = c.dates;
    if (D.susp && !D.polRem) return 'pol_rem';
    if (D.returned && !D.polRet) return 'pol_ret';
    if (D.closed) return 'closed';
    if (D.returned || D.docRecv || D.oos) return 'transmittal';
    if (D.susp) return D.return && isDue(D.return) ? 'to_return' : 'suspended';
    const li = invDates(D).sort().pop() || '';
    if (D.appt && D.appt > li) {
      if (todayStr() <= D.appt) return 'appointment';
      return lastSent(D) >= 3 ? endState(c) : 'inv' + (lastSent(D) + 1) + '_create';
    }
    for (let n = 3; n >= 1; n--) {
      const cr = D['inv' + n + 'Create'], se = D['inv' + n + 'Send'], pr = D['inv' + n + 'Proof'];
      if (!cr && !se && !pr) continue;
      if (pr) return !isDue(addDays(pr, 10)) ? `inv${n}_wait` : (n === 3 ? endState(c) : `inv${n + 1}_create`);
      return se ? `inv${n}_sent` : `inv${n}_next`;
    }
    const r = D.callRes;
    if (r === 'noanswer' || r === 'refused') return 'inv1_create';
    if (r === 'informed') return D.phone && !isDue(addDays(D.phone, 5)) ? 'informed' : 'inv1_create';
    if (!phoneList(c.phone).length) return D.searchNone ? 'inv1_create' : 'search';
    return 'to_call';
  };
  const flagsOf = () => [];
  const reconcile = (c) => {
    const D = c.dates; let ch = false;
    if (D.susp && c.removalDays) { const r = addDays(D.susp, c.removalDays); if (r !== D.return) { D.return = r; ch = true; } }
    const fl = flagsOf(c), st = derive(c);
    if (JSON.stringify(c.flags || []) !== JSON.stringify(fl)) { c.flags = fl; ch = true; }
    if (c.state !== st) { c.state = st; ch = true; }
    if (ch) setMove(c);
    return ch;
  };
  const tick = () => { let ch = false; cases.forEach(c => { if (reconcile(c)) ch = true; }); if (ch) save(); };
  const reportMig = () => {
    if (!cases.some(c => c._old !== undefined)) return;
    const nm = (x) => (ST[x] || {}).l || x;
    const moved = cases.filter(c => c._old !== undefined && c._old !== c.state).map(c => c.plate + ': ' + nm(c._old) + ' -> ' + nm(c.state));
    cases.forEach(c => { delete c._old; }); save();
    if (moved.length) setTimeout(() => alert('Η φάση κάθε υπόθεσης υπολογίζεται πλέον από τα δεδομένα. ' + moved.length + ' υποθέσεις άλλαξαν φάση:\n' + moved.slice(0, 12).join('\n')), 500);
  };
  const go = (c, _s, extra) => { Object.assign(c.dates, extra || {}); reconcile(c); save(); render(); };

  // ---------- Wizard ----------
  const dlgW = $('#dlgWizard');
  const wiz = (title, desc, body, btns) => {
    $('#wT').textContent = title; $('#wD').textContent = desc || ''; $('#wB').innerHTML = body || '';
    const a = $('#wA'); a.innerHTML = '';
    btns.concat([{ t: 'Άκυρο', c: 'ghost', confirm: false }]).forEach(b => {
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'btn ' + (b.c || ''); x.textContent = b.t;
      x.onclick = () => { 
        if (b.v && !b.v()) return; 
        if (b.confirm !== false && !confirm('Είστε σίγουρος/η για την ενέργεια;')) return;
        dlgW.close(); 
        if (b.f) b.f(); 
      };
      a.append(x);
    });
    if (!dlgW.open) dlgW.showModal();
  };
  
  const dateWiz = (title, desc, cb) => wiz(title, desc, `<input type="date" id="wV" value="${todayStr()}">`,
    [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value, f: () => cb($('#wV').value) }]);

  // ---------- Ενέργειες: καταγράφουν δεδομένα, η φάση υπολογίζεται αυτόματα ----------
  const T = () => todayStr();
  const nextN = (c) => Math.min(3, lastSent(c.dates) + 1);
  const blocked = (c, fl, msg) => { if ((c.flags || []).includes(fl)) { alert(msg); return true; } return false; };
  const actSearch = (c) => wiz('Αναζήτηση τηλεφώνου', 'Βρέθηκε τηλέφωνο;', '', [
    { t: 'Όχι, δεν βρέθηκε', c: 'bad', f: () => go(c, '', { searchNone: T() }) },
    { t: 'Ναι', c: 'ok', f: () => wiz('Εισαγωγή τηλεφώνου', 'Πληκτρολογήστε τον αριθμό:', '<input type="tel" id="wV">',
      [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value.trim(), f: () => { c.phone = $('#wV').value.trim(); go(c, '', { searchNone: '' }); } }]) }
  ]);
  const callOutcome = (c) => wiz('Αποτέλεσμα κλήσης', 'Τι απάντησε ο πολίτης;', '', [
    { t: 'Έκλεισε ραντεβού', c: 'ok', f: () => dateWiz('Ημερομηνία ραντεβού', 'Επιλέξτε ημερομηνία:', v => go(c, '', { appt: v, phone: T(), callRes: 'booked' })) },
    { t: 'Θα καλέσει ο ίδιος (αναμονή 5 ημ.)', f: () => go(c, '', { phone: T(), callRes: 'informed' }) },
    { t: 'Αρνήθηκε ή αναβάλλει', c: 'bad', f: () => go(c, '', { phone: T(), callRes: 'refused' }) }
  ]);
  const actCall = (c) => wiz('Καταχώρηση κλήσης', 'Απάντησε ο πολίτης;', '', [
    { t: 'Όχι', c: 'bad', f: () => go(c, '', { phone: T(), callRes: 'noanswer' }) },
    { t: 'Ναι', c: 'ok', f: () => callOutcome(c) }
  ]);
  const actAppt = (c) => dateWiz('Ραντεβού', 'Ημερομηνία ραντεβού:', v => go(c, '', { appt: v }));
  const actRemoval = (c) => wiz('Αφαίρεση διπλώματος', c.removalDays ? 'Ημερομηνία αφαίρεσης (' + c.removalDays + ' ημέρες):' : 'Ημερομηνία αφαίρεσης και ημέρες:',
    `<input type="date" id="wV" value="${T()}">` + (c.removalDays ? '' : '<input type="number" id="wN" min="1" placeholder="Ημέρες αφαίρεσης">'),
    [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value && (c.removalDays || Number($('#wN').value) > 0), f: () => {
      if (!c.removalDays) c.removalDays = Number($('#wN').value);
      c.requiresLicense = true; go(c, '', { susp: $('#wV').value });
    } }]);
  const actPolRem = (c) => dateWiz('POL αφαίρεσης', 'Ημερομηνία καταχώρησης στο POL:', v => go(c, '', { polRem: v }));
  const actPolRet = (c) => dateWiz('POL απόδοσης', 'Ημερομηνία καταχώρησης στο POL:', v => go(c, '', { polRet: v }));
  const actDeliver = (c) => dateWiz('Απόδοση διπλώματος', 'Ημερομηνία απόδοσης:', v => go(c, '', { returned: v }));
  const createInv = (c, n) => dateWiz(`Δημιουργία ${n}ης πρόσκλησης`, 'Ημερομηνία δημιουργίας:', v => go(c, '', { ['inv' + n + 'Create']: v }));
  const invite = (c, n) => dateWiz(`Αποστολή ${n}ης πρόσκλησης`, 'Ημερομηνία αποστολής:', v => go(c, '', { ['inv' + n + 'Send']: v }));
  const proof = (c, n) => dateWiz(`Αποδεικτικό ${n}ης`, 'Ημερομηνία που αναγράφεται στο αποδεικτικό:', v => go(c, '', { ['inv' + n + 'Proof']: v }));
  const actContact = (c) => dateWiz('Ο πολίτης επικοινώνησε', 'Ημερομηνία ραντεβού:', v => go(c, '', { appt: v }));
  const actReceived = (c) => dateWiz('Παραλαβή εγγράφου', 'Ημερομηνία παραλαβής (χωρίς αφαίρεση):', v => go(c, '', { docRecv: v }));
  const actTransmit = (c) => dateWiz('Διαβιβαστικό', 'Ημερομηνία αποστολής στην Υπηρεσία:', v => go(c, '', { closed: v, closedKind: 'transmittal' }));
  const actComplaint = (c) => dateWiz('Μήνυση', 'Ημερομηνία υποβολής μήνυσης:', v => go(c, '', { closed: v, closedKind: 'complaint' }));
  const actOOS = (c) => wiz('Εκτός αρμοδιότητας', 'Διαβίβαση του εγγράφου σε άλλη Υπηρεσία:',
    `<input type="date" id="wV" value="${T()}"><input type="text" id="wD" placeholder="Υπηρεσία προορισμού"><input type="text" id="wR" placeholder="Αιτιολογία">`,
    [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value && $('#wD').value.trim(), f: () => go(c, '', { oos: $('#wV').value, oosDest: $('#wD').value.trim().toUpperCase(), oosReason: $('#wR').value.trim().toUpperCase() }) }]);

  const ACT = {
    search: ['Αναζήτηση τηλεφώνου', actSearch], to_call: ['Καταχώρηση κλήσης', actCall], informed: ['Κλείσιμο ραντεβού', actAppt],
    appointment: ['Πραγματοποιήθηκε αφαίρεση', actRemoval],
    pol_rem: ['Επιβεβαίωση καταχώρησης POL (αφαίρεση)', actPolRem], pol_ret: ['Επιβεβαίωση καταχώρησης POL (απόδοση)', actPolRet],
    to_return: ['Απόδοση διπλώματος', actDeliver],
    inv1_create: ['Δημιουργία 1ης πρόσκλησης', c => createInv(c, 1)], inv1_next: ['Αποστολή 1ης πρόσκλησης', c => invite(c, 1)], inv1_sent: ['Παραλαβή 1ου αποδεικτικού', c => proof(c, 1)],
    inv2_create: ['Δημιουργία 2ης πρόσκλησης', c => createInv(c, 2)], inv2_next: ['Αποστολή 2ης πρόσκλησης', c => invite(c, 2)], inv2_sent: ['Παραλαβή 2ου αποδεικτικού', c => proof(c, 2)],
    inv3_create: ['Δημιουργία 3ης πρόσκλησης', c => createInv(c, 3)], inv3_next: ['Αποστολή 3ης πρόσκλησης', c => invite(c, 3)], inv3_sent: ['Παραλαβή 3ου αποδεικτικού', c => proof(c, 3)],
    transmittal: ['Δημιουργήθηκε και στάλθηκε το διαβιβαστικό', actTransmit], complaint: ['Υποβλήθηκε η μήνυση', actComplaint]
  };
  const ACT2 = { appointment: [['Παρέλαβε έγγραφο (χωρίς αφαίρεση)', actReceived, c => !(c.removalDays > 0)]] };
  ['inv1_create','inv1_next','inv1_sent','inv1_wait','inv2_create','inv2_next','inv2_sent','inv2_wait','inv3_create','inv3_next','inv3_sent','inv3_wait']
    .forEach(k => { ACT2[k] = [['Ο πολίτης επικοινώνησε', actContact]]; });
  ACT2.closed = [['Άνοιγμα υπόθεσης', c => { if (confirm('Να ανοίξει ξανά η υπόθεση;')) go(c, '', { closed: '', closedKind: '' }); }]];
  const FLAG = {};

  // ---------- Render ----------
  let pc = {};
  const isSoon = (c) => c.state === 'suspended' && !!c.dates.return && plus(todayStr(), 3) >= c.dates.return;
  const urgent = (c) => URG.includes(c.state) || isSoon(c) || (c.flags || []).length > 0;
  const timeline = (c) => {
    const D = c.dates, rows = [], add = (d, k, t, res, note) => { if (d) rows.push({ d, k, t, res, note }); };
    add(c.receivedDate, 0, 'Παραλαβή εγγράφου');
    add(D.searchNone, 4, 'Αναζήτηση τηλεφώνου', 'δεν βρέθηκε');
    const CR = { noanswer: 'δεν απάντησε', informed: 'ενημερώθηκε, θα καλέσει ο ίδιος', booked: D.appt ? 'ραντεβού στις ' + sd(D.appt) : 'ραντεβού', refused: 'αρνήθηκε ή αναβάλλει' };
    if (D.callRes) add(D.phone, 5, 'Κλήση', CR[D.callRes]);
    if (D.appt && D.callRes !== 'booked') add(D.appt, 6, 'Ραντεβού');
    if (D.appt && todayStr() > D.appt && !D.susp && !D.docRecv) add(D.appt, 7, 'Δεν προσήλθε στο ραντεβού (πληροφορία)');
    [1, 2, 3].forEach(n => {
      add(D['inv' + n + 'Create'], 10, `Δημιουργία ${n}ης πρόσκλησης`);
      add(D['inv' + n + 'Send'], 11, `Αποστολή ${n}ης πρόσκλησης`);
      add(D['inv' + n + 'Proof'], 12, `Αποδεικτικό ${n}ης πρόσκλησης`);
    });
    add(D.docRecv, 15, 'Παραλαβή εγγράφου από τον πολίτη (χωρίς αφαίρεση)');
    add(D.susp, 20, 'Αφαίρεση διπλώματος', '', c.removalDays ? c.removalDays + ' ημέρες, απόδοση ' + sd(D.return) : '');
    add(D.polRem, 21, 'Καταχώρηση POL (αφαίρεση)');
    add(D.returned, 22, 'Απόδοση διπλώματος');
    add(D.polRet, 23, 'Καταχώρηση POL (απόδοση)');
    add(D.oos, 14, 'Εκτός αρμοδιότητας', '', [D.oosDest, D.oosReason].filter(Boolean).join(' · '));
    add(D.closed, 30, D.closedKind === 'complaint' ? 'Μήνυση' : 'Διαβιβαστικό προς την Υπηρεσία');
    return rows.sort((a, b) => a.d.localeCompare(b.d) || a.k - b.k);
  };
  const evText = (r) => `${r.t} στις ${sd(r.d)}` + (r.res ? ` (Αποτέλεσμα: ${r.res})` : '') + (r.note ? ` (${r.note})` : '');
  const isTodo = (c) => urgent(c) || !!c.moveTo || c.state === 'search' || c.state === 'to_call';
  const prio = (c) => {
    const s = c.state;
    if (s === 'pol_rem' || s === 'pol_ret') return 0;
    if (s === 'to_return') return 1;
    if (isSoon(c) || s === 'complaint') return 2;
    if (s === 'transmittal') return 3;
    if (/^inv\d_(create|next)$/.test(s)) return 4;
    if ((c.flags || []).length) return 5;
    if (c.moveTo) return 6;
    if (s === 'to_call') return 7;
    return 8;
  };
  const SUGGEST = (c) => {
    const s = c.state;
    if (s === 'closed') return '';
    if (s === 'pol_rem' || s === 'pol_ret') return 'Εκκρεμότητες - Καταχώρηση POL';
    if (s === 'search') return 'Εκκρεμότητες - Αναζήτηση τηλεφώνου';
    if (['to_call', 'informed'].includes(s)) return 'Τηλέφωνα - Χωρίς ραντεβού';
    if (s === 'appointment') return 'Τηλέφωνα - Με ραντεβού';
    if (s === 'no_show' || /^inv\d_(create|next)$/.test(s)) return 'Εκκρεμότητες - Αποστολή πρόσκλησης';
    if (/^inv\d_sent$/.test(s)) return 'Αναμονή αποδεικτικού';
    const m = /^inv(\d)_wait$/.exec(s); if (m) return 'Προσκλήσεις - ' + m[1] + 'η πρόσκληση';
    if (s === 'transmittal') return 'Εκκρεμότητες - Διαβίβαση σε Υπηρεσία';
    return '';
  };
  const setMove = (c) => { const sf = SUGGEST(c); c.moveTo = (sf && sf !== c.folder) ? sf : ''; };
  const invDone = (c) => {
    const m = /^inv(\d)_(create|next|sent|wait)$/.exec(c.state);
    const fromState = m ? (m[2] === 'sent' || m[2] === 'wait' ? Number(m[1]) : Number(m[1]) - 1) : 0;
    const fromDates = [1, 2, 3].filter(n => c.dates['inv' + n + 'Send']).length;
    return Math.min(3, Math.max(fromState, fromDates));
  };
  const invHTML = (c) => {
    const D = c.dates, done = invDone(c);
    const rows = [1, 2, 3].map(n => {
      const t = D['inv' + n + 'Proof'] ? 'αποδεικτικό ' + fmt(D['inv' + n + 'Proof']) : D['inv' + n + 'Send'] ? 'στάλθηκε ' + fmt(D['inv' + n + 'Send']) : D['inv' + n + 'Create'] ? 'δημιουργήθηκε ' + fmt(D['inv' + n + 'Create']) : '';
      return t ? `<span><b>${n}η:</b> ${t}</span>` : '';
    }).filter(Boolean);
    if (!done && !rows.length && !/^inv\d_/.test(c.state) && c.state !== 'no_show') return '';
    return `<div class="invs"><b>Προσκλήσεις: ${done} από 3 έχουν σταλεί</b>${rows.join('')}</div>`;
  };
  const calLink = (c) => {
    if (!c.dates.appt) return '#';
    const d = c.dates.appt.replace(/-/g, '');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(`Ραντεβού: ${c.name} (${c.plate})`) +
      `&dates=${d}T090000/${d}T093000&ctz=Europe/Athens&details=` + encodeURIComponent(`Τηλ: ${c.phone || '—'} | Φάκελος: ${c.folder || '—'}`);
  };
  
  const chip = (k, v, l, n, on) => `<button class="chip${on ? ' on' : ''}" data-${k}="${esc(v)}">${esc(l)}${n != null ? ' <b>' + n + '</b>' : ''}</button>`;

  const infoLine = (c) => {
    const D = c.dates;
    switch (c.state) {
      case 'informed': return 'Αναμονή 5 ημερών έως ' + fmt(addDays(D.phone, 5));
      case 'appointment': return `Ραντεβού ${fmt(D.appt)} · έλεγχος ${fmt(addDays(D.appt, 5))}`;
      case 'suspended': {
        const n = D.return ? Math.round((new Date(D.return + 'T12:00:00') - new Date(todayStr() + 'T12:00:00')) / 86400000) : null;
        return `Σε αφαίρεση (${c.removalDays} ημ.) · απόδοση ${fmt(D.return)}` + (isSoon(c) && n != null ? ` · σε ${n} ημ.` : '');
      }
      case 'inv1_wait': case 'inv2_wait': case 'inv3_wait': {
        const n = c.state[3]; return `Αναμονή 10 ημερών από το αποδεικτικό, έως ${fmt(addDays(D['inv' + n + 'Proof'], 10))}`;
      }
      default: return (ST[c.state] || {}).a || '';
    }
  };

  const dayDiff = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 86400000);
  const dueOf = (c) => {
    const D = c.dates, s = c.state, m = /^inv(\d)_/.exec(s), n = m ? Number(m[1]) : 0;
    if (s === 'informed') return addDays(D.phone, 5);
    if (s === 'appointment') return D.appt;
    if (s === 'pol_rem') return D.susp;
    if (s === 'pol_ret') return D.returned;
    if (s === 'suspended' || s === 'to_return') return D.return;
    if (/_wait$/.test(s)) return addDays(D['inv' + n + 'Proof'], 10);
    if (/_create$/.test(s)) return n > 1 ? addDays(D['inv' + (n - 1) + 'Proof'], 10) : (D.callRes === 'informed' ? addDays(D.phone, 5) : (D.phone || D.searchNone || ''));
    if (/_next$/.test(s)) return D['inv' + n + 'Create'];
    if (/_sent$/.test(s)) return D['inv' + n + 'Send'];
    if (s === 'transmittal') return D.oos || D.returned || D.docRecv || addDays(D.inv3Proof, 10);
    if (s === 'complaint') return addDays(D.inv3Proof, 10);
    return '';
  };
  const whenText = (c) => {
    const d = dueOf(c); if (!d) return '';
    const k = dayDiff(todayStr(), d), s = c.state;
    if (/_sent$/.test(s)) return 'στάλθηκε ' + sd(d) + (k > 0 ? ' · πριν ' + k + ' ημ.' : '');
    if (/_next$/.test(s)) return 'δημιουργήθηκε ' + sd(d);
    if (s === 'appointment') return 'ραντεβού ' + sd(d) + (k > 0 ? ' · πριν ' + k + ' ημ.' : k === 0 ? ' · σήμερα' : ' · σε ' + (-k) + ' ημ.');
    if (s === 'suspended') return 'απόδοση ' + sd(d) + ' · σε ' + (-k) + ' ημ.';
    if (URG.includes(s)) return (k > 0 ? 'εκκρεμεί από ' + sd(d) + ' · ' + k + ' ημ.' : 'από σήμερα');
    return (k === 0 ? 'σήμερα' : 'έως ' + sd(d) + (k < 0 ? ' · σε ' + (-k) + ' ημ.' : ''));
  };
  const nextLabel = (c) => {
    if ((c.flags || []).includes('pol_rem')) return 'Καταχώρηση POL (αφαίρεση)';
    if ((c.flags || []).includes('pol_ret')) return 'Καταχώρηση POL (απόδοση)';
    if (ACT[c.state]) return ACT[c.state][0];
    if (c.state === 'suspended') return 'Αναμονή λήξης αφαίρεσης';
    if (/_wait$/.test(c.state)) return 'Αναμονή 10 ημερών για την επόμενη πρόσκληση';
    return c.state === 'closed' ? 'Καμία' : '';
  };
  const stepInfo = (c) => {
    const rem = c.removalDays > 0 || !!c.dates.susp;
    const S = rem ? ['Επικοινωνία', 'Πρόσκληση', 'Ραντεβού', 'Αφαίρεση', 'Απόδοση', 'Διαβίβαση'] : ['Επικοινωνία', 'Πρόσκληση', 'Ραντεβού', 'Διαβίβαση'];
    const M = { search: 0, to_call: 0, informed: 0, pol_rem: 3, pol_ret: 4, appointment: 2, suspended: 3, to_return: 4, transmittal: 5, complaint: 5 };
    let i = /^inv/.test(c.state) ? 1 : (M[c.state] === undefined ? 0 : M[c.state]);
    if (!rem && i > 3) i = 3;
    if (c.state === 'closed') i = S.length;
    return { S, i };
  };
  const stepper = (c) => {
    const { S, i } = stepInfo(c);
    const bar = S.map((l, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join('');
    const cap = c.state === 'closed' ? 'Ολοκληρώθηκε' : 'Βήμα ' + (i + 1) + ' από ' + S.length + ' · ' + S[i] + ' · προσκλήσεις ' + invDone(c) + ' από 3';
    return `<div class="steps"><div class="bar">${bar}</div><span>${esc(cap)}</span></div>`;
  };
  const stepPct = (c) => { const { S, i } = stepInfo(c); return Math.max(6, Math.round(100 * i / S.length)); };

  // ---------- Οθόνες: Σήμερα / Υποθέσεις / Μενού / Υπόθεση ----------
  let view = 'today', prevView = 'today', openId = null, invF = 'all', waitOpen = false, callOpen = false;
  const IC = {
    phone: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
  };
  const hotState = (c) => ['pol_rem', 'pol_ret', 'to_return', 'transmittal', 'complaint'].includes(c.state);
  const rowHTML = (c, badge) => {
    const s = ST[c.state] || { l: 'Άγνωστη κατάσταση', t: 'bad' };
    const pls = c.state === 'closed' ? [] : phoneList(c.phone);
    const cls = hotState(c) ? 'o' : urgent(c) ? 'u' : '', n = invDone(c);
    const txt = badge ? [whenText(c)] : [nextLabel(c), whenText(c)];
    return `<div class="rc ${cls}" data-open="${c.id}">
      <div class="rc-m">
        <div class="rc-t"><b>${esc(c.plate)}</b><span>${esc(c.name)}</span>${n ? `<em>${n}/3</em>` : ''}</div>
        <div class="rc-s">${badge ? `<span class="bd t-${s.t}">${esc(s.l)}</span>` : ''}${esc(txt.filter(Boolean).join(' · '))}</div>
        ${c.moveTo ? `<div class="rc-f">Φάκελος → ${esc(c.moveTo)}</div>` : ''}
        <div class="rc-p"><i style="width:${stepPct(c)}%"></i></div>
      </div>
      ${pls.length ? `<a class="rc-call" href="${esc(telHref(pls[0]))}" aria-label="Κλήση ${esc(pls[0])}">${IC.phone}</a>` : ''}
      <span class="rc-chev">${IC.chev}</span></div>`;
  };
  const safeRow = (c, badge) => { try { return rowHTML(c, badge); } catch (err) { console.error(err); return `<div class="rc o" data-open="${c.id}"><div class="rc-m"><div class="rc-t"><b>${esc(c.plate)}</b><span>${esc(c.name)}</span></div><div class="rc-s">Σφάλμα εμφάνισης</div></div></div>`; } };

  const groupOf = (c) => {
    const s = c.state;
    if (s === 'closed') return null;
    if (s === 'pol_rem' || s === 'pol_ret') return 'pol';
    if (['to_return', 'transmittal', 'complaint'].includes(s) || /_(create|next)$/.test(s)) return 'late';
    if (s === 'search' || s === 'to_call') return 'call';
    const d = dueOf(c), k = d ? dayDiff(d, todayStr()) : 99;
    if (k >= 0 && k <= 3) return 'soon';
    return c.moveTo ? 'folder' : 'wait';
  };
  const GRP = [['pol', 'POL · κρίσιμο', 'bad'], ['late', 'Να γίνουν', 'warn'], ['soon', 'Σύντομα · έως 3 ημέρες', ''], ['call', 'Για κλήση ή αναζήτηση', ''], ['folder', 'Μετακίνηση φακέλου', ''], ['wait', 'Σε αναμονή', 'mut']];
  const sortKey = (c) => prio(c) * 1e0;
  const renderToday = () => {
    const g = {}; cases.forEach(c => { const k = groupOf(c); if (k) (g[k] = g[k] || []).push(c); });
    Object.values(g).forEach(a => a.sort((x, y) => prio(x) - prio(y) || (dueOf(x) || '9999').localeCompare(dueOf(y) || '9999')));
    let h = '';
    GRP.forEach(([k, label, tone]) => {
      const a = g[k]; if (!a || !a.length) return;
      if (k === 'wait') {
        h += `<button class="gh ${tone}" data-grp="wait"><span>${label}</span><b>${a.length}</b><span class="gc">${waitOpen ? 'Απόκρυψη' : 'Εμφάνιση'}</span></button>`;
        if (waitOpen) h += a.map(c => safeRow(c)).join('');
        return;
      }
      const cut = k === 'call' && !callOpen && a.length > 5;
      h += `<div class="gh ${tone}"><span>${label}</span><b>${a.length}</b></div>` + (cut ? a.slice(0, 5) : a).map(c => safeRow(c)).join('');
      if (k === 'call' && a.length > 5) h += `<button class="linkbtn more-btn" data-grp="call">${callOpen ? 'Λιγότερες' : 'Εμφάνιση όλων (' + a.length + ')'}</button>`;
    });
    $('#todayList').innerHTML = h || '<div class="empty">Δεν υπάρχουν εκκρεμότητες.</div>';
  };

  const renderCases = () => {
    const sc = {}, fm = {}, ic = { 0: 0, 1: 0, 2: 0, 3: 0 };
    cases.forEach(c => { sc[c.state] = (sc[c.state] || 0) + 1; const f = c.folder || '(χωρίς φάκελο)'; fm[f] = (fm[f] || 0) + 1; if (c.state !== 'closed') ic[invDone(c)]++; });
    $('#fsState').textContent = stateF === 'all' ? 'Όλες' : (ST[stateF] || {}).l || stateF;
    $('#fsFolder').textContent = folderF === 'all' ? 'Όλοι' : folderF;
    $('#fsInv').textContent = invF === 'all' ? 'Όλες' : invF === '0' ? 'Καμία' : invF;
    $('#btnClearF').hidden = stateF === 'all' && folderF === 'all' && invF === 'all' && !q;
    const ql = fold(q).trim();
    const hay = (c) => fold([c.name, c.plate, c.folder, c.phone, c.service, fmt(c.receivedDate), ...Object.values(c.dates || {}).filter(v => /^\d{4}-\d{2}-\d{2}$/.test(v)).map(fmt)].join(' '));
    const list = cases.filter(c => (stateF === 'all' || c.state === stateF) && (folderF === 'all' || (c.folder || '(χωρίς φάκελο)') === folderF)
      && (invF === 'all' || (c.state !== 'closed' && invDone(c) === Number(invF))) && (!ql || hay(c).includes(ql)))
      .sort((a, b) => (a.state === 'closed') - (b.state === 'closed') || prio(a) - prio(b) || (dueOf(a) || '9999').localeCompare(dueOf(b) || '9999'));
    $('#casesList').innerHTML = list.map(c => safeRow(c, true)).join('') || '<div class="empty">Δεν βρέθηκαν υποθέσεις.</div>';
    renderCases.opts = { sc, fm, ic };
  };

  const renderMenu = () => {
    const last = localStorage.getItem('last_backup');
    $('#lastBackup').textContent = last ? 'Τελευταίο: ' + new Date(Number(last)).toLocaleDateString('el-GR') : 'Δεν έχει γίνει ακόμα';
    const act = cases.filter(c => c.state !== 'closed').length;
    $('#menuSum').textContent = act + ' ενεργές · ' + (cases.length - act) + ' ολοκληρωμένες υποθέσεις';
  };

  const detailHTML = (c) => {
    const s = ST[c.state] || { l: 'Άγνωστη κατάσταση', t: 'bad' }, a = ACT[c.state];
    const cls = hotState(c) ? 'o' : urgent(c) ? 'u' : '';
    const pls = c.state === 'closed' ? [] : phoneList(c.phone);
    const nl = nextLabel(c), wt = whenText(c);
    const tl = timeline(c);
    const nO = (pc[normPlate(c.plate)] || 1) - 1;
    let sec = '';
    if (c.state === 'appointment') sec += `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(calLink(c))}">Προσθήκη στο Google Calendar</a><button class="btn ghost" data-r="${c.id}">Αλλαγή ραντεβού</button>`;
    (ACT2[c.state] || []).filter(x => !x[2] || x[2](c)).forEach((x, i) => { sec += `<button class="btn ghost" data-b="${c.id}|${i}">${x[0]}</button>`; });
    if (c.state !== 'closed' && !c.dates.oos) sec += `<button class="btn ghost" data-oos="${c.id}">Εκτός αρμοδιότητας</button>`;
    const det = [
      c.service && `<span><b>Υπηρεσία:</b> ${esc(c.service)}</span>`,
      c.folder && `<span><b>Φάκελος:</b> ${esc(c.folder)}</span>`,
      c.fine && `<span><b>Πρόστιμο:</b> ${esc(c.fine)} €</span>`,
      c.removalDays > 0 && `<span><b>Αφαίρεση:</b> ${esc(c.removalDays)} ημέρες</span>`,
      c.violationType && `<span><b>Είδος παράβασης:</b> ${esc(c.violationType)}</span>`,
      `<span><b>Παραλαβή εγγράφου:</b> ${esc(fmt(c.receivedDate))}</span>`
    ].filter(Boolean).join('');
    return `<div class="d-hd"><div class="d-pl">${esc(c.plate)}</div><div class="d-nm">${esc(c.name)}</div><div><span class="bd t-${s.t}">${esc(s.l)}</span></div></div>
      ${pls.length ? `<div class="tels">${pls.map(x => `<a class="tel" href="${esc(telHref(x))}">Κλήση ${esc(x)}</a>`).join('')}</div>` : ''}
      <div class="d-next ${cls}"><small>Επόμενη ενέργεια</small>
        ${a ? `<button class="btn pri big" data-a="${c.id}">${esc(a[0])}</button>` : (nl ? `<strong>${esc(nl)}</strong>` : '')}
        ${wt ? `<span>${esc(wt)}</span>` : ''}</div>
      ${c.moveTo ? `<div class="mvbox"><span>Μετακίνηση φακέλου: <b>${esc(c.moveTo)}</b></span><button class="btn ghost" data-mv="${c.id}">Μετακινήθηκε</button></div>` : ''}
      ${stepper(c)}
      ${sec ? `<details class="more"><summary>Άλλες ενέργειες</summary><div class="sec">${sec}</div></details>` : ''}
      <h3 class="d-h">Ιστορικό</h3>
      <ol class="tl">${tl.map((r, i) => `<li><i>${i + 1}</i><span>${esc(evText(r))}</span></li>`).join('')}${nl && c.state !== 'closed' ? `<li class="nx"><i>›</i><span>Επόμενο: ${esc(nl)}${wt ? ' · ' + esc(wt) : ''}</span></li>` : ''}</ol>
      <h3 class="d-h">Στοιχεία</h3>
      <div class="det">${det}</div>${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ''}
      ${nO ? `<button class="linkbtn" data-p="${esc(normPlate(c.plate))}">Άλλες υποθέσεις με την ίδια πινακίδα: ${nO}</button>` : ''}
      <div class="row"><button class="btn" data-e="${c.id}">Επεξεργασία</button></div>`;
  };
  const renderCase = () => { const c = get(openId); $('#caseBody').innerHTML = c ? detailHTML(c) : ''; };

  const setView = (v, id) => {
    if (v === 'case') { if (view !== 'case') prevView = view; openId = id; history.pushState({ v: 'case' }, ''); }
    else openId = null;
    view = v; render(); scrollTo(0, 0);
  };

  const render = () => {
    tick();
    pc = {}; cases.forEach(c => { const k = normPlate(c.plate); pc[k] = (pc[k] || 0) + 1; });
    if (view === 'case' && !get(openId)) { view = prevView; openId = null; }
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== 'view-' + view; });
    const navOn = view === 'case' ? prevView : view;
    document.querySelectorAll('.nav [data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === navOn));
    $('#btnBack').hidden = view !== 'case';
    $('#viewTitle').textContent = { today: 'Σήμερα', cases: 'Υποθέσεις', menu: 'Μενού', case: 'Υπόθεση' }[view];
    $('#viewSub').textContent = view === 'today' ? new Date().toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'numeric' }) : '';
    const urgentN = cases.filter(c => { const g = groupOf(c); return g === 'pol' || g === 'late'; }).length;
    const nb = $('#nbToday'); nb.hidden = !urgentN; nb.textContent = urgentN;
    if (view === 'today') renderToday(); else if (view === 'cases') renderCases(); else if (view === 'menu') renderMenu(); else renderCase();
    checkBackup();
  };

  const openPick = (title, opts, cur, cb) => {
    $('#pickT').textContent = title;
    const box = $('#pickB'); box.innerHTML = '';
    opts.forEach(o => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pickopt' + (o.v === cur ? ' on' : '');
      b.innerHTML = `<span>${esc(o.l)}</span>` + (o.n != null ? `<b>${o.n}</b>` : '');
      b.onclick = () => { $('#dlgPick').close(); cb(o.v); };
      box.appendChild(b);
    });
    $('#dlgPick').showModal();
  };

  const getCaseDueDate = (c) => {
    const D = c.dates, s = c.state;
    if (s === 'informed') return addDays(D.phone, 5);
    if (s === 'appointment') return addDays(D.appt, 5);
    if (s === 'suspended') return D.return;
    if (s === 'inv1_wait') return addDays(D.inv1Proof, 10);
    if (s === 'inv2_wait') return addDays(D.inv2Proof, 10);
    if (s === 'inv3_wait') return addDays(D.inv3Proof, 10);
    return null;
  };

  // ---------- Φόρμα ----------
  const F = $('#caseForm'), dlgF = $('#dlgForm'), E = F.elements;
  
  const folderOpts = (cur) => {
    let h = '<option value="">—</option>';
    const std = [];
    for (const [g, subs] of Object.entries(FOLDERS)) {
      h += `<optgroup label="${esc(g)}">` + subs.map(s => {
        const v = subs.length === 1 ? g : g + ' - ' + s;
        std.push(v);
        return `<option value="${esc(v)}">${esc(s)}</option>`;
      }).join('') + '</optgroup>';
    }
    const extra = [...new Set(cases.map(c => c.folder).filter(f => f && !std.includes(f)))].sort();
    if (extra.length) h += '<optgroup label="Προσαρμοσμένοι">' + extra.map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join('') + '</optgroup>';
    $('#fFolder').innerHTML = h + '<option value="custom">+ Νέος φάκελος...</option>';
    if (!cur) $('#fFolder').value = '';
    else { $('#fFolder').value = cur; if ($('#fFolder').value !== cur) $('#fFolder').value = ''; }
  };

  const toggles = () => {
    $('#fFolderCustomWrap').hidden = $('#fFolder').value !== 'custom';
    $('#fViolCustomWrap').hidden = $('#fViol').value !== 'custom';
  };

  const checkPlate = (val) => {
    const v = normPlate(val), w = $('#plateWarning'), id = String(F.dataset.id || '');
    const others = cases.filter(c => String(c.id) !== id && normPlate(c.plate) === v);
    let msg = '';
    if (v && others.length) {
      const act = others.filter(c => c.state !== 'closed').length;
      msg = (others.length === 1 ? 'Υπάρχει ήδη 1 άλλη υπόθεση' : 'Υπάρχουν ήδη ' + others.length + ' άλλες υποθέσεις') + ' με αυτή την πινακίδα (' + act + ' ενεργές).';
    } else if (v && !/^[ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ]{3}[0-9]{4}$/.test(v)) msg = 'Η πινακίδα δεν έχει τη μορφή ΑΑΑ1234. Έλεγξέ την.';
    w.textContent = msg; w.style.display = msg ? 'block' : 'none';
  };
  E.plate.addEventListener('input', (e) => {
    const el = e.target, p = el.selectionStart, before = el.value.length;
    el.value = normPlate(el.value);
    const np = Math.max(0, p - (before - el.value.length)); el.setSelectionRange(np, np);
    checkPlate(el.value);
  });
  E.phone.addEventListener('input', () => {
    if (!F.dataset.id) {
      const cur = E.manualState.value;
      if (cur === 'search' || cur === 'to_call') {
        E.manualState.value = E.phone.value.trim() ? 'to_call' : 'search';
      }
    }
  });

  const DF = { phone:'d_phone', appt:'d_appt', susp:'d_susp', return:'d_return', inv1Create:'d_inv1Create', inv1Send:'d_inv1Send', inv1Proof:'d_inv1Proof', inv2Create:'d_inv2Create', inv2Send:'d_inv2Send', inv2Proof:'d_inv2Proof', inv3Create:'d_inv3Create', inv3Send:'d_inv3Send', inv3Proof:'d_inv3Proof', searchNone:'d_searchNone', callRes:'d_callRes', docRecv:'d_docRecv', returned:'d_returned', polRem:'d_polRem', polRet:'d_polRet', closed:'d_closed', closedKind:'d_closedKind', oos:'d_oos', oosDest:'d_oosDest', oosReason:'d_oosReason' };
  (() => {
    const adv = E.d_phone.closest('.grid');
    const mk = (name, label, opts) => { if (E[name]) return; const l = document.createElement('label'); l.innerHTML = label + (opts === 'text' ? `<input type="text" name="${name}">` : opts ? `<select name="${name}">${opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>` : `<input type="date" name="${name}">`); adv.appendChild(l); };
    mk('d_callRes', 'Αποτέλεσμα κλήσης', [['', '—'], ['noanswer', 'Δεν απάντησε'], ['informed', 'Ενημερώθηκε (θα καλέσει ο ίδιος)'], ['booked', 'Έκλεισε ραντεβού'], ['refused', 'Αρνήθηκε ή αναβάλλει']]);
    mk('d_searchNone', 'Δεν βρέθηκε τηλέφωνο (ημερομηνία)');
    [1, 2, 3].forEach(n => mk('d_inv' + n + 'Create', n + 'η Δημιουργία πρόσκλησης'));
    mk('d_docRecv', 'Παραλαβή εγγράφου (χωρίς αφαίρεση)'); mk('d_returned', 'Απόδοση διπλώματος');
    mk('d_polRem', 'POL αφαίρεσης'); mk('d_polRet', 'POL απόδοσης'); mk('d_closed', 'Κλείσιμο υπόθεσης');
    mk('d_closedKind', 'Είδος κλεισίματος', [['', '—'], ['transmittal', 'Διαβιβαστικό'], ['complaint', 'Μήνυση']]);
    mk('d_oos', 'Εκτός αρμοδιότητας (ημερομηνία)'); mk('d_oosDest', 'Υπηρεσία προορισμού', 'text'); mk('d_oosReason', 'Αιτιολογία', 'text');
    E.manualState.closest('label').hidden = true;
  })();
  const openForm = (id) => {
    const c = id ? get(id) : null;
    F.reset(); F.dataset.id = id || '';
    $('#formTitle').textContent = c ? 'Επεξεργασία υπόθεσης' : 'Νέα υπόθεση';
    $('#btnFormDelete').hidden = !c;
    
    E.manualState.innerHTML = Object.keys(ST).map(k => `<option value="${k}">${ST[k].l}</option>`).join('');
    folderOpts(c ? c.folder : '');
    
    if (c) {
      E.plate.value = c.plate; E.name.value = c.name; E.service.value = c.service || ''; E.phone.value = c.phone || '';
      E.receivedDate.value = c.receivedDate;
      if (VIOL.includes(c.violationType)) E.violationType.value = c.violationType;
      else if (c.violationType) { E.violationType.value = 'custom'; E.violationOther.value = c.violationType; }
      E.fine.value = c.fine || '';
      E.removalDays.value = c.removalDays || ''; E.notes.value = c.notes || '';
      E.manualState.value = c.state;
      
      Object.entries(DF).forEach(([k, n]) => { E[n].value = c.dates[k] || ''; });
      
      if (c.folder && $('#fFolder').value === '') { $('#fFolder').value = 'custom'; E.folderCustom.value = c.folder; }
      checkPlate(c.plate);
    } else {
      E.receivedDate.value = todayStr();
      $('#plateWarning').style.display = 'none';
      E.manualState.value = 'search';
    }
    toggles();
    F.dataset.id = id || '';
    dlgF.showModal();
  };

  F.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = F.dataset.id || uid(), old = get(id);
    
    const folder = E.folderSelect.value === 'custom' ? E.folderCustom.value.trim().toUpperCase() : E.folderSelect.value;
    const days = Number(E.removalDays.value) || 0, req = days > 0;
    const D = { ...(old ? old.dates : BLANK_DATES) };
    if (old) Object.entries(DF).forEach(([k, n]) => { D[k] = E[n].value; });
    if (D.susp && !days) { alert('Για ημερομηνία αφαίρεσης συμπλήρωσε τις ημέρες αφαίρεσης.'); return; }
    if (D.returned && !D.susp) { alert('Η απόδοση διπλώματος προϋποθέτει ημερομηνία αφαίρεσης.'); return; }
    if (D.polRem && !D.susp) { alert('Το POL αφαίρεσης προϋποθέτει ημερομηνία αφαίρεσης.'); return; }
    if (D.polRet && !D.returned) { alert('Το POL απόδοσης προϋποθέτει ημερομηνία απόδοσης.'); return; }
    if (D.oos && !String(D.oosDest || '').trim()) { alert('Συμπλήρωσε την υπηρεσία προορισμού για το «Εκτός αρμοδιότητας».'); return; }
    D.closedKind = D.closed ? (D.closedKind || 'transmittal') : '';
    if (D.susp && days) D.return = addDays(D.susp, days);
    
    const rec = {
      id, 
      plate: normPlate(E.plate.value), 
      name: E.name.value.trim().toUpperCase(), 
      service: E.service.value.trim().toUpperCase(),
      phone: E.phone.value.trim(), 
      receivedDate: E.receivedDate.value, 
      folder,
      violationType: E.violationType.value === 'custom' ? E.violationOther.value.trim().toUpperCase() : E.violationType.value,
      fine: E.fine.value.trim(), 
      requiresLicense: req, 
      removalDays: days, 
      notes: E.notes.value.trim().toUpperCase(),
      state: old ? old.state : 'search',
      history: old ? (old.history || []) : [], ev: old ? (old.ev || []) : [], 
      dates: D, flags: old ? (old.flags || []) : [], schema: 4
    };
    
    rec.moveTo = old ? (old.moveTo || '') : '';
    reconcile(rec);
    if (rec.moveTo && rec.moveTo === rec.folder) rec.moveTo = '';
    if (old) {
      cases[cases.indexOf(old)] = rec;
    } else {
      cases.unshift(rec);
    }
    save(); render(); dlgF.close();
  });

  // ---------- Events ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-nav],[data-open],[data-a],[data-b],[data-oos],[data-mv],[data-r],[data-e],[data-p],[data-back],[data-grp],[data-filter],[data-clearf]');
    if (!t || e.target.closest('.rc-call') || e.target.closest('dialog')) return;
    const d = t.dataset;
    if (d.nav) { openId = null; view = d.nav; render(); scrollTo(0, 0); return; }
    if ('back' in d) { history.back(); return; }
    if (d.grp) { if (d.grp === 'wait') waitOpen = !waitOpen; else callOpen = !callOpen; render(); return; }
    if ('clearf' in d) { stateF = 'all'; folderF = 'all'; invF = 'all'; q = ''; $('#searchInput').value = ''; render(); return; }
    if (d.filter) {
      renderCases();
      const { sc, fm, ic } = renderCases.opts;
      if (d.filter === 'state') openPick('Φάση', [{ v: 'all', l: 'Όλες', n: cases.length }].concat(Object.keys(ST).filter(k => sc[k]).map(k => ({ v: k, l: ST[k].l, n: sc[k] }))), stateF, v => { stateF = v; render(); });
      else if (d.filter === 'folder') openPick('Φάκελος', [{ v: 'all', l: 'Όλοι', n: cases.length }].concat(Object.keys(fm).sort().map(f => ({ v: f, l: f, n: fm[f] }))), folderF, v => { folderF = v; render(); });
      else openPick('Αριθμός προσκλήσεων', [{ v: 'all', l: 'Όλες' }, { v: '0', l: 'Καμία πρόσκληση', n: ic[0] }, { v: '1', l: '1 πρόσκληση', n: ic[1] }, { v: '2', l: '2 προσκλήσεις', n: ic[2] }, { v: '3', l: '3 προσκλήσεις', n: ic[3] }], invF, v => { invF = v; render(); });
      return;
    }
    if (d.open) { setView('case', d.open); return; }
    if (d.p) { q = d.p; $('#searchInput').value = q; stateF = 'all'; folderF = 'all'; invF = 'all'; view = 'cases'; render(); scrollTo(0, 0); return; }
    const id = d.a || d.r || d.e || d.oos || d.mv || (d.b || '').split('|')[0];
    const c = get(id); if (!c) return;
    if (d.a) { const a = ACT[c.state]; if (a) a[1](c); }
    else if (d.b) { const x = (ACT2[c.state] || []).filter(x => !x[2] || x[2](c))[Number(d.b.split('|')[1])]; if (x) x[1](c); }
    else if (d.r) actAppt(c);
    else if (d.e) openForm(c.id);
    else if (d.oos) actOOS(c);
    else if (d.mv && c.moveTo) { c.folder = c.moveTo; c.moveTo = ''; save(); render(); }
  });
  window.addEventListener('popstate', () => { if (view === 'case') { view = prevView; openId = null; render(); } });
  $('#searchInput').oninput = (e) => { q = e.target.value; render(); };
  
  $('#fFolder').onchange = toggles; $('#fViol').onchange = toggles;
  $('#btnNew').onclick = () => openForm(null);
  $('#btnFormCancel').onclick = () => dlgF.close();
  $('#btnHistoryClose').onclick = () => $('#dlgHistory').close();
  $('#btnFormDelete').onclick = () => {
    if (confirm('Οριστική διαγραφή υπόθεσης;')) {
      cases = cases.filter(x => x.id !== F.dataset.id); save(); render(); dlgF.close();
    }
  };

  $('#btnExport').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cases, null, 2)], { type: 'application/json' }));
    a.download = 'ypotheseis_' + todayStr() + '.json'; 
    a.click();
    localStorage.setItem('last_backup', Date.now());
    checkBackup();
  };

  // ---------- ΔΙΟΡΘΩΜΕΝΗ ΕΙΣΑΓΩΓΗ (IMPORT) ----------
  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = (e) => {
    const input = e.target, file = input.files[0]; if (!file) return;
    const r = new FileReader();
    r.onerror = () => { alert('Δεν μπόρεσα να διαβάσω το αρχείο.'); input.value = ''; };
    r.onload = (ev) => {
      const prev = localStorage.getItem(KEY);
      try {
        const text = String(ev.target.result || '').replace(/^\uFEFF/, '');
        if (text.includes('"manifest_version"') || text.includes('"start_url"')) {
          throw new Error('Επιλέξατε το manifest.json της εφαρμογής. Επιλέξτε το αρχείο Backup (π.χ. ypotheseis_2026-XX-XX.json).');
        }
        const parsed = JSON.parse(text);
        let arr = Array.isArray(parsed) ? parsed : null;
        if (!arr && parsed && typeof parsed === 'object') arr = Object.values(parsed).find(Array.isArray) || null;
        if (!arr) throw new Error('Το αρχείο δεν περιέχει λίστα υποθέσεων.');
        arr = arr.filter(x => x && typeof x === 'object');
        if (!arr.length) throw new Error('Το αρχείο δεν περιέχει υποθέσεις. Δεν έγινε επαναφορά.');
        if (!confirm(`Βρέθηκαν ${arr.length} υποθέσεις στο αρχείο. Η επαναφορά θα αντικαταστήσει τις τρέχουσες. Συνέχεια;`)) { input.value = ''; return; }
        if (prev) localStorage.setItem('troxonomika_before_restore', prev);
        const orig = arr.map(x => x.state);
        cases = arr.map(migrate);
        tick(); reportMig(); save(); render();
        const fixed = cases.filter((c, i) => c.state !== orig[i]).length;
        alert('Επιτυχής επαναφορά: ' + cases.length + ' υποθέσεις.' + (fixed ? '\n' + fixed + ' ενημερώθηκαν αυτόματα με βάση τις ημερομηνίες.' : ''));
      } catch (err) {
        console.error(err);
        if (prev) localStorage.setItem(KEY, prev); else localStorage.removeItem(KEY);
        try { cases = prev ? JSON.parse(prev).map(migrate) : []; render(); } catch (e2) { console.error(e2); }
        alert('Σφάλμα: ' + err.message + (prev ? '\nΤα προηγούμενα δεδομένα διατηρήθηκαν.' : ''));
      }
      input.value = '';
    };
    r.readAsText(file);
  };

  $('#btnPrint').onclick = () => {
    let h = `<h1>ΚΑΤΑΣΤΑΣΗ ΥΠΟΘΕΣΕΩΝ</h1><div style="font-size:10px; margin-bottom:8px">Ημερομηνία: ${fmt(todayStr())} | Σύνολο: ${cases.length}</div>` +
      '<table><thead><tr><th>Α/Α</th><th>Πινακίδα</th><th>Ονοματεπώνυμο</th><th>Τηλέφωνο</th><th>Κατάσταση</th><th>Ραντεβού</th><th>Απόδοση</th><th>Προσκλ.</th><th>Φάκελος</th></tr></thead><tbody>';
    cases.forEach((c, i) => { 
      h += `<tr><td>${i + 1}</td><td><b>${esc(c.plate)}</b></td><td>${esc(c.name)}</td><td>${esc(c.phone || '—')}</td><td>${(ST[c.state] || {}).l || '—'}</td><td>${fmt(c.dates.appt)}</td><td>${fmt(c.dates.return)}</td><td>${invDone(c)}/3</td><td>${esc(c.folder || '—')}</td></tr>`; 
    });
    $('#printArea').innerHTML = h + '</tbody></table>';
    print();
  };

  // ---------- Init ----------
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => { if (granted) console.log("Storage persisted"); });
  }

  load(); render();
  let lastDay = todayStr();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastDay = todayStr(); tick(); render(); } });
  setInterval(() => { if (todayStr() !== lastDay) { lastDay = todayStr(); tick(); render(); } }, 60000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();