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
    complaint:   { l: 'Προς Μήνυση', t: 'bad', a: 'Υποβολή μήνυσης' },
    closed:      { l: 'Ολοκληρωμένη', t: 'ok', a: '' }
  };
  const URG = ['no_show','to_return','transmittal','complaint','inv1_create','inv2_create','inv3_create','inv1_next','inv2_next','inv3_next'];
  const BANNER = {
    no_show: 'Μη προσέλευση',
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
  const BLANK_DATES = { phone:'', appt:'', susp:'', return:'', inv1Send:'', inv1Proof:'', inv2Send:'', inv2Proof:'', inv3Send:'', inv3Proof:'', inv1Create:'', inv2Create:'', inv3Create:'', returned:'', closed:'' };

  let cases = [], folderF = 'all', stateF = 'all', q = '';

  // ---------- Utilities ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const todayStr = () => iso(new Date());
  const fmt = v => v ? new Date(v + 'T12:00:00').toLocaleDateString('el-GR') : '—';
  const sd = (v) => { if (!v) return '—'; const [y, m, d] = v.split('-'); return d + '/' + m + (y !== String(new Date().getFullYear()) ? '/' + y : ''); };
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
  
  const step3 = (c) => { c.ev = buildEv(c); c.schema = 3; return c; };
  
  const upgrade = (c) => {
    if (c.schema >= 3) return c;
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
  const migrate = (o) => upgrade(migrateBase(o));

  // ---------- ΑΣΦΑΛΗΣ ΑΥΤΟΜΑΤΗ ΔΙΟΡΘΩΣΗ ----------
  const repairAllCases = (silent = true) => {
    let repaired = 0;
    const today = todayStr();
    cases.forEach(c => {
      if (!c.dates) c.dates = { ...BLANK_DATES };
      const D = c.dates;
      let newState = c.state;

      // Ελέγχουμε μόνο αν έχει περάσει ο χρόνος από την τρέχουσα κατάσταση
      if (c.state === 'informed' && D.phone && isDue(addDays(D.phone, 5))) newState = 'inv1_create';
      else if (c.state === 'appointment' && D.appt && isDue(addDays(D.appt, 5))) newState = 'no_show';
      else if (c.state === 'suspended' && D.return && isDue(D.return)) newState = 'to_return';
      else if (c.state === 'inv1_wait' && D.inv1Proof && isDue(addDays(D.inv1Proof, 10))) newState = 'inv2_create';
      else if (c.state === 'inv2_wait' && D.inv2Proof && isDue(addDays(D.inv2Proof, 10))) newState = 'inv3_create';
      else if (c.state === 'inv3_wait' && D.inv3Proof && isDue(addDays(D.inv3Proof, 10))) newState = endState(c);

      if (c.state !== newState) {
        c.state = newState;
        c.history = c.history || [];
        c.history.push({ date: todayStr(), action: `ΑΥΤΟΜΑΤΗ ΜΕΤΑΒΑΣΗ: ${ST[newState]?.l || newState}` });
        repaired++;
      }
      setMove(c);
    });
    if (repaired > 0) {
      save();
      if (!silent) alert(`Ενημερώθηκαν αυτόματα ${repaired} υποθέσεις λόγω παρέλευσης προθεσμίας.`);
    }
  };

  const load = () => {
    try {
      const cur = localStorage.getItem(KEY);
      if (cur) { 
        cases = (JSON.parse(cur) || []).map(migrate); 
        repairAllCases(true);
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
        repairAllCases(true);
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

  // ---------- State Machine (Ticker) ----------
  const tick = () => {
    let ch = false;
    cases.forEach(c => {
      const D = c.dates, s = c.state; let n = s;
      if (s === 'informed' && isDue(addDays(D.phone, 5))) n = 'inv1_create';
      else if (s === 'appointment' && isDue(addDays(D.appt, 5))) n = 'no_show';
      else if (s === 'suspended' && isDue(D.return)) n = 'to_return';
      else if (s === 'inv1_wait' && isDue(addDays(D.inv1Proof, 10))) n = 'inv2_create';
      else if (s === 'inv2_wait' && isDue(addDays(D.inv2Proof, 10))) n = 'inv3_create';
      else if (s === 'inv3_wait' && isDue(addDays(D.inv3Proof, 10))) n = endState(c);
      if (n !== s) { if (n === 'no_show') ev(c, D.appt, 'Δεν προσήλθε στο ραντεβού'); c.state = n; setMove(c); ch = true; }
    });
    if (ch) save();
  };

  const go = (c, state, extra, log) => {
    c.state = state;
    Object.assign(c.dates, extra || {});
    if (log) ev(c, log[0], log[1], log[2]);
    if (state === 'suspended' && c.dates.susp && c.removalDays) {
      c.dates.return = addDays(c.dates.susp, c.removalDays);
    }
    setMove(c); save(); render();
  };

  // ---------- Wizard ----------
  const dlgW = $('#dlgWizard');
  const wiz = (title, desc, body, btns) => {
    $('#wT').textContent = title; $('#wD').textContent = desc || ''; $('#wB').innerHTML = body || '';
    const a = $('#wA'); a.innerHTML = '';
    btns.concat([{ t: 'Άκυρο', c: 'ghost' }]).forEach(b => {
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
  const actSearch = (c) => wiz('Αναζήτηση τηλεφώνου', 'Βρέθηκε τηλέφωνο;', '', [
    { t: 'Όχι, δεν βρέθηκε', c: 'bad', f: () => go(c, 'inv1_create', {}, [todayStr(), 'Αναζήτηση τηλεφώνου', 'δεν βρέθηκε']) },
    { t: 'Ναι', c: 'ok', f: () => wiz('Εισαγωγή τηλεφώνου', 'Πληκτρολογήστε τον αριθμό:', '<input type="tel" id="wV">',
      [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value.trim(), f: () => { const p = $('#wV').value.trim(); c.phone = p; go(c, 'to_call', {}, [todayStr(), 'Αναζήτηση τηλεφώνου', 'βρέθηκε (' + p + ')']); } }]) }
  ]);

  const toCreate = (c, label, res) => go(c, 'inv1_create', {}, [todayStr(), label, res]);
  const callOutcome = (c) => wiz('Αποτέλεσμα κλήσης', 'Έκλεισε ραντεβού;', '', [
    { t: 'Έκλεισε ραντεβού', c: 'ok', f: () => dateWiz('Ημερομηνία ραντεβού', 'Επιλέξτε ημερομηνία:', v => go(c, 'appointment', { appt: v, phone: c.dates.phone || todayStr() }, [todayStr(), 'Κλήση', 'ραντεβού στις ' + sd(v)])) },
    { t: 'Θα καλέσει ο ίδιος (αναμονή 5 ημ.)', f: () => go(c, 'informed', { phone: todayStr() }, [todayStr(), 'Κλήση', 'ενημερώθηκε, θα καλέσει ο ίδιος']) },
    { t: 'Αρνήθηκε ή αναβάλλει', c: 'bad', f: () => toCreate(c, 'Κλήση', 'αρνήθηκε ή αναβάλλει') }
  ]);
  const actCall = (c) => wiz('Καταχώρηση κλήσης', 'Απάντησε ο πολίτης;', '', [
    { t: 'Όχι', c: 'bad', f: () => toCreate(c, 'Κλήση', 'δεν απάντησε') },
    { t: 'Ναι', c: 'ok', f: () => callOutcome(c) }
  ]);

  const actAppt = (c) => dateWiz('Ραντεβού', 'Ημερομηνία ραντεβού:', v => go(c, 'appointment', { appt: v }, c.state === 'informed' ? [todayStr(), 'Επικοινώνησε ο πολίτης', 'ραντεβού στις ' + sd(v)] : [todayStr(), 'Αλλαγή ραντεβού', 'νέο ραντεβού στις ' + sd(v)]));

  const actRemoval = (c) => wiz('Αφαίρεση διπλώματος', 'Ημερομηνία αφαίρεσης και ημέρες:',
    `<input type="date" id="wV" value="${todayStr()}"><input type="number" id="wN" min="1" value="${c.removalDays || 30}">`,
    [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value && Number($('#wN').value) > 0, f: () => {
      const d = $('#wV').value, n = Number($('#wN').value);
      c.removalDays = n; c.requiresLicense = true; c.flags = [...new Set([...(c.flags || []), 'pol_rem'])];
      go(c, 'suspended', { susp: d }, null);
    } }]);

  const actDeliver = (c) => dateWiz('Απόδοση διπλώματος', 'Ημερομηνία απόδοσης:', v => {
    c.flags = [...new Set([...(c.flags || []), 'pol_ret'])];
    go(c, 'transmittal', { returned: v }, null);
  });
  
  const createInv = (c, n) => dateWiz(`Δημιουργία ${n}ης πρόσκλησης`, 'Ημερομηνία δημιουργίας:',
    v => go(c, `inv${n}_next`, { ['inv' + n + 'Create']: v }, null));
  const actContact = (c) => dateWiz('Ο πολίτης επικοινώνησε', 'Ημερομηνία ραντεβού:',
    v => go(c, 'appointment', { appt: v, phone: c.dates.phone || todayStr() }, [todayStr(), 'Επικοινώνησε ο πολίτης', 'ραντεβού στις ' + sd(v)]));
  const actReceived = (c) => dateWiz('Παραλαβή εγγράφου', 'Ημερομηνία παραλαβής (χωρίς αφαίρεση):',
    v => go(c, 'transmittal', {}, [v, 'Παραλαβή εγγράφου από τον πολίτη (χωρίς αφαίρεση)']));
  const actTransmit = (c) => dateWiz('Διαβιβαστικό', 'Ημερομηνία αποστολής στην Υπηρεσία:',
    v => go(c, 'closed', { closed: v }, [v, 'Διαβιβαστικό προς την Υπηρεσία']));
  const actComplaint = (c) => dateWiz('Μήνυση', 'Ημερομηνία υποβολής μήνυσης:',
    v => go(c, 'closed', { closed: v }, [v, 'Μήνυση']));
  
  const invite = (c, n) => dateWiz(`Αποστολή ${n}ης πρόσκλησης`, 'Ημερομηνία αποστολής:',
    v => go(c, `inv${n}_sent`, { ['inv' + n + 'Send']: v }, null));
    
  const proof = (c, n) => dateWiz(`Αποδεικτικό ${n}ης`, 'Ημερομηνία παραλαβής:',
    v => go(c, `inv${n}_wait`, { ['inv' + n + 'Proof']: v }, null));

  const ACT = {
    search: ['Αναζήτηση τηλεφώνου', actSearch], to_call: ['Καταχώρηση κλήσης', actCall],
    informed: ['Κλείσιμο ραντεβού', actAppt],
    appointment: ['Πραγματοποιήθηκε αφαίρεση', actRemoval], no_show: ['Δημιουργία 1ης πρόσκλησης', c => createInv(c, 1)],
    to_return: ['Απόδοση διπλώματος', actDeliver],
    inv1_create: ['Δημιουργία 1ης πρόσκλησης', c => createInv(c, 1)], inv1_next: ['Αποστολή 1ης πρόσκλησης', c => invite(c, 1)], inv1_sent: ['Ήρθε αποδεικτικό 1ης', c => proof(c, 1)],
    inv2_create: ['Δημιουργία 2ης πρόσκλησης', c => createInv(c, 2)], inv2_next: ['Αποστολή 2ης πρόσκλησης', c => invite(c, 2)], inv2_sent: ['Ήρθε αποδεικτικό 2ης', c => proof(c, 2)],
    inv3_create: ['Δημιουργία 3ης πρόσκλησης', c => createInv(c, 3)], inv3_next: ['Αποστολή 3ης πρόσκλησης', c => invite(c, 3)], inv3_sent: ['Ήρθε αποδεικτικό 3ης', c => proof(c, 3)],
    transmittal: ['Δημιουργήθηκε και στάλθηκε το διαβιβαστικό', actTransmit], complaint: ['Υποβλήθηκε η μήνυση', actComplaint]
  };
  const ACT2 = { appointment: [['Παρέλαβε έγγραφο (χωρίς αφαίρεση)', actReceived]] };
  ['inv1_create','inv1_next','inv1_sent','inv1_wait','inv2_create','inv2_next','inv2_sent','inv2_wait','inv3_create','inv3_next','inv3_sent','inv3_wait']
    .forEach(k => { ACT2[k] = [['Ο πολίτης επικοινώνησε', actContact]]; });
  const FLAG = { pol_rem: 'Έγινε η καταχώρηση POL (αφαίρεση)', pol_ret: 'Έγινε η καταχώρηση POL (απόδοση)' };

  // ---------- Render ----------
  let pc = {};
  const isSoon = (c) => c.state === 'suspended' && !!c.dates.return && plus(todayStr(), 3) >= c.dates.return;
  const urgent = (c) => URG.includes(c.state) || isSoon(c) || (c.flags || []).length > 0;
  const timeline = (c) => {
    const D = c.dates, rows = [];
    if (c.receivedDate) rows.push({ d: c.receivedDate, k: 0, t: 'Παραλαβή εγγράφου' });
    (c.ev || []).forEach((e, i) => { if (e.d) rows.push({ d: e.d, k: 5, i, t: e.t, res: e.r }); });
    [1, 2, 3].forEach(n => {
      if (D['inv' + n + 'Create']) rows.push({ d: D['inv' + n + 'Create'], k: 10, t: `Δημιουργία ${n}ης πρόσκλησης` });
      if (D['inv' + n + 'Send']) rows.push({ d: D['inv' + n + 'Send'], k: 11, t: `Αποστολή ${n}ης πρόσκλησης` });
      if (D['inv' + n + 'Proof']) rows.push({ d: D['inv' + n + 'Proof'], k: 12, t: `Αποδεικτικό ${n}ης πρόσκλησης` });
    });
    if (D.susp) rows.push({ d: D.susp, k: 20, t: 'Αφαίρεση διπλώματος', note: c.removalDays ? c.removalDays + ' ημέρες, απόδοση ' + sd(D.return) : '' });
    if (D.returned) rows.push({ d: D.returned, k: 21, t: 'Απόδοση διπλώματος' });
    return rows.sort((a, b) => a.d.localeCompare(b.d) || a.k - b.k || (a.i || 0) - (b.i || 0));
  };
  const evText = (r) => `${r.t} στις ${sd(r.d)}` + (r.res ? ` (Αποτέλεσμα: ${r.res})` : '') + (r.note ? ` (${r.note})` : '');
  const isTodo = (c) => urgent(c) || !!c.moveTo || c.state === 'search' || c.state === 'to_call';
  const prio = (c) => {
    const s = c.state;
    if (s === 'no_show' || s === 'to_return') return 1;
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
    if ((c.flags || []).some(f => f.startsWith('pol'))) return 'Εκκρεμότητες - Καταχώρηση POL';
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
      default: return ST[c.state].a;
    }
  };

  const card = (c) => {
    const s = ST[c.state] || ST.search, a = ACT[c.state];
    let act = '';
    if (c.state === 'to_call' && c.phone) act += `<a class="btn ghost" href="tel:${esc(c.phone)}">Κλήση ${esc(c.phone)}</a>`;
    if (c.state === 'appointment') act += `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(calLink(c))}">Google Calendar</a>`;
    if (a) act += `<button class="btn pri" data-a="${c.id}">${a[0]}</button>`;
    (ACT2[c.state] || []).forEach((x, i) => { act += `<button class="btn ghost" data-b="${c.id}|${i}">${x[0]}</button>`; });
    (c.flags || []).forEach(f => { act += `<button class="btn ghost" data-fl="${c.id}|${f}">${FLAG[f] || f}</button>`; });
    if (c.moveTo) act += `<button class="btn ghost" data-mv="${c.id}">Μετακινήθηκε στο φάκελο</button>`;
    if (c.state === 'appointment') act += `<button class="btn ghost" data-r="${c.id}">Αλλαγή ραντεβού</button>`;
    
    const tl = timeline(c), lastAction = tl.length ? evText(tl[tl.length - 1]) : '—';
    const pk = normPlate(c.plate), nO = (pc[pk] || 1) - 1;
    const multi = nO ? `<button class="linkbtn" data-p="${esc(pk)}">Άλλες υποθέσεις με την ίδια πινακίδα: ${nO}</button>` : '';

    // Εδώ προσθέτουμε το τηλέφωνο στην κύρια κάρτα
    const phoneHtml = c.phone ? `<div class="info" style="margin-top: 4px;"><a href="tel:${esc(c.phone)}" style="color: var(--warn); font-weight: 600; text-decoration: none;">Τηλέφωνο: ${esc(c.phone)}</a></div>` : '';

    const det = [
      c.folder && `<span><b>Φάκελος:</b> ${esc(c.folder)}</span>`,
      c.fine && `<span><b>Πρόστιμο:</b> ${esc(c.fine)} €</span>`,
      c.removalDays > 0 && `<span><b>Ημέρες αφαίρεσης:</b> ${esc(c.removalDays)}</span>`,
      c.violationType && `<span><b>Είδος παράβασης:</b> ${esc(c.violationType)}</span>`,
      `<span><b>Τελευταία Ενέργεια:</b> ${esc(lastAction)}</span>`
    ].filter(Boolean).join('');
    
    return `<article class="card t-${s.t}">
      <div class="hd"><div><div class="pl">${esc(c.plate)}</div><div class="nm">${esc(c.name)}</div></div><span class="badge">${s.l}</span></div>
      ${infoLine(c) ? `<div class="info">${esc(infoLine(c))}</div>` : ''}
      ${phoneHtml}
      ${multi}
      ${invHTML(c)}${c.moveTo ? `<div class="mv">Μετακίνηση φακέλου: <b>${esc(c.moveTo)}</b></div>` : ''}
      <div class="act">${act}</div>
      <details class="more"><summary>Λεπτομέρειες</summary>
        <div class="det">${det}</div>${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ''}
        <div class="row"><button class="btn" data-e="${c.id}">Επεξεργασία</button><button class="btn" data-h="${c.id}">Ιστορικό (${tl.length})</button></div>
      </details></article>`;
  };

  const render = () => {
    tick();
    
    let total = 0, dueToday = 0, dueSoon = 0, waiting = 0;
    const tToday = todayStr(), tSoon = plus(tToday, 5);
    pc = {}; cases.forEach(c => { const k = normPlate(c.plate); pc[k] = (pc[k] || 0) + 1; });
    cases.forEach(c => {
      if (isTodo(c)) dueToday++;
      if (c.state === 'closed') return;
      total++;
      const dueDate = getCaseDueDate(c);
      if (dueDate && dueDate > tToday && dueDate <= tSoon && !isSoon(c)) dueSoon++;
      if (['informed', 'inv1_wait', 'inv2_wait', 'inv3_wait', 'inv1_sent', 'inv2_sent', 'inv3_sent'].includes(c.state)) waiting++;
    });
    $('#statTotal').textContent = total;
    $('#statDueToday').textContent = dueToday;
    $('#statDueSoon').textContent = dueSoon;
    $('#statWaiting').textContent = waiting;

    const fm = {}; cases.forEach(c => { const f = c.folder || '(χωρίς φάκελο)'; fm[f] = (fm[f] || 0) + 1; });
    $('#folderFilters').innerHTML = chip('f', 'all', 'Όλοι', cases.length, folderF === 'all') +
      Object.keys(fm).sort().map(f => chip('f', f, f, fm[f], folderF === f)).join('');
      
    const sc = {}; cases.forEach(c => sc[c.state] = (sc[c.state] || 0) + 1);
    const ic = { 1: 0, 2: 0, 3: 0 }; cases.forEach(c => { const n = invDone(c); if (n && c.state !== 'closed') ic[n]++; });
    $('#stateFilters').innerHTML = chip('s', 'all', 'Όλα', null, stateF === 'all') +
      chip('s', 'today', 'Τι κάνω σήμερα', dueToday, stateF === 'today') +
      [1, 2, 3].filter(n => ic[n]).map(n => chip('s', 'inv:' + n, n === 1 ? 'Με 1 πρόσκληση' : 'Με ' + n + ' προσκλήσεις', ic[n], stateF === 'inv:' + n)).join('') +
      Object.keys(ST).filter(k => sc[k]).map(k => chip('s', k, ST[k].l, sc[k], stateF === k)).join('');

    const grp = {};
    cases.forEach(c => {
      if (URG.includes(c.state)) grp[c.state] = (grp[c.state] || 0) + 1;
      if (isSoon(c)) grp.soon = (grp.soon || 0) + 1;
      if (c.moveTo) grp.move = (grp.move || 0) + 1;
      (c.flags || []).forEach(f => { grp['flag:' + f] = (grp['flag:' + f] || 0) + 1; });
    });
    const bannerHTML = Object.keys(grp).map(st => {
      return `<button class="banner${/_next$|_create$|^soon$|^flag:|^move$/.test(st) ? ' w' : ''}" data-bf="${esc(st)}">
        <b>${grp[st]} ${esc(BANNER[st] || st)}</b>
        <span>Κλικ για προβολή</span>
      </button>`;
    }).join('');
    $('#banners').innerHTML = bannerHTML;

    const ql = fold(q).trim();
    const stOk = (c) => stateF === 'all' || (stateF === 'today' ? isTodo(c) : stateF === 'soon' ? isSoon(c) : stateF === 'move' ? !!c.moveTo
      : stateF.startsWith('inv:') ? (c.state !== 'closed' && invDone(c) === Number(stateF.slice(4)))
      : stateF.startsWith('flag:') ? (c.flags || []).includes(stateF.slice(5)) : c.state === stateF);
    const hay = (c) => fold([c.name, c.plate, c.folder, c.phone, c.service, fmt(c.receivedDate), ...Object.values(c.dates || {}).filter(Boolean).map(fmt)].join(' '));
    const list = cases.filter(c =>
      (folderF === 'all' || (c.folder || '(χωρίς φάκελο)') === folderF) && stOk(c) && (!ql || hay(c).includes(ql))
    ).sort((a, b) => (stateF === 'today' ? prio(a) - prio(b) : urgent(b) - urgent(a)) || (b.receivedDate || '').localeCompare(a.receivedDate || ''));
    
    $('#casesList').innerHTML = list.map(card).join('') || '<div class="empty">Δεν βρέθηκαν υποθέσεις.</div>';
    
    checkBackup();
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
      
      const D = c.dates;
      E.d_phone.value = D.phone; E.d_appt.value = D.appt; E.d_susp.value = D.susp; E.d_return.value = D.return;
      E.d_inv1Send.value = D.inv1Send; E.d_inv1Proof.value = D.inv1Proof; E.d_inv2Send.value = D.inv2Send;
      E.d_inv2Proof.value = D.inv2Proof; E.d_inv3Send.value = D.inv3Send; E.d_inv3Proof.value = D.inv3Proof;
      
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
    const keep = (v) => old ? v : '';
    
    const D = {
      ...(old ? old.dates : BLANK_DATES),
      phone: keep(E.d_phone.value), appt: keep(E.d_appt.value), susp: keep(E.d_susp.value),
      return: E.d_return.value, inv1Send: keep(E.d_inv1Send.value), inv1Proof: keep(E.d_inv1Proof.value),
      inv2Send: keep(E.d_inv2Send.value), inv2Proof: keep(E.d_inv2Proof.value),
      inv3Send: keep(E.d_inv3Send.value), inv3Proof: keep(E.d_inv3Proof.value), closed: old ? old.dates.closed : ''
    };
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
      state: E.manualState.value,
      history: old ? (old.history || []) : [], ev: old ? (old.ev || []) : [], 
      dates: D, flags: old ? (old.flags || []) : [], schema: 3
    };
    
    rec.moveTo = old ? (old.moveTo || '') : '';
    if (old && old.state !== rec.state) setMove(rec);
    if (rec.moveTo && rec.moveTo === rec.folder) rec.moveTo = '';
    if (old) {
      cases[cases.indexOf(old)] = rec;
    } else {
      cases.unshift(rec);
    }
    save(); render(); dlgF.close();
  });

  // ---------- Events ----------
  $('#casesList').addEventListener('click', (e) => {
    const t = e.target.closest('[data-a],[data-r],[data-e],[data-h]'); 
    if (!t) return;
    const id = t.dataset.a || t.dataset.r || t.dataset.e || t.dataset.h;
    const c = get(id); if (!c) return;
    
    if (t.dataset.a) { const a = ACT[c.state]; if (a) a[1](c); }
    else if (t.dataset.r) actAppt(c);
    else if (t.dataset.e) openForm(c.id);
    else { 
      $('#histBody').innerHTML = timeline(c).map((r, i) => `<div class="hi"><span>${i + 1}. ${esc(evText(r))}</span></div>`).join('') || '<div class="empty">Καμία ενέργεια ακόμα.</div>'; 
      $('#dlgHistory').showModal(); 
    }
  });

  $('#banners').addEventListener('click', (e) => {
    const b = e.target.closest('[data-bf]'); if (!b) return;
    stateF = b.dataset.bf; folderF = 'all'; q = ''; $('#searchInput').value = ''; render();
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#casesList').addEventListener('click', (e) => {
    const t = e.target.closest('[data-b],[data-fl],[data-p],[data-mv]'); if (!t) return;
    if (t.dataset.mv) {
      const m = get(t.dataset.mv);
      if (m && m.moveTo) { m.folder = m.moveTo; m.moveTo = ''; save(); render(); }
      return;
    }
    if (t.dataset.p) { q = t.dataset.p; $('#searchInput').value = q; stateF = 'all'; folderF = 'all'; render(); scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const [id, k] = (t.dataset.b || t.dataset.fl).split('|'), c = get(id); if (!c) return;
    if (t.dataset.b) { const x = (ACT2[c.state] || [])[Number(k)]; if (x) x[1](c); }
    else { c.flags = (c.flags || []).filter(f => f !== k); ev(c, todayStr(), k === 'pol_rem' ? 'Καταχώρηση POL (αφαίρεση)' : 'Καταχώρηση POL (απόδοση)'); setMove(c); save(); render(); }
  });
  $('#folderFilters').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { folderF = b.dataset.f; render(); } });
  $('#stateFilters').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) { stateF = b.dataset.s; render(); } });
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

  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (!Array.isArray(arr)) throw 0;
        if (confirm('Η επαναφορά θα αντικαταστήσει τις τρέχουσες υποθέσεις. Συνέχεια;')) {
          cases = arr.map(migrate); save(); repairAllCases(true); render(); alert('Επιτυχής επαναφορά: ' + cases.length + ' υποθέσεις.');
        }
      } catch { alert('Μη έγκυρο αρχείο.'); }
      e.target.value = '';
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

  $('#statDueToday').closest('.stat').onclick = () => { stateF = 'today'; folderF = 'all'; q = ''; $('#searchInput').value = ''; render(); };
  load(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();