(() => {
  const KEY = 'troxonomika_final_v24';
  const OLD = [...Array(22)].map((_, i) => 'troxonomika_final_v' + (22 - i))
    .concat(['ypotheseis_pwa_v1','ypotheseis.v1','troxonomika.cases.v1','ypotheseis.v2','ypotheseis_gemini_v1']);
  OLD.unshift('troxonomika_final_v23');

  // ---------- Ρυθμίσεις & Σταθερές ----------
  const ST = {
    search:      { l: 'Προς Αναζήτηση', t: 'info', a: 'Εκκρεμεί αναζήτηση τηλεφώνου' },
    to_call:     { l: 'Προς Κλήση', t: 'info', a: '' },
    informed:    { l: 'Ενημερώθηκε', t: 'warn', a: 'Αναμονή 5 ημερών' },
    appointment: { l: 'Ραντεβού', t: 'info', a: '' },
    no_show:     { l: 'Μη Προσέλευση', t: 'bad', a: '' },
    suspended:   { l: 'Σε Αφαίρεση', t: 'info', a: '' },
    to_return:   { l: 'Προς Απόδοση', t: 'bad', a: '' },
    inv1_create: { l: 'Προς δημιουργία 1ης', t: 'warn', a: '' }, inv1_next: { l: 'Προς αποστολή 1ης', t: 'warn', a: '' }, inv1_sent: { l: 'Αναμονή 1ου Αποδεικτικού', t: 'warn', a: '' }, inv1_wait: { l: 'Αναμονή 10ημ. (1ο)', t: 'warn', a: '' },
    inv2_create: { l: 'Προς δημιουργία 2ης', t: 'warn', a: '' }, inv2_next: { l: 'Προς αποστολή 2ης', t: 'warn', a: '' }, inv2_sent: { l: 'Αναμονή 2ου Αποδεικτικού', t: 'warn', a: '' }, inv2_wait: { l: 'Αναμονή 10ημ. (2ο)', t: 'warn', a: '' },
    inv3_create: { l: 'Προς δημιουργία 3ης', t: 'warn', a: '' }, inv3_next: { l: 'Προς αποστολή 3ης', t: 'warn', a: '' }, inv3_sent: { l: 'Αναμονή 3ου Αποδεικτικού', t: 'warn', a: '' }, inv3_wait: { l: 'Αναμονή 10ημ. (3ο)', t: 'warn', a: '' },
    transmittal: { l: 'Προς διαβίβαση', t: 'bad', a: '' },
    pol_rem:     { l: 'Αφαίρεση — εκκρεμεί POL', t: 'bad', a: '' },
    pol_ret:     { l: 'Απόδοση — εκκρεμεί POL', t: 'bad', a: '' },
    complaint:   { l: 'Προς Μήνυση', t: 'bad', a: '' },
    closed:      { l: 'Ολοκληρωμένη', t: 'ok', a: '' }
  };
  
  const FOLDERS = {
    'Τηλέφωνα': ['Με ραντεβού', 'Χωρίς ραντεβού'],
    'Προσκλήσεις': ['1η πρόσκληση', '2η πρόσκληση', '3η πρόσκληση'],
    'Αναμονή αποδεικτικού': ['Αναμονή αποδεικτικού'],
    'Εκκρεμότητες': ['Αναζήτηση τηλεφώνου', 'Αποστολή πρόσκλησης', 'Διαβίβαση σε Υπηρεσία', 'Καταχώρηση POL']
  };
  const VIOL = ['Υπερβολική ταχύτητα','ΚΤΕΟ','Διόδια','Στάθμευση','Απόφαση'];
  const BLANK_DATES = { phone:'', appt:'', susp:'', return:'', inv1Send:'', inv1Proof:'', inv2Send:'', inv2Proof:'', inv3Send:'', inv3Proof:'', inv1Create:'', inv2Create:'', inv3Create:'', returned:'', closed:'', closedKind:'', callRes:'', searchNone:'', docRecv:'', polRem:'', polRet:'', oos:'', oosDest:'', oosReason:'' };

  let cases = [];
  let currentView = 'today';
  let currentDetailId = null;
  let folderF = 'all', stateF = 'all', q = '';

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
  const save = () => { if (!locked) localStorage.setItem(KEY, JSON.stringify(cases)); };
  const get = (id) => cases.find(x => x.id === id);
  const stripNo = (f) => String(f || '').replace(/^[0-9]\.\s*/, '');

  const mapOld = (o) => {
    const s = (o.status || '').toLowerCase();
    const m = { search:'search', to_call:'to_call', informed:'informed', called:'informed', appointment:'appointment', appt:'appointment', removed:'suspended', suspended:'suspended', to_return:'to_return', inv1_sent:'inv1_sent', invite1:'inv1_sent', inv1_proof:'inv2_next', inv2_sent:'inv2_sent', invite2:'inv2_sent', inv2_proof:'inv3_next', inv3_sent:'inv3_sent', invite3:'inv3_sent', inv3_proof:'return_service', return_service:'return_service', closed:'closed', done:'closed' };
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
      dates: { ...BLANK_DATES, phone: o.phoneDate || o.callDate || '', appt: o.apptDate || o.appointmentDate || '', susp: o.suspDate || o.removalDate || o.arrivedDate || '', return: o.returnDate || '', inv1Send: o.inv1Send || o.invite1Date || o.invite1 || '', inv1Proof: o.inv1Proof || o.proof1 || '', inv2Send: o.inv2Send || o.invite2Date || o.invite2 || '', inv2Proof: o.inv2Proof || o.proof2 || '', inv3Send: o.inv3Send || o.invite3Date || o.invite3 || '', inv3Proof: o.inv3Proof || o.proof3 || '', closed: o.closedDate || '' }
    };
    if (c.dates.susp && c.removalDays && !c.dates.return) c.dates.return = addDays(c.dates.susp, c.removalDays);
    return c;
  };

  const endState = (c) => c.violationType === 'Απόφαση' ? 'complaint' : 'transmittal';
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
  
  const upgrade = (c) => {
    if (c.schema >= 4) return c;
    if (c.schema === 3) return step4(c);
    if (c.schema === 2) return step3(c);
    c.flags = c.flags || []; c.history = c.history || [];
    const np = normPlate(c.plate);
    if (np !== c.plate) { c.plate = np; }
    const m = { inv1_next: 'inv1_create', inv2_next: 'inv2_create', inv3_next: 'inv3_create' };
    if (m[c.state]) { c.state = m[c.state]; }
    if (c.state === 'return_service') { c.state = endState(c); }
    if (c.dates.susp && c.removalDays) {
      const r = addDays(c.dates.susp, c.removalDays);
      if (r !== c.dates.return) { c.dates.return = r; }
    }
    if (c.state === 'to_return' && c.dates.return && !isDue(c.dates.return)) { c.state = 'suspended'; }
    if (!c.dates.susp && c.removalDays === 30 && c.state !== 'suspended' && c.state !== 'to_return') { c.removalDays = 0; c.requiresLicense = false; }
    c.schema = 2;
    return step3(c);
  };
  const RETIRED = { recall: 'inv1_create' };
  const fixState = (c) => { if (RETIRED[c.state]) { c.state = RETIRED[c.state]; } return c; };
  const migrate = (o) => fixState(upgrade(migrateBase(o)));

  const load = () => {
    try {
      const cur = localStorage.getItem(KEY);
      if (cur) { cases = (JSON.parse(cur) || []).map(migrate); tick(); return; }
    } catch (e) {}
    for (const k of OLD) {
      let arr = null;
      try { arr = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { continue; }
      if (!Array.isArray(arr) || !arr.length) continue;
      try { const out = arr.map(migrate); cases = out; save(); tick(); } catch (e) { locked = true; cases = []; }
      return;
    }
    cases = [];
  };

  // ---------- Φάση υπόθεσης ----------
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
  const reconcile = (c) => {
    const D = c.dates; let ch = false;
    if (D.susp && c.removalDays) { const r = addDays(D.susp, c.removalDays); if (r !== D.return) { D.return = r; ch = true; } }
    const st = derive(c);
    if (c.state !== st) { c.state = st; ch = true; }
    return ch;
  };
  const tick = () => { let ch = false; cases.forEach(c => { if (reconcile(c)) ch = true; }); if (ch) save(); };
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

  // ---------- Ενέργειες ----------
  const T = () => todayStr();
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
    pol_rem: ['Επιβεβαίωση POL (αφαίρεση)', actPolRem], pol_ret: ['Επιβεβαίωση POL (απόδοση)', actPolRet],
    to_return: ['Απόδοση διπλώματος', actDeliver],
    inv1_create: ['Δημιουργία 1ης', c => createInv(c, 1)], inv1_next: ['Αποστολή 1ης', c => invite(c, 1)], inv1_sent: ['Παραλαβή 1ου αποδεικτικού', c => proof(c, 1)],
    inv2_create: ['Δημιουργία 2ης', c => createInv(c, 2)], inv2_next: ['Αποστολή 2ης', c => invite(c, 2)], inv2_sent: ['Παραλαβή 2ου αποδεικτικού', c => proof(c, 2)],
    inv3_create: ['Δημιουργία 3ης', c => createInv(c, 3)], inv3_next: ['Αποστολή 3ης', c => invite(c, 3)], inv3_sent: ['Παραλαβή 3ου αποδεικτικού', c => proof(c, 3)],
    transmittal: ['Δημιουργήθηκε το διαβιβαστικό', actTransmit], complaint: ['Υποβλήθηκε η μήνυση', actComplaint]
  };
  
  const ACT2 = { appointment: [['Παρέλαβε έγγραφο (χωρίς αφαίρεση)', actReceived, c => !(c.removalDays > 0)]] };
  
  ['inv1_create','inv1_next','inv1_sent','inv2_create','inv2_next','inv2_sent','inv3_create','inv3_next','inv3_sent']
    .forEach(k => { ACT2[k] = [['Ο πολίτης επικοινώνησε', actContact]]; });
    
  ACT2['inv1_wait'] = [['Ο πολίτης επικοινώνησε', actContact], ['Διόρθωση 1ου αποδεικτικού', c => proof(c, 1)]];
  ACT2['inv2_wait'] = [['Ο πολίτης επικοινώνησε', actContact], ['Διόρθωση 2ου αποδεικτικού', c => proof(c, 2)]];
  ACT2['inv3_wait'] = [['Ο πολίτης επικοινώνησε', actContact], ['Διόρθωση 3ου αποδεικτικού', c => proof(c, 3)]];
  
  ACT2.closed = [['Άνοιγμα υπόθεσης', c => { if (confirm('Να ανοίξει ξανά η υπόθεση;')) go(c, '', { closed: '', closedKind: '' }); }]];

  // ---------- Render Logic ----------
  const invDone = (c) => {
    const m = /^inv(\d)_(create|next|sent|wait)$/.exec(c.state);
    const fromState = m ? (m[2] === 'sent' || m[2] === 'wait' ? Number(m[1]) : Number(m[1]) - 1) : 0;
    const fromDates = [1, 2, 3].filter(n => c.dates['inv' + n + 'Send']).length;
    return Math.min(3, Math.max(fromState, fromDates));
  };
  const isSoon = (c) => c.state === 'suspended' && !!c.dates.return && plus(todayStr(), 3) >= c.dates.return;
  
  const timeline = (c) => {
    const D = c.dates, rows = [], add = (d, k, t, res, note) => { if (d) rows.push({ d, k, t, res, note }); };
    add(c.receivedDate, 0, 'Παραλαβή εγγράφου');
    add(D.searchNone, 4, 'Αναζήτηση τηλεφώνου', 'δεν βρέθηκε');
    const CR = { noanswer: 'δεν απάντησε', informed: 'ενημερώθηκε, θα καλέσει ο ίδιος', booked: D.appt ? 'ραντεβού στις ' + sd(D.appt) : 'ραντεβού', refused: 'αρνήθηκε ή αναβάλλει' };
    if (D.callRes) add(D.phone, 5, 'Κλήση', CR[D.callRes]);
    if (D.appt && D.callRes !== 'booked') add(D.appt, 6, 'Ραντεβού');
    if (D.appt && todayStr() > D.appt && !D.susp && !D.docRecv) add(D.appt, 7, 'Δεν προσήλθε στο ραντεβού');
    [1, 2, 3].forEach(n => {
      add(D['inv' + n + 'Create'], 10, `Δημιουργία ${n}ης πρόσκλησης`);
      add(D['inv' + n + 'Send'], 11, `Αποστολή ${n}ης πρόσκλησης`);
      add(D['inv' + n + 'Proof'], 12, `Αποδεικτικό ${n}ης πρόσκλησης`);
    });
    add(D.docRecv, 15, 'Παραλαβή εγγράφου (χωρίς αφαίρεση)');
    add(D.susp, 20, 'Αφαίρεση διπλώματος', '', c.removalDays ? c.removalDays + ' ημέρες, απόδοση ' + sd(D.return) : '');
    add(D.polRem, 21, 'Καταχώρηση POL (αφαίρεση)');
    add(D.returned, 22, 'Απόδοση διπλώματος');
    add(D.polRet, 23, 'Καταχώρηση POL (απόδοση)');
    add(D.oos, 14, 'Εκτός αρμοδιότητας', '', [D.oosDest, D.oosReason].filter(Boolean).join(' · '));
    add(D.closed, 30, D.closedKind === 'complaint' ? 'Μήνυση' : 'Διαβιβαστικό προς την Υπηρεσία');
    return rows.sort((a, b) => a.d.localeCompare(b.d) || a.k - b.k);
  };
  
  const evText = (r) => `${r.t} στις ${sd(r.d)}` + (r.res ? ` (${r.res})` : '') + (r.note ? ` (${r.note})` : '');

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
    if (['pol_rem','pol_ret','to_return','transmittal','complaint'].includes(s)) return (k > 0 ? 'εκκρεμεί από ' + sd(d) + ' · ' + k + ' ημ.' : 'από σήμερα');
    return (k === 0 ? 'σήμερα' : 'έως ' + sd(d) + (k < 0 ? ' · σε ' + (-k) + ' ημ.' : ''));
  };
  
  const stepper = (c) => {
    const rem = c.removalDays > 0 || !!c.dates.susp;
    const S = rem ? ['Επικοινωνία', 'Πρόσκληση', 'Ραντεβού', 'Αφαίρεση', 'Απόδοση', 'Διαβίβαση'] : ['Επικοινωνία', 'Πρόσκληση', 'Ραντεβού', 'Διαβίβαση'];
    const M = { search: 0, to_call: 0, informed: 0, pol_rem: 3, pol_ret: 4, appointment: 2, suspended: 3, to_return: 4, transmittal: 5, complaint: 5 };
    let i = /^inv/.test(c.state) ? 1 : (M[c.state] === undefined ? 0 : M[c.state]);
    if (!rem && i > 3) i = 3;
    if (c.state === 'closed') i = S.length;
    const bar = S.map((l, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join('');
    const cap = c.state === 'closed' ? 'Ολοκληρώθηκε' : (i + 1) + '/' + S.length + ' · ' + S[i] + (i === 1 ? ' (' + invDone(c) + '/3)' : '');
    return `<div class="steps"><div class="bar">${bar}</div><span>${esc(cap)}</span></div>`;
  };

  // ---------- UI Components ----------
  const pendingLabel = (c) => {
    const s = c.state;
    if (s === 'closed') return '';
    if (s === 'search') return 'Εκκρεμεί αναζήτηση τηλεφώνου';
    if (s === 'to_call') return 'Εκκρεμεί κλήση';
    if (s === 'informed') return 'Αναμονή 5 ημερών για πρόσκληση';
    if (s === 'appointment') return c.removalDays > 0 ? 'Εκκρεμεί αφαίρεση διπλώματος' : 'Εκκρεμεί παραλαβή εγγράφου';
    if (s === 'suspended') return 'Αναμονή λήξης αφαίρεσης';
    if (s === 'to_return') return 'Εκκρεμεί απόδοση διπλώματος';
    if (s === 'pol_rem') return 'Εκκρεμεί καταχώρηση POL (αφαίρεση)';
    if (s === 'pol_ret') return 'Εκκρεμεί καταχώρηση POL (απόδοση)';
    
    const m = /^inv(\d)_(create|next|sent|wait)$/.exec(s);
    if (m) {
      const n = m[1], type = m[2];
      if (type === 'create') return `Εκκρεμεί δημιουργία ${n}ης πρόσκλησης`;
      if (type === 'next') return `Εκκρεμεί αποστολή ${n}ης πρόσκλησης`;
      if (type === 'sent') return `Εκκρεμεί παραλαβή ${n}ου αποδεικτικού`;
      if (type === 'wait') return `Αναμονή 10ημ. (${n}ο)`;
    }
    
    if (s === 'transmittal') return 'Εκκρεμεί διαβιβαστικό';
    if (s === 'complaint') return 'Εκκρεμεί μήνυση';
    return (ST[s] || {}).l || '';
  };

  const cardMini = (c, alertClass = '') => {
    const s = ST[c.state] || { l: 'Άγνωστη', t: 'bad' };
    const nl = pendingLabel(c);
    const wt = whenText(c);
    const badgeClass = s.t === 'bad' ? 'bad' : s.t === 'warn' ? 'warn' : '';
    return `
      <div class="card-mini ${alertClass}" data-id="${c.id}">
        <div class="card-header" style="margin-bottom: 8px;">
          <div style="font-weight:700; font-size:16px;">${esc(c.plate)} <span style="font-weight:400; color:var(--mut); font-size:14px;">${esc(c.name)}</span></div>
          <div class="badge ${badgeClass}">${s.l}</div>
        </div>
        ${nl ? `<div class="next-action">
          <div style="display:flex; justify-content:space-between; align-items:center; gap: 8px;">
            <strong style="font-weight:500; color:var(--ink); font-size:14px;">${esc(nl)}</strong>
            <span style="color:var(--mut); font-size:13px; text-align:right; white-space:nowrap;">${esc(wt)}</span>
          </div>
        </div>` : (wt ? `<div class="next-action"><span>${esc(wt)}</span></div>` : '')}
      </div>
    `;
  };

  // ---------- Render Router ----------
  const render = () => {
    tick();
    updateNav();
    if (currentView === 'today') renderToday();
    if (currentView === 'cases') renderCases();
    if (currentView === 'detail') renderDetail();
  };

  const updateNav = () => {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === currentView);
    });
    $('#headerTitle').textContent = currentView === 'today' ? 'Σήμερα' : currentView === 'cases' ? 'Υποθέσεις' : currentView === 'menu' ? 'Μενού' : 'Υπόθεση';
    $('#btnBack').classList.toggle('hidden', currentView !== 'detail');
  };

  const goTo = (v) => {
    currentView = v;
    if (v !== 'detail') currentDetailId = null; 
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    if (v === 'detail') $('#view-detail').classList.remove('hidden');
    else $(`#view-${v}`).classList.remove('hidden');
    render();
  };

  const openDetail = (id) => {
    currentDetailId = id;
    goTo('detail');
  };

  // ---------- Render: ΣΗΜΕΡΑ ----------
  const renderToday = () => {
    const tToday = todayStr();
    const polCases = [], urgentCases = [];
    
    cases.forEach(c => {
      if (c.state === 'closed') return;
      if (c.state === 'pol_rem' || c.state === 'pol_ret') {
        polCases.push(c);
      } else {
        const due = dueOf(c);
        if (due && due <= tToday) urgentCases.push(c);
        else if (isSoon(c)) urgentCases.push(c);
      }
    });

    const prio = (c) => {
      const s = c.state;
      if (s === 'to_return') return 1;
      if (s === 'transmittal' || s === 'complaint') return 2;
      if (/^inv\d_(create|next)/.test(s)) return 3;
      if (s === 'search' || s === 'to_call') return 4;
      return 5;
    };
    urgentCases.sort((a,b) => prio(a) - prio(b));

    $('#statTodayTitle').textContent = (polCases.length + urgentCases.length) + ' ενέργειες';
    
    $('#today-pol-section').classList.toggle('hidden', polCases.length === 0);
    $('#today-pol-list').innerHTML = polCases.map(c => cardMini(c, 'pol-alert')).join('');

    $('#today-actions-section').classList.toggle('hidden', urgentCases.length === 0);
    $('#today-actions-list').innerHTML = urgentCases.map(c => cardMini(c, 'urgent-alert')).join('');
    
    $('#today-empty').classList.toggle('hidden', polCases.length > 0 || urgentCases.length > 0);
  };

  // ---------- Render: ΥΠΟΘΕΣΕΙΣ ----------
  const renderCases = () => {
    const fm = {}; cases.forEach(c => { const f = c.folder || '(χωρίς φάκελο)'; fm[f] = (fm[f] || 0) + 1; });
    
    let fHtml = `<button class="chip${folderF === 'all' ? ' on' : ''}" data-folder="all">Όλοι</button>`;
    fHtml += Object.keys(fm).sort().map(f => `<button class="chip${folderF === f ? ' on' : ''}" data-folder="${esc(f)}">${esc(f)}</button>`).join('');
    $('#folderFilters').innerHTML = fHtml;
      
    const sc = {}; cases.forEach(c => sc[c.state] = (sc[c.state] || 0) + 1);
    const ic = { 1: 0, 2: 0, 3: 0 }; cases.forEach(c => { const n = invDone(c); if (n && c.state !== 'closed') ic[n]++; });
    
    let sHtml = `<button class="chip${stateF === 'all' ? ' on' : ''}" data-state="all">Όλα</button>`;
    sHtml += `<button class="chip${stateF === 'today' ? ' on' : ''}" data-state="today">Σήμερα</button>`;
    sHtml += `<button class="chip${stateF === 'pol' ? ' on' : ''}" data-state="pol">POL</button>`;
    sHtml += [1, 2, 3].filter(n => ic[n]).map(n => `<button class="chip${stateF === 'inv:' + n ? ' on' : ''}" data-state="inv:${n}">${n} Πρόσκληση</button>`).join('');
    sHtml += Object.keys(ST).filter(k => sc[k]).map(k => `<button class="chip${stateF === k ? ' on' : ''}" data-state="${k}">${ST[k].l}</button>`).join('');
    $('#stateFilters').innerHTML = sHtml;

    const ql = fold(q).trim();
    const stOk = (c) => stateF === 'all' || (stateF === 'today' ? (c.state === 'pol_rem' || c.state === 'pol_ret' || dueOf(c) <= todayStr()) : stateF === 'pol' ? (c.state === 'pol_rem' || c.state === 'pol_ret')
      : stateF.startsWith('inv:') ? (c.state !== 'closed' && invDone(c) === Number(stateF.slice(4))) : c.state === stateF);
    const hay = (c) => fold([c.name, c.plate, c.folder, c.phone, c.service, fmt(c.receivedDate), ...Object.values(c.dates || {}).filter(v => /^\d{4}-\d{2}-\d{2}$/.test(v)).map(fmt)].join(' '));
    
    const list = cases.filter(c => (folderF === 'all' || (c.folder || '(χωρίς φάκελο)') === folderF) && stOk(c) && (!ql || hay(c).includes(ql)))
      .sort((a, b) => (b.receivedDate || '').localeCompare(a.receivedDate || ''));

    $('#casesList').innerHTML = list.map(c => cardMini(c)).join('') || '<div class="empty">Δεν βρέθηκαν υποθέσεις.</div>';
  };

  // ---------- Render: ΛΕΠΤΟΜΕΡΕΙΕΣ ----------
  const renderDetail = () => {
    const c = get(currentDetailId);
    if (!c) { goTo('cases'); return; }
    
    const s = ST[c.state] || { l: 'Άγνωστη', t: 'bad' }, a = ACT[c.state];
    const badgeClass = s.t === 'bad' ? 'bad' : s.t === 'warn' ? 'warn' : '';
    const pls = c.state === 'closed' ? [] : phoneList(c.phone);
    
    let actionsHTML = '';
    if (a) actionsHTML += `<button class="btn-action primary" data-act="${c.state}" data-id="${c.id}">${a[0]}</button>`;
    (ACT2[c.state] || []).filter(x => !x[2] || x[2](c)).forEach((x, i) => {
      actionsHTML += `<button class="btn-action secondary" data-act2="${i}" data-id="${c.id}">${x[0]}</button>`;
    });
    if (c.state !== 'closed' && !c.dates.oos) actionsHTML += `<button class="btn-action secondary" data-oos="${c.id}">Εκτός αρμοδιότητας</button>`;

    const tl = timeline(c);
    
    $('#detailContent').innerHTML = `
      <div class="detail-header">
        <h1 class="detail-plate">${esc(c.plate)}</h1>
        <h2 class="detail-name">${esc(c.name)}</h2>
        <div class="detail-badge ${badgeClass}">${s.l}</div>
      </div>
      
      <div class="detail-info">
        <div class="detail-info-item">
          <small>Τηλέφωνο</small>
          <strong>${pls.length ? pls.map(x => `<a href="${telHref(x)}" style="color:var(--warn); text-decoration:none;">${esc(x)}</a>`).join(', ') : '—'}</strong>
        </div>
        <div class="detail-info-item">
          <small>Φάκελος</small>
          <strong>${esc(c.folder || '—')}</strong>
        </div>
        <div class="detail-info-item">
          <small>Πρόστιμο</small>
          <strong>${c.fine ? esc(c.fine) + ' €' : '—'}</strong>
        </div>
        <div class="detail-info-item">
          <small>Αφαίρεση</small>
          <strong>${c.removalDays ? c.removalDays + ' ημέρες' : '—'}</strong>
        </div>
      </div>

      <div class="stepper-wrap">
        ${stepper(c)}
      </div>

      <div class="detail-actions">
        ${actionsHTML}
      </div>

      <div class="section">
        <h3 class="section-title">Ιστορικό</h3>
        <div class="hist">
          ${tl.map(r => `<div class="hi">${esc(evText(r))}</div>`).join('') || '<div class="empty">Καμία ενέργεια.</div>'}
        </div>
      </div>
      
      <div class="section">
        <button class="btn ghost full" data-edit="${c.id}">Επεξεργασία Στοιχείων</button>
      </div>
    `;
  };

  // ---------- Global Event Delegation ----------
  document.body.addEventListener('click', (e) => {
    const nav = e.target.closest('.nav-item');
    if (nav) { goTo(nav.dataset.view); return; }
    if (e.target.closest('#btnBack')) { goTo('cases'); return; }
    const card = e.target.closest('.card-mini');
    if (card && card.dataset.id) { openDetail(card.dataset.id); return; }
    const fChip = e.target.closest('[data-folder]');
    if (fChip) { folderF = fChip.dataset.folder; renderCases(); return; }
    const sChip = e.target.closest('[data-state]');
    if (sChip) { stateF = sChip.dataset.state; renderCases(); return; }
    const btnAct = e.target.closest('[data-act]');
    if (btnAct) {
      const c = get(btnAct.dataset.id);
      const act = ACT[btnAct.dataset.act];
      if (c && act) act[1](c);
      return;
    }
    const btnAct2 = e.target.closest('[data-act2]');
    if (btnAct2) {
      const c = get(btnAct2.dataset.id);
      const arr = (ACT2[c.state] || []).filter(x => !x[2] || x[2](c));
      const act = arr[Number(btnAct2.dataset.act2)];
      if (c && act) act[1](c);
      return;
    }
    const btnOos = e.target.closest('[data-oos]');
    if (btnOos) {
      const c = get(btnOos.dataset.oos);
      if (c) actOOS(c);
      return;
    }
    const btnEdit = e.target.closest('[data-edit]');
    if (btnEdit) {
      openForm(btnEdit.dataset.edit);
      return;
    }
  });

  // ---------- Φόρμα & Modals ----------
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
    } else if (v && !/^[ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ]{3}[0-9]{4}$/.test(v)) msg = 'Η πινακίδα δεν έχει τη μορφή ΑΑΑ1234.';
    w.textContent = msg; w.style.display = msg ? 'block' : 'none';
  };
  E.plate.addEventListener('input', (e) => {
    const el = e.target; el.value = normPlate(el.value); checkPlate(el.value);
  });

  const DF = { phone:'d_phone', appt:'d_appt', susp:'d_susp', return:'d_return', inv1Create:'d_inv1Create', inv1Send:'d_inv1Send', inv1Proof:'d_inv1Proof', inv2Create:'d_inv2Create', inv2Send:'d_inv2Send', inv2Proof:'d_inv2Proof', inv3Create:'d_inv3Create', inv3Send:'d_inv3Send', inv3Proof:'d_inv3Proof', searchNone:'d_searchNone', callRes:'d_callRes', docRecv:'d_docRecv', returned:'d_returned', polRem:'d_polRem', polRet:'d_polRet', closed:'d_closed', closedKind:'d_closedKind', oos:'d_oos', oosDest:'d_oosDest', oosReason:'d_oosReason' };
  (() => {
    const adv = E.d_phone.closest('.grid');
    const mk = (name, label, opts) => { if (E[name]) return; const l = document.createElement('label'); l.innerHTML = label + (opts === 'text' ? `<input type="text" name="${name}">` : opts ? `<select name="${name}">${opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>` : `<input type="date" name="${name}">`); adv.appendChild(l); };
    mk('d_callRes', 'Αποτέλεσμα κλήσης', [['', '—'], ['noanswer', 'Δεν απάντησε'], ['informed', 'Ενημερώθηκε'], ['booked', 'Έκλεισε ραντεβού'], ['refused', 'Αρνήθηκε']]);
    mk('d_searchNone', 'Δεν βρέθηκε τηλέφωνο (ημ.)');
    [1, 2, 3].forEach(n => mk('d_inv' + n + 'Create', n + 'η Δημιουργία'));
    mk('d_docRecv', 'Παραλαβή εγγράφου (χωρίς αφαίρεση)'); mk('d_returned', 'Απόδοση διπλώματος');
    mk('d_polRem', 'POL αφαίρεσης'); mk('d_polRet', 'POL απόδοσης'); mk('d_closed', 'Κλείσιμο υπόθεσης');
    mk('d_closedKind', 'Είδος κλεισίματος', [['', '—'], ['transmittal', 'Διαβιβαστικό'], ['complaint', 'Μήνυση']]);
    mk('d_oos', 'Εκτός αρμοδιότητας (ημ.)'); mk('d_oosDest', 'Υπηρεσία προορισμού', 'text'); mk('d_oosReason', 'Αιτιολογία', 'text');
  })();

  const openForm = (id) => {
    const c = id ? get(id) : null;
    F.reset(); F.dataset.id = id || '';
    $('#formTitle').textContent = c ? 'Επεξεργασία' : 'Νέα Υπόθεση';
    $('#btnFormDelete').hidden = !c;
    folderOpts(c ? c.folder : '');
    
    if (c) {
      E.plate.value = c.plate; E.name.value = c.name; E.service.value = c.service || ''; E.phone.value = c.phone || '';
      E.receivedDate.value = c.receivedDate;
      if (VIOL.includes(c.violationType)) E.violationType.value = c.violationType;
      else if (c.violationType) { E.violationType.value = 'custom'; E.violationOther.value = c.violationType; }
      E.fine.value = c.fine || ''; E.removalDays.value = c.removalDays || ''; E.notes.value = c.notes || '';
      Object.entries(DF).forEach(([k, n]) => { if (E[n]) E[n].value = c.dates[k] || ''; });
      if (c.folder && $('#fFolder').value === '') { $('#fFolder').value = 'custom'; E.folderCustom.value = c.folder; }
      checkPlate(c.plate);
    } else {
      E.receivedDate.value = todayStr();
      $('#plateWarning').style.display = 'none';
    }
    toggles();
    dlgF.showModal();
  };

  F.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = F.dataset.id || uid(), old = get(id);
    const folder = E.folderSelect.value === 'custom' ? E.folderCustom.value.trim().toUpperCase() : E.folderSelect.value;
    const days = Number(E.removalDays.value) || 0, req = days > 0;
    
    const D = { ...(old ? old.dates : BLANK_DATES) };
    if (old) Object.entries(DF).forEach(([k, n]) => { if (E[n]) D[k] = E[n].value; });
    
    if (D.susp && !days) { alert('Συμπλήρωσε τις ημέρες αφαίρεσης.'); return; }
    if (D.returned && !D.susp) { alert('Η απόδοση προϋποθέτει αφαίρεση.'); return; }
    if (D.polRem && !D.susp) { alert('Το POL αφαίρεσης προϋποθέτει αφαίρεση.'); return; }
    if (D.polRet && !D.returned) { alert('Το POL απόδοσης προϋποθέτει απόδοση.'); return; }
    if (D.oos && !String(D.oosDest || '').trim()) { alert('Συμπλήρωσε την υπηρεσία προορισμού.'); return; }
    D.closedKind = D.closed ? (D.closedKind || 'transmittal') : '';
    if (D.susp && days) D.return = addDays(D.susp, days);
    
    const rec = {
      id, plate: normPlate(E.plate.value), name: E.name.value.trim().toUpperCase(), service: E.service.value.trim().toUpperCase(),
      phone: E.phone.value.trim(), receivedDate: E.receivedDate.value, folder,
      violationType: E.violationType.value === 'custom' ? E.violationOther.value.trim().toUpperCase() : E.violationType.value,
      fine: E.fine.value.trim(), requiresLicense: req, removalDays: days, notes: E.notes.value.trim().toUpperCase(),
      state: old ? old.state : 'search', history: old ? (old.history || []) : [], ev: old ? (old.ev || []) : [], 
      dates: D, flags: old ? (old.flags || []) : [], schema: 4
    };
    reconcile(rec);
    if (old) cases[cases.indexOf(old)] = rec;
    else cases.unshift(rec);
    save(); dlgF.close(); render();
  });

  $('#btnFormCancel').onclick = () => dlgF.close();
  $('#btnFormDelete').onclick = () => { if (confirm('Διαγραφή;')) { cases = cases.filter(x => x.id !== F.dataset.id); save(); dlgF.close(); goTo('cases'); } };
  
  $('#btnExport').onclick = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(cases, null, 2)], { type: 'application/json' }));
    a.download = 'ypotheseis_' + todayStr() + '.json'; a.click(); localStorage.setItem('last_backup', Date.now());
  };

  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const text = String(ev.target.result || '').replace(/^\uFEFF/, '');
        if (text.includes('"manifest_version"')) throw new Error('Επιλέξατε manifest.json.');
        const parsed = JSON.parse(text);
        let arr = Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray);
        if (!arr || !arr.length) throw new Error('Δεν βρέθηκαν υποθέσεις.');
        if (!confirm(`Επαναφορά ${arr.length} υποθέσεων;`)) return;
        localStorage.setItem('troxonomika_before_restore', localStorage.getItem(KEY));
        cases = arr.map(migrate); tick(); save(); render();
        alert('Επιτυχής επαναφορά.');
      } catch (err) { alert('Σφάλμα: ' + err.message); }
      e.target.value = '';
    };
    r.readAsText(file);
  };

  $('#btnPrint').onclick = () => {
    let h = `<h1>ΚΑΤΑΣΤΑΣΗ ΥΠΟΘΕΣΕΩΝ</h1><table><thead><tr><th>Α/Α</th><th>Πινακίδα</th><th>Ονοματεπώνυμο</th><th>Τηλέφωνο</th><th>Κατάσταση</th><th>Φάκελος</th></tr></thead><tbody>`;
    cases.forEach((c, i) => { h += `<tr><td>${i + 1}</td><td><b>${esc(c.plate)}</b></td><td>${esc(c.name)}</td><td>${esc(c.phone || '—')}</td><td>${(ST[c.state] || {}).l || '—'}</td><td>${esc(c.folder || '—')}</td></tr>`; });
    $('#printArea').innerHTML = h + '</tbody></table>'; print();
  };

  // ---------- Init ----------
  $('#searchInput').oninput = (e) => { q = e.target.value; if (currentView === 'cases') renderCases(); };
  
  load(); render();
  setInterval(() => { tick(); render(); }, 60000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();