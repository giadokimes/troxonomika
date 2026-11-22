(() => {
  const KEY = 'troxonomika_final_v29';
  const OLD = [...Array(22)].map((_, i) => 'troxonomika_final_v' + (22 - i))
    .concat(['ypotheseis_pwa_v1','ypotheseis.v1','troxonomika.cases.v1','ypotheseis.v2','ypotheseis_gemini_v1']);
  ['v23', 'v24', 'v25', 'v26', 'v27', 'v28'].forEach(v => OLD.unshift('troxonomika_final_' + v));

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
    to_return: 'Προς απόδοση',
    transmittal: 'Δημιουργία διαβιβαστικού',
    complaint: 'Υποβολή μήνυσης',
    inv1_create: 'Δημιουργία 1ης πρόσκλησης', inv2_create: 'Δημιουργία 2ης πρόσκλησης', inv3_create: 'Δημιουργία 3ης πρόσκλησης',
    inv1_next: 'Αποστολή 1ης πρόσκλησης', inv2_next: 'Αποστολή 2ης πρόσκλησης', inv3_next: 'Αποστολή 3ης πρόσκλησης',
    move: 'Μετακίνηση φακέλου',
    soon: 'Επικείμενη απόδοση (έως 3 ημ.)',
    'flag:pol_rem': 'Καταχώρηση POL (αφαίρεση)', 'flag:pol_ret': 'Καταχώρηση POL (απόδοση)'
  };
  const FOLDERS = {
    'Τηλέφωνα': ['Με ραντεβού', 'Χωρίς ραντεβού'],
    'Προσκλήσεις': ['1η πρόσκληση', '2η πρόσκληση', '3η πρόσκληση'],
    'Αναμονή αποδεικτικού': ['Αναμονή αποδεικτικού'],
    'Εκκρεμότητες': ['Αναζήτηση τηλεφώνου', 'Αποστολή πρόσκλησης', 'Διαβίβαση σε Υπηρεσία', 'Καταχώρηση POL']
  };
  const VIOL = ['Υπερβολική ταχύτητα','ΚΤΕΟ','Διόδια','Στάθμευση','Απόφαση','Παραλαβή εγγράφου'];
  const REMS = { license: 'δίπλωμα', plates: 'άδεια κυκλοφορίας και πινακίδες', both: 'δίπλωμα, άδεια κυκλοφορίας και πινακίδες', foreign: 'δίπλωμα εξωτερικού (χωρίς POL)' };
  const BLANK_DATES = { phone:'', appt:'', susp:'', return:'', inv1Send:'', inv1Proof:'', inv2Send:'', inv2Proof:'', inv3Send:'', inv3Proof:'', inv1Create:'', inv2Create:'', inv3Create:'', inv1Res:'', inv2Res:'', inv3Res:'', returned:'', closed:'', closedKind:'', callRes:'', searchNone:'', searchFound:'', docRecv:'', complaint:'', polRem:'', polRet:'', oos:'', oosDest:'', oosReason:'' };

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
  const normText = s => fold(s).replace(/\s+/g, ' ').trim();
  const yy2 = (d) => String(d || todayStr()).slice(2, 4);
  const PROTO_PREFIXES = (yr) => ['2515/11-' + yr + '/', '2517/4-' + yr + '/'];
  const splitProtocol = (p) => {
    p = String(p || '').trim().toUpperCase();
    const m = /^(2515\/11-\d{2}\/|2517\/4-\d{2}\/)(.*)$/.exec(p);
    return m ? { prefix: m[1], num: m[2] } : { prefix: '', num: p };
  };
  const autoPrefix = (num, yr) => { const s = String(num || '').replace(/\D/g, ''); return s.length === 3 ? '2515/11-' + yr + '/' : s.length === 2 ? '2517/4-' + yr + '/' : ''; };
  const lastBy = (a) => (a || []).slice().sort((x, y) => (x.d || '').localeCompare(y.d || '')).pop();

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
  const endState = (c) => c.endRoute === 'complaint' ? 'complaint' : c.endRoute === 'transmittal' ? 'transmittal' : (c.violationType === 'Απόφαση' ? 'complaint' : 'transmittal');
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
  
  const step5 = (c) => {
    const D = c.dates;
    if (c._old === undefined) c._old = c.state;
    let noshow = false;
    if (D.callRes === 'noshow') { noshow = true; D.callRes = D.appt ? 'booked' : 'noanswer'; }
    if (D.callRes === 'refused') D.callRes = 'noanswer';
    ['searchFound', 'complaint', 'inv1Res', 'inv2Res', 'inv3Res'].forEach(k => { if (D[k] === undefined) D[k] = ''; });
    if (!Array.isArray(c.calls)) c.calls = D.callRes ? [{ d: D.phone || '', r: D.callRes }] : [];
    if (!Array.isArray(c.appts)) c.appts = D.appt ? [{ b: D.callRes === 'booked' ? (D.phone || '') : '', d: D.appt, s: D.callRes === 'booked' ? 'call' : 'citizen', res: noshow ? 'missed' : '' }] : [];
    let p = String(c.plate || '').replace(/\/+$/, '');
    const m = /^(.*?)\/(\d{2,3})$/.exec(p);
    if (m) { p = m[1]; if (!String(c.protocol || '').trim()) c.protocol = autoPrefix(m[2], yy2(c.receivedDate)) + m[2]; }
    c.plate = normPlate(p);
    c.protocol = String(c.protocol || '').trim(); c.address = String(c.address || '').trim();
    c.removalWhat = c.removalWhat || 'license';
    c.service = normText(c.service);
    if (D.oosDest) D.oosDest = normText(D.oosDest);
    c.undo = Array.isArray(c.undo) ? c.undo : [];
    c.schema = 5;
    return c;
  };
  const upgrade = (c) => {
    if (c.schema >= 5) return c;
    if (c.schema === 4) return step5(c);
    if (c.schema === 3) return step5(step4(c));
    if (c.schema === 2) return step5(step3(c));
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
    return step5(step3(c));
  };
  const RETIRED = { recall: 'inv1_create' };
  const fixState = (c) => { if (RETIRED[c.state]) { c.state = RETIRED[c.state]; setMove(c); } return c; };
  const migrate = (o) => fixState(upgrade(migrateBase(o)));

  const load = () => {
    try {
      const cur = localStorage.getItem(KEY);
      if (cur) { 
        const raw = JSON.parse(cur) || [];
        if (raw.some(o => (o.schema || 0) < 5) && !localStorage.getItem('troxonomika_pre5')) localStorage.setItem('troxonomika_pre5', cur);
        cases = raw.map(migrate);
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
  const polNeeded = (c) => c.removalWhat !== 'foreign';
  const badProof = (D) => [1, 2, 3].some(n => D['inv' + n + 'Res'] === 'bad');
  const apptMissed = (c) => (c.appts || []).some(a => a.res === 'missed') || (!!c.dates.appt && todayStr() > c.dates.appt);
  const missedDate = (c) => ((c.appts || []).find(a => a.res === 'missed') || { d: c.dates.appt }).d;
  const derive = (c) => {
    const D = c.dates, pol = polNeeded(c);
    if (D.susp && !D.polRem && pol) return 'pol_rem';
    if (D.returned && !D.polRet && pol) return 'pol_ret';
    if (D.closed) return 'closed';
    if (D.returned || D.docRecv || D.oos || D.complaint || badProof(D)) return 'transmittal';
    if (D.susp) return D.return && isDue(D.return) ? 'to_return' : 'suspended';
    if (D.appt && !invDates(D).length) return apptMissed(c) ? 'inv1_create' : 'appointment';
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

  const TR = {
    expired: { l: 'Έληξε η προθεσμία του 3ου αποδεικτικού', a: 'Άμεση επιστροφή στην υπηρεσία ανάθεσης' },
    badproof: { l: 'Αρνητικό αποδεικτικό (λάθος διεύθυνση ή δεν μένει εκεί)', a: 'Επιστροφή στην υπηρεσία ανάθεσης' },
    oos: { l: 'Εκτός αρμοδιότητας', a: 'Διαβίβαση του εγγράφου στην αρμόδια υπηρεσία' },
    received: { l: 'Παρέλαβε το έγγραφο', a: 'Διαβίβαση στην υπηρεσία ανάθεσης' },
    returned: { l: 'Ολοκληρώθηκε η αφαίρεση και η απόδοση', a: 'Διαβίβαση στην υπηρεσία ανάθεσης' },
    complaint: { l: 'Η μήνυση υποβλήθηκε', a: 'Διαβιβαστικό ενημέρωσης προς την υπηρεσία ανάθεσης' }
  };
  const transReason = (c) => { const D = c.dates; return D.complaint ? 'complaint' : D.oos ? 'oos' : badProof(D) ? 'badproof' : D.returned ? 'returned' : D.docRecv ? 'received' : 'expired'; };
  const stOf = (c) => {
    const b = ST[c.state] || { l: 'Άγνωστη κατάσταση', t: 'bad', a: '' };
    if (c.state === 'transmittal') { const r = TR[transReason(c)]; return { ...b, l: r.l, a: r.a }; }
    if (c.state === 'complaint') return { ...b, l: 'Έληξε η προθεσμία του 3ου αποδεικτικού', a: 'Υποβολή μήνυσης' };
    return b;
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
    if (moved.length) setTimeout(() => alert('Η νέα έκδοση ενημέρωσε τον υπολογισμό της φάσης. ' + moved.length + ' υποθέσεις άλλαξαν φάση:\n' + moved.slice(0, 12).join('\n')), 500);
  };
  const TRACK = { phone: '', removalDays: 0, requiresLicense: false, removalWhat: 'license', calls: [], appts: [] };
  const snap = (c) => {
    const o = {};
    Object.keys(c.dates).forEach(k => { o['dates.' + k] = c.dates[k]; });
    Object.keys(TRACK).forEach(k => { o[k] = JSON.stringify(c[k] === undefined ? TRACK[k] : c[k]); });
    return o;
  };
  const pushUndo = (c, label, before) => {
    const after = snap(c), ch = {};
    Object.keys(after).forEach(k => { if (before[k] !== after[k]) ch[k] = before[k] === undefined ? '' : before[k]; });
    if (!Object.keys(ch).length) return false;
    c.undo = c.undo || []; c.undo.push({ l: label, t: Date.now(), ch });
    if (c.undo.length > 8) c.undo.shift();
    return true;
  };
  const restore = (c, ch) => Object.entries(ch).forEach(([k, v]) => {
    if (k.startsWith('dates.')) c.dates[k.slice(6)] = v; else c[k] = JSON.parse(v);
  });
  let undoTimer = 0;
  const hideToast = () => { const b = $('#undoBar'); if (b) b.hidden = true; clearTimeout(undoTimer); };
  const showToast = (c, label) => {
    const b = $('#undoBar'); if (!b) return;
    b.dataset.id = c.id; b.querySelector('span').textContent = label; b.hidden = false;
    clearTimeout(undoTimer); undoTimer = setTimeout(hideToast, 9000);
  };
  const undoLast = (c) => {
    const u = (c.undo || []).pop(); if (!u) return;
    restore(c, u.ch); reconcile(c); save(); hideToast(); render();
  };
  const act = (c, label, fn) => { const before = snap(c); fn(); reconcile(c); pushUndo(c, label, before); save(); render(); showToast(c, label); };

  // ---------- Wizard ----------
  const dlgW = $('#dlgWizard');
  const wiz = (title, desc, body, btns) => {
    $('#wT').textContent = title; $('#wD').textContent = desc || ''; $('#wB').innerHTML = body || '';
    const a = $('#wA'); a.innerHTML = '';
    btns.concat([{ t: 'Άκυρο', c: 'ghost' }]).forEach(b => {
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'btn ' + (b.c || ''); x.textContent = b.t;
      x.onclick = () => { if (b.v && !b.v()) return; dlgW.close(); if (b.f) b.f(); };
      a.append(x);
    });
    if (!dlgW.open) dlgW.showModal();
  };
  const T = () => todayStr();
  const dv = () => $('#wV').value;
  const dIn = (v) => `<input type="date" id="wV" value="${v || T()}">`;
  const dateWiz = (title, desc, cb) => wiz(title, desc, dIn(), [{ t: 'Αποθήκευση', c: 'pri', v: dv, f: () => cb(dv()) }]);

  // ---------- Ενέργειες: καταγράφουν δεδομένα, η φάση υπολογίζεται αυτόματα ----------
  const syncCall = (c) => { const L = lastBy(c.calls); c.dates.phone = L ? (L.d || '') : ''; c.dates.callRes = L ? L.r : ''; };
  const syncAppt = (c) => { const a = c.appts || [], L = a[a.length - 1]; c.dates.appt = L ? L.d : ''; };
  const addAppt = (c, d, b, s) => {
    c.appts = c.appts || [];
    const prev = c.appts[c.appts.length - 1], D = c.dates;
    if (prev && prev.d && prev.d < b && !D.susp && !D.docRecv) prev.res = 'missed';
    c.appts.push({ b, d, s: s || (prev && prev.res !== 'missed' ? 'change' : 'citizen'), res: '' });
    syncAppt(c);
  };
  const recCall = (c, d, r, appt) => act(c, 'Κλήση', () => {
    c.calls = c.calls || []; c.calls.push({ d, r });
    if (r === 'booked' && appt) addAppt(c, appt, d, 'call');
    syncCall(c);
  });
  const actSearch = (c) => wiz('Αποτέλεσμα αναζήτησης', 'Ημερομηνία αναζήτησης:', dIn(), [
    { t: 'Βρέθηκε τηλέφωνο', c: 'ok', v: dv, f: () => { const d = dv();
      wiz('Τηλέφωνο', 'Πληκτρολογήστε τον αριθμό:', '<input type="tel" id="wP">', [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wP').value.trim(),
        f: () => { const p = $('#wP').value.trim(); act(c, 'Βρέθηκε τηλέφωνο', () => { c.phone = p; c.dates.searchNone = ''; c.dates.searchFound = d; }); } }]); } },
    { t: 'Δεν βρέθηκε', c: 'bad', v: dv, f: () => { const d = dv(); act(c, 'Δεν βρέθηκε τηλέφωνο', () => { c.dates.searchNone = d; c.dates.searchFound = ''; }); } }
  ]);
  const actCall = (c) => wiz('Έγινε κλήση', 'Ημερομηνία κλήσης:', dIn(), [
    { t: 'Δεν απάντησε', c: 'bad', v: dv, f: () => recCall(c, dv(), 'noanswer') },
    { t: 'Έκλεισε ραντεβού', c: 'ok', v: dv, f: () => { const d = dv(); dateWiz('Ημερομηνία ραντεβού', 'Επιλέξτε ημερομηνία:', v => recCall(c, d, 'booked', v)); } },
    { t: 'Δεν έκλεισε ραντεβού', v: dv, f: () => recCall(c, dv(), 'informed') }
  ]);
  const markNoShow = (c) => act(c, 'Δεν προσήλθε', () => {
    c.appts = c.appts || [];
    if (!c.appts.length && c.dates.appt) c.appts.push({ b: '', d: c.dates.appt, s: 'call', res: '' });
    const L = c.appts[c.appts.length - 1]; if (L) L.res = 'missed';
  });
  const actApptOutcome = (c) => wiz('Εξέλιξη ραντεβού', 'Τι έγινε στο ραντεβού;', '', [
    { t: 'Προσήλθε — έγινε αφαίρεση', c: 'ok', f: () => actRemoval(c) },
    { t: 'Προσήλθε — παρέλαβε το έγγραφο', f: () => actReceived(c) },
    { t: 'Δεν προσήλθε', c: 'bad', f: () => markNoShow(c) }
  ]);
  const actAppt = (c) => dateWiz('Ραντεβού', 'Ημερομηνία ραντεβού:', v => act(c, 'Ραντεβού', () => addAppt(c, v, T())));
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const remOpts = (cur) => Object.entries(REMS).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(cap1(v))}</option>`).join('');
  const actRemoval = (c) => wiz('Έγινε αφαίρεση', c.removalDays ? 'Ημερομηνία αφαίρεσης (' + c.removalDays + ' ημέρες):' : 'Ημερομηνία αφαίρεσης και ημέρες:',
    dIn() + (c.removalDays ? '' : '<input type="number" id="wN" min="1" placeholder="Ημέρες αφαίρεσης">') + `<select id="wW">${remOpts(c.removalWhat || 'license')}</select>`,
    [{ t: 'Αποθήκευση', c: 'pri', v: () => dv() && (c.removalDays || Number(($('#wN') || {}).value) > 0), f: () => {
      const d = dv(), n = c.removalDays || Number($('#wN').value), w = $('#wW').value;
      act(c, 'Αφαίρεση', () => { c.removalDays = n; c.requiresLicense = true; c.removalWhat = w; c.dates.susp = d; });
    } }]);
  const actPolRem = (c) => dateWiz('POL αφαίρεσης', 'Ημερομηνία καταχώρησης στο POL:', v => act(c, 'POL αφαίρεσης', () => { c.dates.polRem = v; }));
  const actPolRet = (c) => dateWiz('POL απόδοσης', 'Ημερομηνία καταχώρησης στο POL:', v => act(c, 'POL απόδοσης', () => { c.dates.polRet = v; }));
  const actDeliver = (c) => dateWiz('Έγινε απόδοση', 'Ημερομηνία απόδοσης:', v => act(c, 'Απόδοση', () => { c.dates.returned = v; }));
  const ORDW = ['', '1η', '2η', '3η'];
  const createInv = (c, n) => dateWiz(`Δημιουργία ${n}ης πρόσκλησης`, 'Θα δημιουργηθεί το αρχείο Word και θα ανοίξει η κοινοποίηση (π.χ. email). Ημερομηνία δημιουργίας:', v => {
    act(c, `Δημιουργία ${n}ης πρόσκλησης`, () => { c.dates['inv' + n + 'Create'] = v; });
    sendInvitation(c, n, v);
  });
  const invite = (c, n) => dateWiz(`Στάλθηκε η ${ORDW[n]} πρόσκληση`, 'Ημερομηνία αποστολής:', v => act(c, `Αποστολή ${n}ης πρόσκλησης`, () => { c.dates['inv' + n + 'Send'] = v; }));
  const proof = (c, n) => wiz(`Επέστρεψε το ${n}ο αποδεικτικό`, 'Ημερομηνία που αναγράφεται στο αποδεικτικό:', dIn(), [
    { t: 'Βρέθηκε ή μένει εκεί', c: 'ok', v: dv, f: () => { const d = dv(); act(c, `Αποδεικτικό ${n}ης πρόσκλησης`, () => { c.dates['inv' + n + 'Proof'] = d; c.dates['inv' + n + 'Res'] = 'ok'; }); } },
    { t: 'Λάθος διεύθυνση ή δεν μένει εκεί', c: 'bad', v: dv, f: () => { const d = dv(); act(c, `Αποδεικτικό ${n}ης πρόσκλησης`, () => { c.dates['inv' + n + 'Proof'] = d; c.dates['inv' + n + 'Res'] = 'bad'; }); } }
  ]);
  const actReceived = (c) => dateWiz('Παρέλαβε το έγγραφο', 'Ημερομηνία παραλαβής:', v => act(c, 'Παραλαβή εγγράφου', () => { c.dates.docRecv = v; }));
  const actTransmit = (c) => dateWiz('Δημιουργία διαβιβαστικού', 'Ημερομηνία διαβιβαστικού προς την Υπηρεσία:', v => act(c, 'Διαβιβαστικό', () => { c.dates.closed = v; c.dates.closedKind = c.dates.complaint ? 'complaint' : 'transmittal'; }));
  const actComplaint = (c) => dateWiz('Υποβλήθηκε η μήνυση', 'Ημερομηνία υποβολής μήνυσης:', v => act(c, 'Μήνυση', () => { c.dates.complaint = v; }));
  const actOOS = (c) => { refreshSvc(); wiz('Εκτός αρμοδιότητας', 'Διαβίβαση του εγγράφου σε άλλη Υπηρεσία. Σημειώστε τον λόγο:',
    dIn() + '<input type="text" id="wDest" list="serviceList" placeholder="Υπηρεσία προορισμού" autocomplete="off"><input type="text" id="wRsn" placeholder="Αιτιολογία (ελεύθερο κείμενο)" autocomplete="off">',
    [{ t: 'Αποθήκευση', c: 'pri', v: () => dv() && $('#wDest').value.trim(), f: () => {
      const d = dv(), dest = normText($('#wDest').value), r = $('#wRsn').value.trim().toUpperCase();
      act(c, 'Εκτός αρμοδιότητας', () => { c.dates.oos = d; c.dates.oosDest = dest; c.dates.oosReason = r; });
    } }]); };

  const ACT = {
    search: ['Αποτέλεσμα αναζήτησης', actSearch], to_call: ['Έγινε κλήση', actCall], informed: ['Έκλεισε ραντεβού', actAppt],
    appointment: ['Εξέλιξη ραντεβού', actApptOutcome],
    pol_rem: ['Καταχωρήθηκε στο POL', actPolRem], pol_ret: ['Καταχωρήθηκε στο POL', actPolRet],
    to_return: ['Έγινε απόδοση', actDeliver],
    inv1_create: ['Δημιουργία 1ης πρόσκλησης', c => createInv(c, 1)], inv1_next: ['Στάλθηκε η 1η πρόσκληση', c => invite(c, 1)], inv1_sent: ['Επέστρεψε το 1ο αποδεικτικό', c => proof(c, 1)],
    inv2_create: ['Δημιουργία 2ης πρόσκλησης', c => createInv(c, 2)], inv2_next: ['Στάλθηκε η 2η πρόσκληση', c => invite(c, 2)], inv2_sent: ['Επέστρεψε το 2ο αποδεικτικό', c => proof(c, 2)],
    inv3_create: ['Δημιουργία 3ης πρόσκλησης', c => createInv(c, 3)], inv3_next: ['Στάλθηκε η 3η πρόσκληση', c => invite(c, 3)], inv3_sent: ['Επέστρεψε το 3ο αποδεικτικό', c => proof(c, 3)],
    transmittal: ['Δημιουργία διαβιβαστικού', actTransmit], complaint: ['Υποβλήθηκε η μήνυση', actComplaint]
  };
  const actFor = (c) => {
    if (c.state === 'transmittal' && c.dates.complaint) return ['Δημιουργία διαβιβαστικού ενημέρωσης', actTransmit];
    return ACT[c.state];
  };
  const NOSEC = ['pol_rem', 'pol_ret', 'suspended', 'to_return', 'transmittal'];
  const secondary = (c) => {
    const s = c.state, out = [];
    if (s === 'closed') return [['Άνοιγμα υπόθεσης', c => { if (confirm('Να ανοίξει ξανά η υπόθεση;')) act(c, 'Άνοιγμα υπόθεσης', () => { c.dates.closed = ''; c.dates.closedKind = ''; }); }]];
    if (NOSEC.includes(s)) return out;
    if (s === 'appointment') return out;
    const lastInv = [3, 2, 1].find(k => c.dates['inv' + k + 'Create']);
    if (lastInv) out.push(['Λήψη ' + lastInv + 'ης πρόσκλησης (Word)', c => sendInvitation(c, lastInv, c.dates['inv' + lastInv + 'Create'])]);
    if (s !== 'informed' && s !== 'appointment') out.push(['Κλήθηκε για ραντεβού', actAppt]);
    if (c.removalDays > 0) { if (s !== 'appointment') out.push(['Έγινε αφαίρεση', actRemoval]); }
    else { out.push(['Έγινε αφαίρεση', actRemoval]); if (s !== 'appointment') out.push(['Παρέλαβε το έγγραφο', actReceived]); }
    return out;
  };
  const FLAG = {};
  const LOGO_B64 = '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';

  // ---------- Πρόσκληση σε αρχείο Word (.docx) χωρίς εξωτερικές βιβλιοθήκες ----------
  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const CRC_T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const u8s = (s) => new TextEncoder().encode(s);
  const xe = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const zipStore = (files) => {
    const w16 = (v) => [v & 255, (v >>> 8) & 255], w32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    const parts = [], cd = []; let off = 0;
    files.forEach(([name, data]) => {
      const nm = u8s(name), crc = crc32(data), sz = data.length;
      const lh = Uint8Array.from([0x50, 0x4b, 3, 4, ...w16(20), ...w16(0x0800), ...w16(0), ...w16(0), ...w16(0x5D74), ...w32(crc), ...w32(sz), ...w32(sz), ...w16(nm.length), ...w16(0)]);
      parts.push(lh, nm, data);
      cd.push(Uint8Array.from([0x50, 0x4b, 1, 2, ...w16(20), ...w16(20), ...w16(0x0800), ...w16(0), ...w16(0), ...w16(0x5D74), ...w32(crc), ...w32(sz), ...w32(sz), ...w16(nm.length), ...w16(0), ...w16(0), ...w16(0), ...w16(0), ...w32(0), ...w32(off)]), nm);
      off += lh.length + nm.length + sz;
    });
    const cdLen = cd.reduce((s, a) => s + a.length, 0);
    const end = Uint8Array.from([0x50, 0x4b, 5, 6, ...w16(0), ...w16(0), ...w16(files.length), ...w16(files.length), ...w32(cdLen), ...w32(off), ...w16(0)]);
    const all = [...parts, ...cd, end], out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
    let p = 0; all.forEach(a => { out.set(a, p); p += a.length; });
    return out;
  };

  const FN_M = { ΓΕΩΡΓΙΟΣ: 'Γεώργιο', ΙΩΑΝΝΗΣ: 'Ιωάννη', ΔΗΜΗΤΡΙΟΣ: 'Δημήτριο', ΚΩΝΣΤΑΝΤΙΝΟΣ: 'Κωνσταντίνο', ΝΙΚΟΛΑΟΣ: 'Νικόλαο', ΧΡΗΣΤΟΣ: 'Χρήστο', ΠΑΝΑΓΙΩΤΗΣ: 'Παναγιώτη',
    ΑΝΔΡΕΑΣ: 'Ανδρέα', ΕΥΑΓΓΕΛΟΣ: 'Ευάγγελο', ΣΤΥΛΙΑΝΟΣ: 'Στυλιανό', ΑΘΑΝΑΣΙΟΣ: 'Αθανάσιο', ΣΤΕΡΓΙΟΣ: 'Στέργιο', ΒΛΑΔΙΜΗΡΟΣ: 'Βλαδίμηρο', ΟΔΥΣΣΕΑΣ: 'Οδυσσέα',
    ΚΥΡΙΑΚΟΣ: 'Κυριάκο', ΠΟΛΥΔΩΡΟΣ: 'Πολύδωρο', ΑΛΕΞΑΝΔΡΟΣ: 'Αλέξανδρο', ΘΕΟΔΩΡΟΣ: 'Θεόδωρο', ΒΑΣΙΛΕΙΟΣ: 'Βασίλειο', ΑΝΑΣΤΑΣΙΟΣ: 'Αναστάσιο', ΕΜΜΑΝΟΥΗΛ: 'Εμμανουήλ',
    ΜΙΧΑΗΛ: 'Μιχαήλ', ΠΕΤΡΟΣ: 'Πέτρο', ΠΑΥΛΟΣ: 'Παύλο', ΣΩΤΗΡΗΣ: 'Σωτήρη', ΛΑΜΠΡΟΣ: 'Λάμπρο', ΑΡΙΣΤΕΙΔΗΣ: 'Αριστείδη', ΜΑΡΙΟΣ: 'Μάριο', ΣΠΥΡΙΔΩΝ: 'Σπυρίδωνα',
    ΧΑΡΑΛΑΜΠΟΣ: 'Χαράλαμπο', ΤΡΥΦΩΝ: 'Τρύφωνα', ΑΠΟΣΤΟΛΟΣ: 'Απόστολο', ΣΑΒΒΑΣ: 'Σάββα', ΓΡΗΓΟΡΗΣ: 'Γρηγόρη', ΜΙΛΤΙΑΔΗΣ: 'Μιλτιάδη', ΘΩΜΑΣ: 'Θωμά', ΤΑΞΙΑΡΧΗΣ: 'Ταξιάρχη',
    ΛΕΩΝΙΔΑΣ: 'Λεωνίδα', ΑΙΜΙΛΙΟΣ: 'Αιμίλιο', ΣΤΑΥΡΟΣ: 'Σταύρο', ΑΓΓΕΛΟΣ: 'Άγγελο', ΙΑΣΩΝ: 'Ιάσονα', ΔΑΜΙΑΝΟΣ: 'Δαμιανό', ΜΑΤΘΑΙΟΣ: 'Ματθαίο', ΒΑΡΝΑΒΑΣ: 'Βαρνάβα',
    ΕΛΕΥΘΕΡΙΟΣ: 'Ελευθέριο', ΣΩΚΡΑΤΗΣ: 'Σωκράτη', ΦΙΛΑΡΕΤΟΣ: 'Φιλάρετο', ΚΩΣΤΑΣ: 'Κώστα', ΓΙΑΝΝΗΣ: 'Γιάννη', ΝΙΚΟΣ: 'Νίκο', ΔΗΜΗΤΡΗΣ: 'Δημήτρη', ΜΑΝΩΛΗΣ: 'Μανώλη' };
  const FN_F = { ΜΑΡΙΑ: 'Μαρία', ΕΛΕΝΗ: 'Ελένη', ΑΙΚΑΤΕΡΙΝΗ: 'Αικατερίνη', ΕΥΑΓΓΕΛΙΑ: 'Ευαγγελία', ΔΗΜΗΤΡΑ: 'Δήμητρα', ΑΙΜΙΛΙΑ: 'Αιμιλία', ΑΝΑΣΤΑΣΙΑ: 'Αναστασία', ΓΕΩΡΓΙΑ: 'Γεωργία',
    ΧΡΙΣΤΙΝΑ: 'Χριστίνα', ΣΟΦΙΑ: 'Σοφία', ΠΑΡΑΣΚΕΥΗ: 'Παρασκευή', ΣΩΤΗΡΙΑ: 'Σωτηρία', ΚΩΝΣΤΑΝΤΙΝΑ: 'Κωνσταντίνα', ΒΑΣΙΛΙΚΗ: 'Βασιλική', ΑΘΗΝΑ: 'Αθηνά', ΙΩΑΝΝΑ: 'Ιωάννα',
    ΑΝΝΑ: 'Άννα', ΕΙΡΗΝΗ: 'Ειρήνη', ΦΩΤΕΙΝΗ: 'Φωτεινή', ΘΕΟΔΩΡΑ: 'Θεοδώρα', ΝΙΚΗ: 'Νίκη', ΔΕΣΠΟΙΝΑ: 'Δέσποινα', ΑΡΤΕΜΙΣ: 'Άρτεμις', ΕΥΤΥΧΙΑ: 'Ευτυχία', ΜΑΡΙΝΑ: 'Μαρίνα' };
  const tcase = (w) => { const l = w.toLowerCase(); return l.charAt(0).toUpperCase() + l.slice(1); };
  const accWord = (w) => /ΕΥΣ$/.test(fold(w)) ? w.slice(0, -3) + 'ΕΑ' : /(Ο|Ό|Η|Ή|Α|Ά|Ε|Έ|Υ|Ύ)Σ$/.test(w) ? w.slice(0, -1) : w;
  const docName = (full) => {
    let father = '';
    const fm = /^(.*?)\s+(?:ΤΟΥ|ΤΗΣ|του|της)\s+(.+)$/.exec(String(full || '').trim());
    if (fm) { full = fm[1]; father = titleWords(fm[2]); }
    const t = String(full || '').trim().split(/\s+/).filter(Boolean);
    if (!t.length) return null;
    const first = t.slice(1).join(' '), fk = fold(first);
    const fem = !!FN_F[fk] || (!FN_M[fk] && !!first && !/[ΣΝΛΡ]$/.test(fk));
    const sur = fold(fem ? t[0] : accWord(t[0].toUpperCase()));
    const fn = first ? (FN_F[fk] || FN_M[fk] || first.split(/\s+/).map(x => tcase(fem ? x : accWord(x.toUpperCase()))).join(' ')) : '';
    return { fem, text: sur + (fn ? ' ' + fn : ''), father };
  };
  const PLACE = { ΛΗΤΗΣ: 'Λητής', ΘΕΡΜΗΣ: 'Θέρμης', ΓΡΕΒΕΝΩΝ: 'Γρεβενών', ΒΟΛΟΥ: 'Βόλου', ΧΑΛΚΗΔΟΝΑΣ: 'Χαλκηδόνας', ΑΣΠΡΟΒΑΛΤΑΣ: 'Ασπροβάλτας', ΜΟΥΔΑΝΙΩΝ: 'Μουδανιών',
    ΤΟΥΜΠΑΣ: 'Τούμπας', ΚΑΣΣΑΝΔΡΕΙΑΣ: 'Κασσάνδρειας', ΤΗΝΟΥ: 'Τήνου', ΧΑΛΚΙΔΙΚΗΣ: 'Χαλκιδικής', ΕΙΣΑΓΓΕΛΙΑ: 'Εισαγγελία', ΘΕΣΣΑΛΟΝΙΚΗΣ: 'Θεσσαλονίκης', ΚΑΛΑΜΑΡΙΑΣ: 'Καλαμαριάς',
    ΜΑΓΝΗΣΙΑΣ: 'Μαγνησίας', ΦΘΙΩΤΙΔΑΣ: 'Φθιώτιδας', ΠΑΘΕ: 'ΠΑΘΕ', ΚΑΙ: 'και' };
  const titleWords = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).map(w => PLACE[fold(w)] || tcase(w)).join(' ');
  const docService = (s) => {
    const u = fold(s);
    if (!u) return '';
    if (/^(ΥΔΝΣΗ|ΥΠΟΔ)/.test(u)) return 'Υδ/νση Τροχαίας Θες/νικης';
    let m;
    if ((m = /^ΑΤ\.?\s+(.+)$/.exec(u))) return 'Αστυνομικό Τμήμα ' + titleWords(m[1]);
    if ((m = /^ΤΤ\.?\s+(.+)$/.exec(u))) return 'Τμήμα Τροχαίας ' + titleWords(m[1]);
    return titleWords(s);
  };
  const splitAddr = (a) => {
    a = String(a || '').trim(); if (!a) return { street: '', num: '' };
    const fix = (s) => (s === s.toUpperCase() ? titleWords(s) : s);
    const m = /^(.*?)[\s,]+(\d+[Α-Ωα-ωA-Za-z]?(?:\s*[-–]\s*\d+)?)$/.exec(a);
    return m ? { street: fix(m[1]), num: m[2] } : { street: fix(a), num: '' };
  };

  const buildInviteDocx = (c, n, when) => {
    const d = String(when || todayStr()), mm = d.slice(5, 7), yyyy = d.slice(0, 4);
    const LET = ['', 'Α', 'Β', 'Γ'][n] || '';
    const proto = String(c.protocol || '').trim();
    const nm = docName(c.name), svc = docService(c.service), ad = splitAddr(c.address);
    const street = ad.street || '________________________', num = ad.num || '____';
    const nameTxt = nm ? nm.text + ' του ' + (nm.father || '____________') : '______________________________ του ____________';
    const R = (t, o = {}) => `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${o.sp ? `<w:spacing w:val="${o.sp}"/>` : ''}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ''}${o.u ? '<w:u w:val="single"/>' : ''}${o.sup ? '<w:vertAlign w:val="superscript"/>' : ''}</w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
    const TAB = '<w:r><w:tab/></w:r>';
    const P = (runs, o = {}) => `<w:p><w:pPr>${o.tabs ? `<w:tabs>${o.tabs}</w:tabs>` : ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after || 0}" w:line="${o.line || 276}" w:lineRule="auto"/>${o.ind ? `<w:ind ${o.ind}/>` : ''}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}</w:pPr>${runs}</w:p>`;
    const TBL = (cols, cells) => `<w:tbl><w:tblPr><w:tblW w:w="${cols.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="40" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid><w:tr>${cells.map((x, i) => `<w:tc><w:tcPr><w:tcW w:w="${cols[i]}" w:type="dxa"/></w:tcPr>${x}</w:tc>`).join('')}</w:tr></w:tbl>`;
    const IMG = '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="560000" cy="493000"/><wp:docPr id="1" name="Logo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="560000" cy="493000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    const protoRuns = (o) => proto ? R(proto, o) + R(LET, { ...o, sup: true }) : R('______________', o);
    const vdm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(c.vDate || '');
    const articleBlank = c.vArticle ? R(c.vArticle, {}) : R('____', {}),
      dateBlank = vdm ? R(vdm[3] + '/' + vdm[2] + '/' + vdm[1], { b: true }) : R('____/____/________', { b: true }),
      streetV = c.vPlace ? R(c.vPlace, { b: true, i: true }) : R('________________________', { b: true, i: true });
    const svcV = R(svc || '____________________', { b: true });
    const left = [
      P(IMG, { jc: 'center', after: 60 }),
      P(R('ΕΛΛΗΝΙΚΗ', { sz: 21, sp: 60 }) + TAB + R('ΔΗΜΟΚΡΑΤΙΑ', { sz: 21, sp: 60 }), { tabs: '<w:tab w:val="right" w:pos="4440"/>', line: 250 }),
      P(R('ΕΛΛΗΝΙΚΗ', { sz: 21, sp: 60 }) + TAB + R('ΑΣΤΥΝΟΜΙΑ', { sz: 21, sp: 60 }), { tabs: '<w:tab w:val="right" w:pos="4440"/>', line: 250 }),
      P(R('ΔΙΕΥΘΥΝΣΗ ΑΣΤΥΝ.   ΘΕΣ/ΝΙΚΗΣ', { sz: 21, sp: 30 }), { line: 250 }),
      P(R('Α. Τ. ΚΑΛΑΜΑΡΙΑΣ', { b: true, u: true, sz: 22, sp: 20 }), { jc: 'center', line: 250, before: 20 }),
      P(R('ΤΑΧ. Δ/ΝΣΗ : Ταξιαρχών 1', { sz: 17 }), { ind: 'w:left="100"', line: 240 }),
      P(R('ΤΚ. 55132 Τηλ. 2310-029465,', { sz: 18 }), { ind: 'w:left="100"', line: 240 }),
      P(R('Αρμόδιος: Αρχ/κας ΣΙΑΚΟΣ Φιλάρετος', { sz: 21 }), { ind: 'w:left="100"', line: 250 }),
      P(R('Αριθ. Πρωτ : ', { b: true, u: true, sz: 21 }) + protoRuns({ b: true, u: true, sz: 21 }), { ind: 'w:left="100"', line: 250 })
    ].join('');
    const right = [
      P(R('ΚΑΛΑΜΑΡΙΑ', { sz: 23 }) + R('        / ' + mm + ' /' + yyyy, { sz: 23 }), { jc: 'right', before: 40 }),
      P(R('ΠΡΟΣΚΛΗΣΗ', { b: true, u: true, sz: 40, sp: 20 }), { jc: 'center', before: 1250 })
    ].join('');
    const gender = nm && nm.fem ? 'Την κα' : 'Τον κ.';
    const gen2 = nm && nm.fem ? 'στην' : 'στον';
    const body1 = P(
      R('Παρακαλούμε όπως εντός τριών (3) ημερών και κατά τις ώρες ') + R('09:00 έως 13:00', { i: true, u: true }) +
      R(' Προσέλθετε στο Α.Τ. ΚΑΛΑΜΑΡΙΑΣ οδό Ταξιαρχών 1, φέροντας την παρούσα και αποτανθείτε στον ') + R('Αρχ/κα ΣΙΑΚΟ Φιλάρετο', { sz: 20 }) +
      R(' που ανέλαβε τη διεκπεραίωση της υποθέσεως σας, που αφορά παράβαση του άρθρου ') + articleBlank + R(' του Κ.Ο.Κ. που βεβαιώθηκε την ') + dateBlank +
      R(' στην οδό ') + streetV + R(' από ') + svcV + R('. Κατά την προσέλευση σας να φέρετε την αστυνομική σας ταυτότητα, τις άδειες οδηγήσεως και κυκλοφορίας καθώς και ΑΦΜ. Στοιχεία οχήματος ') + R(c.plate || '________', { b: true }),
      { ind: 'w:firstLine="400"', line: 300, jc: 'both', before: 40 });
    const noteL = [
      P(R('ΣΗΜΕΙΩΣΗ:', { b: true, u: true, sz: 22 }), { ind: 'w:left="400"', before: 360 }),
      P(R('Η εξυπηρέτηση γίνεται ', { sz: 21 }) + R('αποκλειστικά', { b: true, u: true, sz: 21 }), { ind: 'w:left="400"', line: 260 }),
      P(R('κατόπιν ραντεβού', { b: true, u: true, sz: 21 }) + R(' στο τηλ. 2310029465', { sz: 21 }), { ind: 'w:left="400"', line: 260 })
    ].join('');
    const noteR = [
      P(R('Τ Ο', { sz: 23, sp: 80 }), { jc: 'center', before: 700 }),
      P(R('ΓΡ. ΠΑΡΑΒΑΣΕΩΝ', { sz: 23 }), { jc: 'center' })
    ].join('');
    const recv = P(
      R('Στην Καλαμαριά την ____ του μήνα ______________ του έτους 202_ και ώρα ____:____ ο υπογεγραμμένος ________________________________ του Α.Τ. ΚΑΛΑΜΑΡΙΑΣ επέδωσε την υπ\'αριθμ. ') +
      protoRuns({ b: true, u: true }) + R(' από ____/' + mm + '/' + yyyy + ' πρόσκληση του Α.Τ. ΚΑΛΑΜΑΡΙΑΣ ' + gen2 + ' ') + R(nameTxt, { b: true }) +
      R(' κάτοικο Καλαμαριάς οδό ') + R(street, { b: true }) + R(' αριθμ. ') + R(num, { b: true }) +
      R(' με την οποία καλείται να προσέλθει στο κατάστημα του Α.Τ. ΚΑΛΑΜΑΡΙΑΣ εντός τριών (3) ημερών και να αποτανθεί στον ') + R('Αρχ/κα ΣΙΑΚΟ Φιλάρετο', { sz: 20 }) +
      R(' για υπόθεση που αφορά παράβαση του άρθρου ') + articleBlank + R(' του Κ.Ο.Κ. που βεβαιώθηκε την ') + dateBlank + R(' στην οδό ') + streetV + R(' από ') + svcV +
      R(' και μη ευρών αυτ__ επέδωσα την πρόσκληση στ____________________ ') + R('(Έγινε θυροκόλληση στη πόρτα της οικίας του).', { b: true, u: true }),
      { line: 300, jc: 'both', before: 60 });
    const sig = (t) => P(R('Ο', { sz: 22 }), { jc: 'center', before: 200, line: 250 }) + P(R(t, { sz: 22 }), { jc: 'center', line: 250 });
    const nameBlock = P(R(gender + ' ', {}) + R(nameTxt, { b: true }), { ind: 'w:left="850"', before: 60 });
    const addrBlock = P(R('Οδός ') + R(street, { b: true }) + R(' αριθμ. ') + R(num, { b: true }), { ind: 'w:left="850"', after: 80 });
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>` +
      TBL([4600, 5606], [left, right]) +
      P(R('ΠΡΟΣ', { b: true, u: true, sz: 24, sp: 40 }), { jc: 'center', before: 300, after: 160 }) +
      nameBlock + addrBlock + body1 +
      TBL([6400, 3806], [noteL, noteR]) +
      P(R('ΑΠΟΔΕΙΚΤΙΚΟ', { b: true, u: true, sz: 28, sp: 20 }), { jc: 'center', before: 1500, after: 60 }) +
      recv +
      P(R('Για βεβαίωση συντάχθηκε το παρόν και υπογράφεται ως ακολούθως.'), { ind: 'w:left="400"', before: 240, after: 120 }) +
      TBL([3400, 3400, 3406], [sig('ΠΑΡΑΛΑΒΩΝ'), sig('ΜΑΡΤΥΡΑΣ'), sig('ΕΠΙΔΟΥΣ')]) +
      P(R('', { sz: 2 })) +
      `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="680" w:right="850" w:bottom="560" w:left="850" w:header="400" w:footer="400" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="el-GR" w:eastAsia="el-GR" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
    const ctypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const drels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>`;
    const logo = Uint8Array.from(atob(LOGO_B64), ch => ch.charCodeAt(0));
    return zipStore([['[Content_Types].xml', u8s(ctypes)], ['_rels/.rels', u8s(rels)], ['word/document.xml', u8s(doc)], ['word/styles.xml', u8s(styles)], ['word/_rels/document.xml.rels', u8s(drels)], ['word/media/logo.png', logo]]);
  };
  const sendInvitation = async (c, n, when) => {
    try {
      const bytes = buildInviteDocx(c, n, when || todayStr());
      const fname = 'PROSKLISI_' + n + '_' + String(c.plate || 'draft').replace(/[^Α-ΩA-Z0-9]/gi, '') + '.docx';
      const blob = new Blob([bytes], { type: DOCX_MIME });
      const file = typeof File === 'function' ? new File([blob], fname, { type: DOCX_MIME }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'Πρόσκληση ' + n + 'ης ' + (c.plate || ''), text: 'Πρόσκληση ' + n + 'ης ' + (c.plate || '') }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = fname; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    } catch (err) { console.error(err); alert('Σφάλμα δημιουργίας της πρόσκλησης: ' + err.message); }
  };

  // ---------- Render ----------
  let pc = {};
  const isSoon = (c) => c.state === 'suspended' && !!c.dates.return && plus(todayStr(), 3) >= c.dates.return;
  const urgent = (c) => URG.includes(c.state) || isSoon(c) || (c.flags || []).length > 0;
  const timeline = (c) => {
    const D = c.dates, rows = [], add = (d, k, t, res, note) => { if (d) rows.push({ d, k, t, res, note }); };
    const rem = REMS[c.removalWhat] || REMS.license;
    add(c.receivedDate, 0, 'Παραλαβή εγγράφου');
    add(D.searchFound, 4, 'Αναζήτηση τηλεφώνου', 'βρέθηκε');
    add(D.searchNone, 4, 'Αναζήτηση τηλεφώνου', 'δεν βρέθηκε');
    const CR = { noanswer: 'δεν απάντησε', informed: 'απάντησε, δεν έκλεισε ραντεβού', booked: 'έκλεισε ραντεβού', refused: 'δεν απάντησε' };
    const calls = c.calls || [];
    calls.forEach((k, i) => {
      const ap = (c.appts || []).find(x => x.s === 'call' && x.b === k.d);
      const note = [k.r === 'booked' && ap ? 'ραντεβού ' + sd(ap.d) : '', k.d ? '' : 'άγνωστη ημερομηνία κλήσης'].filter(Boolean).join(', ');
      add(k.d || c.receivedDate, 5, calls.length > 1 ? (i + 1) + 'η κλήση' : 'Κλήση', CR[k.r] || '', note);
    });
    (c.appts || []).forEach((a, i, arr) => {
      if (a.s === 'citizen') add(a.b, 6, 'Επικοινώνησε ο πολίτης', 'ραντεβού ' + sd(a.d));
      else if (a.s === 'change') add(a.b, 6, 'Αλλαγή ραντεβού', 'νέο ραντεβού ' + sd(a.d));
      const missed = a.res === 'missed' || (i === arr.length - 1 && todayStr() > a.d && !D.susp && !D.docRecv);
      add(a.d, 7, 'Ραντεβού', missed ? 'δεν προσήλθε' : '');
    });
    [1, 2, 3].forEach(n => {
      add(D['inv' + n + 'Create'], 10, `Δημιουργία ${n}ης πρόσκλησης`);
      add(D['inv' + n + 'Send'], 11, `Αποστολή ${n}ης πρόσκλησης`);
      add(D['inv' + n + 'Proof'], 12, `Αποδεικτικό ${n}ης πρόσκλησης`, D['inv' + n + 'Res'] === 'bad' ? 'λάθος διεύθυνση ή δεν μένει εκεί' : D['inv' + n + 'Res'] === 'ok' ? 'βρέθηκε ή μένει εκεί' : '');
    });
    add(D.docRecv, 15, 'Παραλαβή εγγράφου από τον πολίτη (χωρίς αφαίρεση)');
    add(D.susp, 20, 'Αφαίρεση: ' + rem, '', c.removalDays ? c.removalDays + ' ημέρες, απόδοση ' + sd(D.return) : '');
    add(D.polRem, 21, 'Καταχώρηση POL (αφαίρεση)');
    add(D.returned, 22, 'Απόδοση: ' + rem);
    add(D.polRet, 23, 'Καταχώρηση POL (απόδοση)');
    add(D.oos, 14, 'Εκτός αρμοδιότητας', '', [D.oosDest, D.oosReason].filter(Boolean).join(' · '));
    add(D.complaint, 25, 'Υποβολή μήνυσης');
    add(D.closed, 30, D.closedKind === 'complaint' ? 'Διαβιβαστικό ενημέρωσης για τη μήνυση' : 'Διαβιβαστικό προς την Υπηρεσία');
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
      case 'appointment': return 'Ραντεβού ' + fmt(D.appt);
      case 'suspended': {
        const n = D.return ? Math.round((new Date(D.return + 'T12:00:00') - new Date(todayStr() + 'T12:00:00')) / 86400000) : null;
        return `Σε αφαίρεση (${c.removalDays} ημ.) · απόδοση ${fmt(D.return)}` + (isSoon(c) && n != null ? ` · σε ${n} ημ.` : '');
      }
      case 'inv1_wait': case 'inv2_wait': case 'inv3_wait': {
        const n = c.state[3]; return `Αναμονή 10 ημερών από το αποδεικτικό, έως ${fmt(addDays(D['inv' + n + 'Proof'], 10))}`;
      }
      case 'transmittal': {
        const r = transReason(c);
        if (r === 'expired' && D.inv3Proof) return `Έληξε η 10ήμερη προθεσμία από το 3ο αποδεικτικό (${fmt(addDays(D.inv3Proof, 10))}). Άμεση επιστροφή στην υπηρεσία ανάθεσης.`;
        return stOf(c).a;
      }
      case 'complaint': return D.inv3Proof ? `Έληξε η 10ήμερη προθεσμία από το 3ο αποδεικτικό (${fmt(addDays(D.inv3Proof, 10))}). Υποβολή μήνυσης.` : stOf(c).a;
      default: return stOf(c).a || '';
    }
  };

  const dayDiff = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 86400000);
  const dueOf = (c) => {
    const D = c.dates, s = c.state, m = /^inv(\d)_/.exec(s), n = m ? Number(m[1]) : 0;
    if (s === 'informed') return addDays(D.phone, 5);
    if (s === 'search' || s === 'to_call') return c.receivedDate;
    if (s === 'appointment') return D.appt;
    if (s === 'pol_rem') return D.susp;
    if (s === 'pol_ret') return D.returned;
    if (s === 'suspended' || s === 'to_return') return D.return;
    if (/_wait$/.test(s)) return addDays(D['inv' + n + 'Proof'], 10);
    if (/_create$/.test(s)) return n > 1 ? addDays(D['inv' + (n - 1) + 'Proof'], 10) : (apptMissed(c) && D.appt ? missedDate(c) : (D.callRes === 'informed' ? addDays(D.phone, 5) : (D.phone || D.searchNone || '')));
    if (/_next$/.test(s)) return D['inv' + n + 'Create'];
    if (/_sent$/.test(s)) return D['inv' + n + 'Send'];
    if (s === 'transmittal') { const bp = [1, 2, 3].map(k => D['inv' + k + 'Res'] === 'bad' && D['inv' + k + 'Proof']).find(Boolean); return D.oos || D.complaint || bp || D.returned || D.docRecv || addDays(D.inv3Proof, 10); }
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
    if (s === 'search' || s === 'to_call') return 'από ' + sd(d) + (k > 0 ? ' (' + k + ' ημ.)' : '');
    if (URG.includes(s)) return (k > 0 ? 'από ' + sd(d) + ' (' + k + ' ημ.)' : 'από σήμερα');
    return (k === 0 ? 'σήμερα' : 'έως ' + sd(d) + (k < 0 ? ' · σε ' + (-k) + ' ημ.' : ''));
  };
  const nextLabel = (c) => {
    if ((c.flags || []).includes('pol_rem')) return 'Καταχώρηση POL (αφαίρεση)';
    if ((c.flags || []).includes('pol_ret')) return 'Καταχώρηση POL (απόδοση)';
    const af = actFor(c); if (af) return af[0];
    if (c.state === 'suspended') return 'Αναμονή λήξης αφαίρεσης';
    if (/_wait$/.test(c.state)) return 'Αναμονή 10 ημερών για την επόμενη πρόσκληση';
    return c.state === 'closed' ? 'Καμία' : '';
  };
  const pendingLabel = (c) => {
    const s = c.state, m = /^inv(\d)_(create|next|sent|wait)$/.exec(s);
    if (m) return { create: 'Εκκρεμεί δημιουργία ' + m[1] + 'ης πρόσκλησης', next: 'Εκκρεμεί αποστολή ' + m[1] + 'ης πρόσκλησης', sent: 'Αναμονή ' + m[1] + 'ου αποδεικτικού', wait: 'Αναμονή 10 ημερών από το ' + m[1] + 'ο αποδεικτικό' }[m[2]];
    if (s === 'appointment') return c.removalDays > 0 ? 'Εκκρεμεί αφαίρεση' : 'Εκκρεμεί παραλαβή εγγράφου';
    if (s === 'transmittal') { const r = TR[transReason(c)]; return r.l + ' · ' + r.a; }
    return { search: 'Εκκρεμεί αναζήτηση τηλεφώνου', to_call: 'Εκκρεμεί κλήση', informed: 'Αναμονή κλήσης από τον πολίτη', pol_rem: 'Εκκρεμεί POL αφαίρεσης', pol_ret: 'Εκκρεμεί POL απόδοσης',
      suspended: 'Αναμονή λήξης αφαίρεσης', to_return: 'Εκκρεμεί απόδοση', transmittal: 'Εκκρεμεί διαβιβαστικό', complaint: 'Έληξε η προθεσμία του 3ου αποδεικτικού · Υποβολή μήνυσης', closed: '' }[s] || '';
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
  const apptTag = (c) => (c.state !== 'appointment' && c.state !== 'closed' && c.dates.appt && c.dates.appt >= todayStr() && !c.dates.susp) ? 'Ραντεβού ' + sd(c.dates.appt) : '';
  const rowHTML = (c, badge) => {
    const s = stOf(c);
    const pls = c.state === 'closed' ? [] : phoneList(c.phone);
    const cls = hotState(c) ? 'o' : urgent(c) ? 'u' : '', n = invDone(c);
    const at = apptTag(c), when = [whenText(c), at].filter(Boolean).join(' · '), lead = badge ? '' : pendingLabel(c);
    const sv = [c.service, c.notes ? 'ΣΗΜ: ' + String(c.notes).split('\n')[0].slice(0, 40) : ''].filter(Boolean).join(' · ');
    return `<div class="rc ${cls}" data-open="${c.id}">
      <div class="rc-m">
        <div class="rc-t"><b>${esc(c.plate)}</b><span>${esc(c.name)}</span>${n ? `<em>${n}/3</em>` : ''}</div>
        ${badge || lead ? `<div class="rc-s">${badge ? `<span class="bd t-${s.t}">${esc(s.l)}</span>` : ''}${esc(lead)}</div>` : ''}
        ${when ? `<div class="rc-w">${esc(when)}</div>` : ''}
        ${sv ? `<div class="rc-v">${esc(sv)}</div>` : ''}
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
    if (s === 'appointment' && c.dates.appt === todayStr()) return 'appt';
    if (s === 'search') return 'search';
    if (s === 'to_call') return 'call';
    const d = dueOf(c), k = d ? dayDiff(d, todayStr()) : 99;
    if (k >= 0 && k <= 3) return 'soon';
    return c.moveTo ? 'folder' : 'wait';
  };
  const GRP = [['pol', 'POL · κρίσιμο', 'bad'], ['late', 'Να γίνουν', 'warn'], ['appt', 'Ραντεβού σήμερα', 'info'], ['soon', 'Σύντομα · έως 3 ημέρες', ''], ['search', 'Αναζήτηση τηλεφώνου', ''], ['call', 'Για κλήση', ''], ['folder', 'Μετακίνηση φακέλου', ''], ['wait', 'Σε αναμονή', 'mut']];
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
    const mv = {}; cases.forEach(c => { if (c.moveTo) mv[c.moveTo] = (mv[c.moveTo] || 0) + 1; });
    const mvk = Object.keys(mv);
    if (mvk.length) h += `<div class="gh"><span>Μετακίνηση φακέλων</span><b>${mvk.reduce((s, k) => s + mv[k], 0)}</b></div><div class="mvall">` + mvk.map(f => `<button class="btn ghost" data-mvall="${esc(f)}">Μετακινήθηκαν στο «${esc(f)}» (${mv[f]})</button>`).join('') + '</div>';
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
    const hay = (c) => fold([c.name, c.plate, c.folder, c.phone, c.service, c.protocol, c.address, fmt(c.receivedDate), ...Object.values(c.dates || {}).filter(v => /^\d{4}-\d{2}-\d{2}$/.test(v)).map(fmt)].join(' '));
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
    const s = stOf(c), a = actFor(c);
    const cls = hotState(c) ? 'o' : urgent(c) ? 'u' : '';
    const pls = c.state === 'closed' ? [] : phoneList(c.phone);
    const nl = pendingLabel(c), wt = whenText(c);
    const tl = timeline(c);
    const nO = (pc[normPlate(c.plate)] || 1) - 1;
    const nP = cases.filter(x => x.id !== c.id && fold(x.name) === fold(c.name)).length;
    let sec = '';
    if (c.state === 'appointment') sec += `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(calLink(c))}">Προσθήκη στο Google Calendar</a><button class="btn ghost" data-r="${c.id}">Αλλαγή ραντεβού</button>`;
    secondary(c).forEach((x, i) => { sec += `<button class="btn ghost" data-b="${c.id}|${i}">${x[0]}</button>`; });
    if (c.state !== 'closed' && !c.dates.oos) sec += `<button class="btn ghost" data-oos="${c.id}">Εκτός αρμοδιότητας</button>`;
    const det = [
      c.service && `<span><b>Υπηρεσία παράβασης:</b> ${esc(c.service)}</span>`,
      c.folder && `<span><b>Φάκελος:</b> ${esc(c.folder)}</span>`,
      c.fine && `<span><b>Πρόστιμο:</b> ${esc(c.fine)} €</span>`,
      c.removalDays > 0 && `<span><b>Αφαίρεση:</b> ${esc(c.removalDays)} ημέρες · ${esc(REMS[c.removalWhat] || REMS.license)}</span>`,
      c.protocol && `<span><b>Πρωτόκολλο:</b> ${esc(c.protocol)}</span>`,
      c.address && `<span><b>Διεύθυνση:</b> ${esc(c.address)}</span>`,
      c.violationType && `<span><b>Είδος παράβασης:</b> ${esc(c.violationType)}</span>`,
      `<span><b>Παραλαβή εγγράφου:</b> ${esc(fmt(c.receivedDate))}</span>`
    ].filter(Boolean).join('');
    return `<div class="d-hd"><div class="d-pl">${esc(c.plate)}</div><div class="d-nm">${esc(c.name)}${c.service ? ' · ' + esc(c.service) : ''}</div><div><span class="bd t-${s.t}">${esc(s.l)}</span></div></div>
      ${pls.length ? `<div class="tels">${pls.map(x => `<a class="tel" href="${esc(telHref(x))}">Κλήση ${esc(x)}</a>`).join('')}</div>` : ''}
      <div class="d-next ${cls}"><small>Επόμενη ενέργεια</small>
        ${a ? `<button class="btn pri big" data-a="${c.id}">${esc(a[0])}</button>` : (nl ? `<strong>${esc(nl)}</strong>` : '')}
        ${wt ? `<span>${esc(wt)}</span>` : ''}${apptTag(c) ? `<span>${esc(apptTag(c))}</span>` : ''}</div>
      ${c.moveTo ? `<div class="mvbox"><span>Μετακίνηση φακέλου: <b>${esc(c.moveTo)}</b></span><button class="btn ghost" data-mv="${c.id}">Μετακινήθηκε</button></div>` : ''}
      ${stepper(c)}
      ${sec ? `<details class="more"><summary>Άλλες ενέργειες</summary><div class="sec">${sec}</div></details>` : ''}
      <h3 class="d-h">Ιστορικό</h3>
      <ol class="tl">${tl.map((r, i) => `<li data-e="${c.id}" data-adv><i>${i + 1}</i><span>${esc(evText(r))}</span></li>`).join('')}${nl && c.state !== 'closed' ? `<li class="nx"><i>›</i><span>Επόμενο: ${esc(nl)}${wt ? ' · ' + esc(wt) : ''}</span></li>` : ''}</ol>
      <h3 class="d-h">Στοιχεία</h3>
      <div class="det">${det}</div>${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ''}
      ${nO ? `<button class="linkbtn" data-p="${esc(normPlate(c.plate))}">Άλλες υποθέσεις με την ίδια πινακίδα: ${nO}</button>` : ''}
      ${nP ? `<button class="linkbtn" data-p="${esc(c.name)}">Άλλες υποθέσεις του ίδιου προσώπου: ${nP}</button>` : ''}
      <div class="row"><button class="btn" data-e="${c.id}">Επεξεργασία</button>${(c.undo || []).length ? `<button class="btn ghost" data-u="${c.id}">Αναίρεση: ${esc(c.undo[c.undo.length - 1].l)}</button>` : ''}</div>`;
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
    const v = normPlate(val).replace(/\/\d{0,3}$/, ''), w = $('#plateWarning'), id = String(F.dataset.id || '');
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

  const DF = { searchFound:'d_searchFound', searchNone:'d_searchNone',
    inv1Create:'d_inv1Create', inv1Send:'d_inv1Send', inv1Proof:'d_inv1Proof', inv1Res:'d_inv1Res',
    inv2Create:'d_inv2Create', inv2Send:'d_inv2Send', inv2Proof:'d_inv2Proof', inv2Res:'d_inv2Res',
    inv3Create:'d_inv3Create', inv3Send:'d_inv3Send', inv3Proof:'d_inv3Proof', inv3Res:'d_inv3Res',
    susp:'d_susp', return:'d_return', polRem:'d_polRem', returned:'d_returned', polRet:'d_polRet',
    docRecv:'d_docRecv', oos:'d_oos', oosDest:'d_oosDest', oosReason:'d_oosReason', complaint:'d_complaint', closed:'d_closed', closedKind:'d_closedKind' };
  const DL = { searchFound: 'Βρέθηκε τηλέφωνο', searchNone: 'Δεν βρέθηκε τηλέφωνο', susp: 'Αφαίρεση', polRem: 'POL αφαίρεσης', returned: 'Απόδοση', polRet: 'POL απόδοσης',
    docRecv: 'Παραλαβή εγγράφου', oos: 'Εκτός αρμοδιότητας', oosDest: 'Υπηρεσία προορισμού', oosReason: 'Αιτιολογία', complaint: 'Μήνυση', closed: 'Κλείσιμο', closedKind: 'Είδος κλεισίματος' };
  [1, 2, 3].forEach(n => { DL['inv' + n + 'Create'] = n + 'η δημιουργία πρόσκλησης'; DL['inv' + n + 'Send'] = n + 'η αποστολή πρόσκλησης'; DL['inv' + n + 'Proof'] = n + 'ο αποδεικτικό'; DL['inv' + n + 'Res'] = n + 'ο αποδεικτικό (αποτέλεσμα)'; });
  F.querySelectorAll('.adv input[type=date]:not([readonly])').forEach(inp => {
    const w = document.createElement('span'); w.className = 'dw';
    inp.parentNode.insertBefore(w, inp); w.append(inp);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'clr'; b.textContent = 'Καθαρισμός';
    b.onclick = () => { inp.value = ''; };
    w.append(b);
  });
  const refreshSvc = () => {
    const s = new Set(['ΑΤ ΚΑΛΑΜΑΡΙΑΣ', 'ΤΤ ΚΑΛΑΜΑΡΙΑΣ', 'ΥΔΝΣΗ']); cases.forEach(c => { if (c.service) s.add(c.service); if (c.dates && c.dates.oosDest) s.add(c.dates.oosDest); });
    $('#serviceList').innerHTML = [...s].sort().map(v => `<option value="${esc(v)}">`).join('');
  };
  const CALLOPT = [['noanswer', 'Δεν απάντησε'], ['informed', 'Δεν έκλεισε ραντεβού'], ['booked', 'Έκλεισε ραντεβού']];
  const callRow = (k) => `<div class="er"><input type="date" class="cd" value="${esc(k.d || '')}"><select class="cr">${CALLOPT.map(o => `<option value="${o[0]}"${o[0] === k.r ? ' selected' : ''}>${o[1]}</option>`).join('')}</select><button type="button" class="x" aria-label="Διαγραφή">×</button></div>`;
  const apptRow = (a) => `<div class="er" data-s="${esc(a.s || '')}"><label>Κλείστηκε<input type="date" class="ab" value="${esc(a.b || '')}"></label><label>Ραντεβού<input type="date" class="ad" value="${esc(a.d || '')}"></label><button type="button" class="x" aria-label="Διαγραφή">×</button></div>`;
  const readCalls = () => [...F.querySelectorAll('#callRows .er')].map(r => ({ d: r.querySelector('.cd').value, r: r.querySelector('.cr').value }));
  const readAppts = () => {
    const a = [...F.querySelectorAll('#apptRows .er')].map(r => ({ b: r.querySelector('.ab').value, d: r.querySelector('.ad').value, s: r.dataset.s || 'citizen', res: '' })).filter(x => x.d);
    a.sort((x, y) => (x.b || x.d).localeCompare(y.b || y.d) || x.d.localeCompare(y.d));
    a.forEach((x, i) => { const nx = a[i + 1]; if (nx) x.res = (nx.b ? x.d < nx.b : x.d < todayStr()) ? 'missed' : ''; });
    a.forEach((x, i) => { if (x.s !== 'call') x.s = i > 0 && a[i - 1].res !== 'missed' ? 'change' : 'citizen'; });
    return a;
  };
  F.addEventListener('click', (e) => { const x = e.target.closest('.er .x'); if (x) x.closest('.er').remove(); });
  $('#addCall').onclick = () => $('#callRows').insertAdjacentHTML('beforeend', callRow({ d: todayStr(), r: 'noanswer' }));
  $('#addAppt').onclick = () => $('#apptRows').insertAdjacentHTML('beforeend', apptRow({ b: todayStr(), d: '', s: 'citizen' }));
  const fillProto = (yr, cur) => {
    const opts = PROTO_PREFIXES(yr);
    if (cur && !opts.includes(cur)) opts.push(cur);
    E.protocolPrefix.innerHTML = '<option value="">— φάκελος —</option>' + opts.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    E.protocolPrefix.value = cur || '';
  };
  const buildProtocol = () => { const num = String(E.protocolNum.value || '').replace(/\s/g, '').toUpperCase(); return num ? (E.protocolPrefix.value || '') + num : ''; };
  E.protocolNum.addEventListener('input', () => {
    if (E.protocolPrefix.value) return;
    const p = autoPrefix(E.protocolNum.value, yy2(E.receivedDate.value));
    if (p) fillProto(yy2(E.receivedDate.value), p);
  });
  E.service.addEventListener('change', () => { E.service.value = normText(E.service.value); });
  E.d_oosDest.addEventListener('change', () => { E.d_oosDest.value = normText(E.d_oosDest.value); });
  E.manualState.closest('label').hidden = true;

  const openForm = (id, adv) => {
    const c = id ? get(id) : null;
    F.reset(); F.dataset.id = id || '';
    { const sm = $('#scanMsg'); if (sm) { sm.hidden = true; sm.textContent = ''; } }
    $('#formTitle').textContent = c ? 'Επεξεργασία υπόθεσης' : 'Νέα υπόθεση';
    $('#btnFormDelete').hidden = !c;
    E.manualState.innerHTML = Object.keys(ST).map(k => `<option value="${k}">${ST[k].l}</option>`).join('');
    folderOpts(c ? c.folder : ''); refreshSvc();
    $('#callRows').innerHTML = (c ? c.calls || [] : []).map(callRow).join('');
    $('#apptRows').innerHTML = (c ? c.appts || [] : []).map(apptRow).join('');
    F.querySelector('.adv').open = !!adv;
    if (c) {
      E.plate.value = c.plate; E.name.value = c.name; E.service.value = c.service || ''; E.phone.value = c.phone || '';
      E.receivedDate.value = c.receivedDate;
      if (VIOL.includes(c.violationType)) E.violationType.value = c.violationType;
      else if (c.violationType) { E.violationType.value = 'custom'; E.violationOther.value = c.violationType; }
      E.fine.value = c.fine || '';
      E.removalDays.value = c.removalDays || ''; E.removalWhat.value = c.removalWhat || 'license'; E.notes.value = c.notes || '';
      const sp = splitProtocol(c.protocol); fillProto(yy2(c.receivedDate), sp.prefix); E.protocolNum.value = sp.num; E.address.value = c.address || '';
      E.manualState.value = c.state;
      E.vDate.value = c.vDate || ''; E.vPlace.value = c.vPlace || ''; E.vArticle.value = c.vArticle || ''; E.endRoute.value = c.endRoute || '';
      Object.entries(DF).forEach(([k, n]) => { E[n].value = c.dates[k] || ''; });
      if (c.folder && $('#fFolder').value === '') { $('#fFolder').value = 'custom'; E.folderCustom.value = c.folder; }
      checkPlate(c.plate);
    } else {
      E.receivedDate.value = todayStr(); E.removalWhat.value = 'license'; fillProto(yy2(todayStr()), ''); E.protocolNum.value = ''; E.address.value = '';
      $('#plateWarning').style.display = 'none';
      E.manualState.value = 'search';
    }
    toggles();
    F.dataset.id = id || '';
    dlgF.showModal();
  };

  const showV = (v) => !v ? '—' : /^\d{4}-\d{2}-\d{2}$/.test(v) ? sd(v) : v === 'ok' ? 'βρέθηκε ή μένει εκεί' : v === 'bad' ? 'λάθος διεύθυνση ή δεν μένει εκεί' : v === 'transmittal' ? 'Διαβιβαστικό' : v === 'complaint' ? 'Μήνυση' : v;

  F.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = F.dataset.id || uid(), old = get(id);
    const folder = E.folderSelect.value === 'custom' ? E.folderCustom.value.trim().toUpperCase() : E.folderSelect.value;
    const days = Number(E.removalDays.value) || 0, req = days > 0, what = E.removalWhat.value || 'license';
    const D = { ...BLANK_DATES, ...(old ? old.dates : {}) };
    Object.entries(DF).forEach(([k, n]) => { D[k] = E[n].value; });
    const calls = readCalls(), appts = readAppts();
    const Lc = lastBy(calls); D.phone = Lc ? Lc.d : ''; D.callRes = Lc ? Lc.r : '';
    D.appt = appts.length ? appts[appts.length - 1].d : '';
    D.oosDest = normText(D.oosDest);
    if (D.susp && !days) { alert('Για ημερομηνία αφαίρεσης συμπλήρωσε τις ημέρες αφαίρεσης.'); return; }
    if (D.returned && !D.susp) { alert('Η απόδοση προϋποθέτει ημερομηνία αφαίρεσης.'); return; }
    if (D.polRem && !D.susp) { alert('Το POL αφαίρεσης προϋποθέτει ημερομηνία αφαίρεσης.'); return; }
    if (D.polRet && !D.returned) { alert('Το POL απόδοσης προϋποθέτει ημερομηνία απόδοσης.'); return; }
    if (D.oos && !String(D.oosDest || '').trim()) { alert('Συμπλήρωσε την υπηρεσία προορισμού για το «Εκτός αρμοδιότητας».'); return; }
    D.closedKind = D.closed ? (D.closedKind || 'transmittal') : '';
    if (D.susp && days) D.return = addDays(D.susp, days);

    let plate = String(E.plate.value || '').replace(/\/+$/, ''), proto = buildProtocol();
    const pm = /^(.*?)\/(\d{2,3})$/.exec(plate); if (pm) { plate = pm[1]; if (!proto) proto = autoPrefix(pm[2], yy2(E.receivedDate.value)) + pm[2]; }
    const recv = E.receivedDate.value;
    const rec = {
      id,
      plate: normPlate(plate),
      name: E.name.value.trim().toUpperCase(),
      service: normText(E.service.value),
      phone: E.phone.value.trim(),
      receivedDate: recv,
      folder,
      violationType: E.violationType.value === 'custom' ? E.violationOther.value.trim().toUpperCase() : E.violationType.value,
      fine: E.fine.value.trim(),
      requiresLicense: req,
      removalDays: days,
      removalWhat: what,
      protocol: proto,
      address: E.address.value.trim(),
      notes: E.notes.value.trim().toUpperCase(),
      vDate: E.vDate.value, vPlace: E.vPlace.value.trim(), vArticle: E.vArticle.value.trim(), endRoute: E.endRoute.value,
      state: old ? old.state : 'search',
      history: old ? (old.history || []) : [], ev: old ? (old.ev || []) : [],
      calls, appts, undo: old ? (old.undo || []) : [],
      dates: D, flags: old ? (old.flags || []) : [], schema: 5
    };
    if (old) {
      const lines = [];
      Object.keys(DF).forEach(k => { if (k === 'return') return; const a = old.dates[k] || '', b = D[k] || ''; if (a !== b) lines.push(DL[k] + ': ' + showV(a) + ' → ' + showV(b)); });
      if (JSON.stringify(old.calls || []) !== JSON.stringify(calls)) lines.push('Κλήσεις: ' + (old.calls || []).length + ' → ' + calls.length);
      const strip = (a) => JSON.stringify((a || []).map(x => [x.b, x.d]));
      if (strip(old.appts) !== strip(appts)) lines.push('Ραντεβού: ' + (old.appts || []).length + ' → ' + appts.length);
      if ((old.removalDays || 0) !== days) lines.push('Ημέρες αφαίρεσης: ' + (old.removalDays || '—') + ' → ' + (days || '—'));
      if (days && (old.removalWhat || 'license') !== what) lines.push('Προς αφαίρεση: ' + cap1(REMS[old.removalWhat || 'license']) + ' → ' + cap1(REMS[what]));
      if (lines.length && !confirm('Θα αλλάξουν:\n' + lines.join('\n') + '\n\nΣυνέχεια;')) return;
    }
    const before = old ? snap(old) : null;
    rec.moveTo = old ? (old.moveTo || '') : '';
    reconcile(rec);
    if (rec.moveTo && rec.moveTo === rec.folder) rec.moveTo = '';
    if (old) cases[cases.indexOf(old)] = rec; else cases.unshift(rec);
    const pushed = old ? pushUndo(rec, 'Διόρθωση στοιχείων', before) : false;
    save(); render(); dlgF.close();
    if (pushed) showToast(rec, 'Διόρθωση στοιχείων');
  });
  
  // ---------- NEW: Συμπλήρωση από κείμενο εγγράφου (MakeACopy Workflow) ----------
  const SCAN_LBL = { plate: 'Πινακίδα', name: 'Ονοματεπώνυμο', service: 'Υπηρεσία', address: 'Διεύθυνση', violationType: 'Είδος παράβασης', removalDays: 'Ημέρες αφαίρεσης', removalWhat: 'Προς αφαίρεση', vDate: 'Ημερομηνία παράβασης', vPlace: 'Τόπος παράβασης', vArticle: 'Άρθρο', endRoute: 'Τέλος διαδικασίας' };
  const ROUTE_L = { '': 'κατά τον κανόνα', complaint: 'μήνυση', transmittal: 'διαβιβαστικό' };
  const scanShow = (k, v) => !v ? '—' : k === 'removalWhat' ? cap1(REMS[v] || v) : k === 'endRoute' ? ROUTE_L[v] : k === 'vDate' ? sd(v) : String(v);
  const scanCur = (k) => {
    if (k === 'violationType') return E.violationType.value === 'custom' ? E.violationOther.value.trim().toUpperCase() : E.violationType.value;
    if (k === 'removalWhat') return E.removalDays.value ? E.removalWhat.value : '';
    if (k === 'plate') return normPlate(E.plate.value);
    if (k === 'name') return E.name.value.trim().toUpperCase();
    return String(E[k].value || '').trim();
  };
  let lastScanText = '';
  
  // Η ΝΕΑ ΣΥΝΑΡΤΗΣΗ ΓΙΑ CLEAN TEXT INPUT
  const applyScanFromPaste = (text) => {
    const P = window.OcrParser, sm = $('#scanMsg');
    if (!P) { alert('Λείπει το αρχείο ocr-parser.js.'); return; }
    lastScanText = String(text || ''); $('#btnCopyOcr').hidden = !lastScanText;
    
    // Parse single pass (optimized for clean text)
    const res = P.parseDocument(text), o = P.toForm(res);
    const keys = Object.keys(SCAN_LBL).filter(k => o[k] !== undefined && o[k] !== '');
    const lines = keys.filter(k => scanCur(k) && scanCur(k) !== String(o[k])).map(k => SCAN_LBL[k] + ': ' + scanShow(k, scanCur(k)) + ' → ' + scanShow(k, o[k]));
    
    if (lines.length && !confirm('Θα αλλάξουν:\n' + lines.join('\n') + '\n\nΣυνέχεια;')) { sm.hidden = true; return; }
    
    keys.forEach(k => {
      const v = o[k];
      if (k === 'plate') { E.plate.value = normPlate(v); checkPlate(E.plate.value); }
      else if (k === 'service') E.service.value = normText(v);
      else if (k === 'violationType') { E.violationType.value = v; toggles(); }
      else E[k].value = v;
    });
    
    const cur = E.notes.value.split('\n').map(x => x.trim()).filter(Boolean), have = cur.map(x => x.toUpperCase());
    const add = (o.notes || []).filter(x => !have.includes(x.toUpperCase()));
    if (add.length) E.notes.value = cur.concat(add).join('\n');
    if (o.endRoute) { const ds = F.querySelectorAll('.adv'); if (ds[1]) ds[1].open = true; }
    
    const msg = [];
    const done = keys.map(k => SCAN_LBL[k]).concat(add.length ? ['Σημειώσεις'] : []);
    msg.push(done.length ? 'Συμπληρώθηκαν: ' + done.join(', ') + '.' : 'Δεν αναγνωρίστηκε τίποτα. Έλεγξε ότι επικόλλησες το κείμενο του εγγράφου.');
    (res.warnings || []).concat(o.info || []).forEach(w => msg.push('Έλεγξε: ' + w));
    if (keys.length) msg.push('Έλεγξε πάντα: πινακίδα, ονοματεπώνυμο, ημέρες αφαίρεσης.');
    const left = [['τηλέφωνο', E.phone.value], ['αριθμός πρωτοκόλλου', E.protocolNum.value], ['φάκελος', E.folderSelect.value], ['πρόστιμο', E.fine.value]].filter(x => !String(x[1] || '').trim()).map(x => x[0]);
    if (left.length) msg.push('Μένουν: ' + left.join(', ') + '.');
    sm.textContent = msg.join('\n'); sm.hidden = false;
  };

  // Event Listener για το κουμπί Paste
  $('#btnPaste').onclick = () => wiz('Συμπλήρωση από έγγραφο', 'Επικόλλησε το κείμενο του εγγράφου που έβγαλες με το OCR (MakeACopy).',
    '<textarea id="wTx" rows="9" style="width:100%;box-sizing:border-box" placeholder="Επικόλληση κειμένου"></textarea>',
    [{ t: 'Συμπλήρωση', c: 'pri', v: () => { const ok = $('#wTx').value.trim().length > 30; if (!ok) alert('Επικόλλησε πρώτα το κείμενο του εγγράφου.'); return ok; }, f: () => applyScanFromPaste($('#wTx').value) }]);

  $('#btnGenInv').onclick = () => wiz('Δημιουργία πρόσκλησης', 'Από τα στοιχεία της φόρμας. Ποια πρόσκληση;', '', [1, 2, 3].map(n => ({ t: n + 'η πρόσκληση', c: n === 1 ? 'pri' : '', f: () => sendInvitation({ plate: normPlate(E.plate.value), name: E.name.value.trim().toUpperCase(), protocol: buildProtocol(), address: E.address.value.trim(), service: normText(E.service.value), vDate: E.vDate.value, vPlace: E.vPlace.value.trim(), vArticle: E.vArticle.value.trim() }, n, todayStr()) })));

  // ---------- Events ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-nav],[data-open],[data-a],[data-b],[data-oos],[data-mv],[data-r],[data-e],[data-p],[data-back],[data-grp],[data-filter],[data-clearf],[data-u],[data-mvall]');
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
    if (d.mvall) { const list = cases.filter(x => x.moveTo === d.mvall); if (list.length && confirm('Μετακινήθηκαν ' + list.length + ' φάκελοι στο «' + d.mvall + '»;')) { list.forEach(x => { x.folder = x.moveTo; x.moveTo = ''; }); save(); render(); } return; }
    const id = d.a || d.r || d.e || d.oos || d.mv || d.u || (d.b || '').split('|')[0];
    const c = get(id); if (!c) return;
    if (d.a) { const a = actFor(c); if (a) a[1](c); }
    else if (d.b) { const x = secondary(c)[Number(d.b.split('|')[1])]; if (x) x[1](c); }
    else if (d.r) actAppt(c);
    else if (d.e) openForm(c.id, 'adv' in d);
    else if (d.u) undoLast(c);
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

  $('#undoBar').querySelector('button').onclick = () => { const c = get($('#undoBar').dataset.id); if (c) undoLast(c); };
  load(); render();
  let lastDay = todayStr();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastDay = todayStr(); tick(); render(); } });
  setInterval(() => { if (todayStr() !== lastDay) { lastDay = todayStr(); tick(); render(); } }, 60000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();