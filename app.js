(() => {
  const KEY = 'troxonomika_final_v23';
  const OLD = [...Array(22)].map((_, i) => 'troxonomika_final_v' + (22 - i))
    .concat(['ypotheseis_pwa_v1','ypotheseis.v1','troxonomika.cases.v1','ypotheseis.v2','ypotheseis_gemini_v1']);

  // ---------- Ρυθμίσεις & Σταθερές ----------
  const ST = {
    search:      { l: 'Προς Αναζήτηση', t: 'info', a: 'Εκκρεμεί αναζήτηση τηλεφώνου' },
    to_call:     { l: 'Προς Κλήση', t: 'info', a: '' },
    informed:    { l: 'Ενημερώθηκε', t: 'warn', a: '' },
    appointment: { l: 'Κλεισμένο Ραντεβού', t: 'info', a: '' },
    no_show:     { l: 'Μη Προσέλευση', t: 'bad', a: 'Δεν προσήλθε στο ραντεβού' },
    suspended:   { l: 'Σε Αφαίρεση', t: 'info', a: '' },
    to_return:   { l: 'Προς Απόδοση', t: 'bad', a: 'Έληξε η αφαίρεση' },
    inv1_next:   { l: 'Προς 1η Πρόσκληση', t: 'warn', a: 'Αποστολή 1ης' },
    inv1_sent:   { l: 'Αναμονή 1ου Αποδεικτικού', t: 'warn', a: '' },
    inv1_wait:   { l: 'Αναμονή 10ημ. (1ο Αποδ.)', t: 'warn', a: '' },
    inv2_next:   { l: 'Προς 2η Πρόσκληση', t: 'warn', a: 'Αποστολή 2ης' },
    inv2_sent:   { l: 'Αναμονή 2ου Αποδεικτικού', t: 'warn', a: '' },
    inv2_wait:   { l: 'Αναμονή 10ημ. (2ο Αποδ.)', t: 'warn', a: '' },
    inv3_next:   { l: 'Προς 3η Πρόσκληση', t: 'warn', a: 'Αποστολή 3ης' },
    inv3_sent:   { l: 'Αναμονή 3ου Αποδεικτικού', t: 'warn', a: '' },
    inv3_wait:   { l: 'Αναμονή 10ημ. (3ο Αποδ.)', t: 'warn', a: '' },
    return_service: { l: 'Επιστροφή στην Υπηρεσία', t: 'bad', a: 'Αποστολή φακέλου στην υπηρεσία' },
    closed:      { l: 'Ολοκληρωμένη', t: 'ok', a: '' }
  };
  const URG = ['no_show','to_return','return_service','inv1_next','inv2_next','inv3_next'];
  const BANNER = { 
    no_show: 'Μη προσέλευση', 
    to_return: 'Προς απόδοση διπλώματος', 
    return_service: 'Επιστροφή στην Υπηρεσία', 
    inv1_next: 'Αποστολή 1ης πρόσκλησης', 
    inv2_next: 'Αποστολή 2ης πρόσκλησης', 
    inv3_next: 'Αποστολή 3ης πρόσκλησης' 
  };
  const FOLDERS = {
    'Τηλέφωνα': ['Με ραντεβού', 'Χωρίς ραντεβού'],
    'Προσκλήσεις': ['1η πρόσκληση', '2η πρόσκληση', '3η πρόσκληση'],
    'Αναμονή αποδεικτικού': ['Αναμονή αποδεικτικού'],
    'Εκκρεμότητες': ['Αναζήτηση τηλεφώνου', 'Αποστολή πρόσκλησης', 'Διαβίβαση σε Υπηρεσία', 'Καταχώρηση POL']
  };
  const VIOL = ['Υπερβολική ταχύτητα','ΚΤΕΟ','Διόδια','Στάθμευση','Απόφαση'];
  const BLANK_DATES = { phone:'', appt:'', susp:'', return:'', inv1Send:'', inv1Proof:'', inv2Send:'', inv2Proof:'', inv3Send:'', inv3Proof:'', closed:'' };

  let cases = [], folderF = 'all', stateF = 'all', q = '';

  // ---------- Utilities ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const todayStr = () => iso(new Date());
  const fmt = v => v ? new Date(v + 'T12:00:00').toLocaleDateString('el-GR') : '—';

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
    if (['1-1', '1-6', '3-25', '5-1', '8-15', '10-28', '12-25', '12-26'].includes(md)) return true;
    const easter = getOrthodoxEaster(y);
    const diff = Math.round((d - easter) / 86400000);
    if ([-48, -2, 1, 50].includes(diff)) return true;
    return false;
  };

  const isWeekend = (dateStr) => {
    const w = new Date(dateStr + 'T12:00:00').getDay();
    return w === 0 || w === 6;
  };

  const isNonWorking = (dateStr) => isWeekend(dateStr) || isHoliday(dateStr);

  const shiftForward = (dateStr) => {
    let d = new Date(dateStr + 'T12:00:00');
    while (isNonWorking(iso(d))) d.setDate(d.getDate() + 1);
    return iso(d);
  };

  const shiftBackward = (dateStr) => {
    let d = new Date(dateStr + 'T12:00:00');
    while (isNonWorking(iso(d))) d.setDate(d.getDate() - 1);
    return iso(d);
  };

  const addDays = (dateStr, days, dir = 'forward') => {
    if (!dateStr) return '';
    let d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + Number(days));
    return dir === 'backward' ? shiftBackward(iso(d)) : shiftForward(iso(d));
  };

  const isDue = (dateStr) => !!dateStr && dateStr <= todayStr();

  // ---------- Αποθήκευση & Migration ----------
  const save = () => localStorage.setItem(KEY, JSON.stringify(cases));
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

  const migrate = (o) => {
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
      state: mapOld(o), history: o.history || [{ date: todayStr(), action: 'Μεταφορά από παλιά έκδοση' }],
      dates: { ...BLANK_DATES,
        phone: o.phoneDate || o.callDate || '', appt: o.apptDate || o.appointmentDate || '',
        susp: o.suspDate || o.removalDate || o.arrivedDate || '', return: o.returnDate || '',
        inv1Send: o.inv1Send || o.invite1Date || o.invite1 || '', inv1Proof: o.inv1Proof || o.proof1 || '',
        inv2Send: o.inv2Send || o.invite2Date || o.invite2 || '', inv2Proof: o.inv2Proof || o.proof2 || '',
        inv3Send: o.inv3Send || o.invite3Date || o.invite3 || '', inv3Proof: o.inv3Proof || o.proof3 || '',
        closed: o.closedDate || '' }
    };
    if (c.dates.susp && c.removalDays && !c.dates.return) c.dates.return = addDays(c.dates.susp, c.removalDays, 'backward');
    return c;
  };

  const load = () => {
    try {
      const cur = localStorage.getItem(KEY);
      if (cur) { cases = (JSON.parse(cur) || []).map(migrate); return; }
    } catch (e) {}
    for (const k of OLD) {
      try {
        const arr = JSON.parse(localStorage.getItem(k) || 'null');
        if (!Array.isArray(arr) || !arr.length) continue;
        cases = arr.map(migrate); save();
        setTimeout(() => alert('Μεταφέρθηκαν ' + cases.length + ' υποθέσεις.'), 400);
        return;
      } catch (e) {}
    }
    cases = [];
  };

  const checkBackup = () => {
    const last = localStorage.getItem('last_backup');
    const warn = $('#backupWarning');
    if (!last || (Date.now() - Number(last)) > 7 * 86400000) {
      warn.style.display = 'flex';
    } else {
      warn.style.display = 'none';
    }
  };

  // ---------- State Machine (Ticker) ----------
  const tick = () => {
    let ch = false;
    cases.forEach(c => {
      const D = c.dates, s = c.state; let n = s;
      if (s === 'informed' && isDue(addDays(D.phone, 5))) n = 'inv1_next';
      else if (s === 'appointment' && isDue(addDays(D.appt, 5))) n = 'no_show';
      else if (s === 'suspended' && isDue(D.return)) n = 'to_return';
      else if (s === 'inv1_wait' && isDue(addDays(D.inv1Proof, 10))) n = 'inv2_next';
      else if (s === 'inv2_wait' && isDue(addDays(D.inv2Proof, 10))) n = 'inv3_next';
      else if (s === 'inv3_wait' && isDue(addDays(D.inv3Proof, 10))) n = 'return_service';
      if (n !== s) { c.state = n; ch = true; }
    });
    if (ch) save();
  };

  const go = (c, state, extra, log) => {
    c.state = state;
    Object.assign(c.dates, extra || {});
    if (log) c.history.push({ date: todayStr(), action: log });
    if (state === 'suspended' && c.dates.susp && c.removalDays) {
      c.dates.return = addDays(c.dates.susp, c.removalDays, 'backward');
    }
    save(); render();
  };

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
  
  const dateWiz = (title, desc, cb) => wiz(title, desc, `<input type="date" id="wV" value="${todayStr()}">`,
    [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value, f: () => cb($('#wV').value) }]);

  // ---------- Ενέργειες ----------
  const actSearch = (c) => wiz('Αναζήτηση τηλεφώνου', 'Βρέθηκε τηλέφωνο;', '', [
    { t: 'Όχι, δεν βρέθηκε', c: 'bad', f: () => go(c, 'inv1_next', {}, 'Δεν βρέθηκε τηλέφωνο -> Πρόσκληση') },
    { t: 'Ναι', c: 'ok', f: () => wiz('Εισαγωγή τηλεφώνου', 'Πληκτρολογήστε τον αριθμό:', '<input type="tel" id="wV">',
      [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value.trim(), f: () => { const p = $('#wV').value.trim(); c.phone = p; go(c, 'to_call', {}, 'Καταχώρηση τηλεφώνου: ' + p); } }]) }
  ]);

  const actCall = (c) => wiz('Καταχώρηση κλήσης', 'Απάντησε ο πολίτης;', '', [
    { t: 'Όχι', c: 'bad', f: () => go(c, 'inv1_next', {}, 'Κλήση χωρίς απάντηση -> Πρόσκληση') },
    { t: 'Ναι', c: 'ok', f: () => wiz('Ραντεβού', 'Έκλεισε ραντεβού;', '', [
      { t: 'Όχι, ενημερώθηκε (αναμονή 5 ημ.)', c: 'bad', f: () => go(c, 'informed', { phone: todayStr() }, 'Ενημερώθηκε. Αναμονή 5 ημερών.') },
      { t: 'Ναι', c: 'ok', f: () => dateWiz('Ημερομηνία ραντεβού', 'Επιλέξτε ημερομηνία:', v => go(c, 'appointment', { appt: v, phone: c.dates.phone || todayStr() }, 'Ραντεβού: ' + fmt(v))) }
    ]) }
  ]);

  const actAppt = (c) => dateWiz('Ραντεβού', 'Ημερομηνία ραντεβού:', v => go(c, 'appointment', { appt: v }, 'Νέο ραντεβού: ' + fmt(v)));

  const actRemoval = (c) => wiz('Αφαίρεση διπλώματος', 'Ημερομηνία αφαίρεσης και ημέρες:',
    `<input type="date" id="wV" value="${todayStr()}"><input type="number" id="wN" min="1" value="${c.removalDays || 30}">`,
    [{ t: 'Αποθήκευση', c: 'pri', v: () => $('#wV').value && Number($('#wN').value) > 0, f: () => {
      const d = $('#wV').value, n = Number($('#wN').value);
      c.removalDays = n; c.requiresLicense = true;
      go(c, 'suspended', { susp: d }, `Αφαίρεση στις ${fmt(d)} για ${n} ημ. Λήγει: ${fmt(addDays(d, n, 'backward'))}`);
    } }]);

  const actDeliver = (c) => dateWiz('Απόδοση διπλώματος', 'Ημερομηνία απόδοσης:', v => go(c, 'closed', { closed: v }, 'Απόδοση και κλείσιμο στις ' + fmt(v)));
  const actClose = (c) => go(c, 'closed', { closed: todayStr() }, 'Επιστροφή στην υπηρεσία και κλείσιμο');
  
  const invite = (c, n) => dateWiz(`Αποστολή ${n}ης πρόσκλησης`, 'Ημερομηνία αποστολής:',
    v => go(c, `inv${n}_sent`, { ['inv' + n + 'Send']: v }, `Αποστολή ${n}ης πρόσκλησης στις ${fmt(v)}`));
    
  const proof = (c, n) => dateWiz(`Αποδεικτικό ${n}ης`, 'Ημερομηνία παραλαβής:',
    v => go(c, `inv${n}_wait`, { ['inv' + n + 'Proof']: v }, `Παραλαβή αποδεικτικού ${n}ης. Αναμονή 10 ημερών.`));

  const ACT = {
    search: ['Αναζήτηση τηλεφώνου', actSearch], to_call: ['Καταχώρηση κλήσης', actCall], informed: ['Κλείσιμο ραντεβού', actAppt],
    appointment: ['Πραγματοποιήθηκε αφαίρεση', actRemoval], no_show: ['Αποστολή 1ης πρόσκλησης', c => invite(c, 1)],
    to_return: ['Απόδοση διπλώματος', actDeliver],
    inv1_next: ['Αποστολή 1ης πρόσκλησης', c => invite(c, 1)], inv1_sent: ['Ήρθε αποδεικτικό 1ης', c => proof(c, 1)],
    inv2_next: ['Αποστολή 2ης πρόσκλησης', c => invite(c, 2)], inv2_sent: ['Ήρθε αποδεικτικό 2ης', c => proof(c, 2)],
    inv3_next: ['Αποστολή 3ης πρόσκλησης', c => invite(c, 3)], inv3_sent: ['Ήρθε αποδεικτικό 3ης', c => proof(c, 3)],
    return_service: ['Επιστροφή στην Υπηρεσία', actClose]
  };

  const copyTemplate = (c) => {
    const text = `ΠΡΟΣΚΛΗΣΗ\n\nΟνοματεπώνυμο: ${c.name}\nΠινακίδα: ${c.plate}\nΥπηρεσία: ${c.service || '—'}\n\nΠαρακαλείσθε να προσέλθετε...`;
    navigator.clipboard.writeText(text).then(() => alert('Το κείμενο αντιγράφηκε!')).catch(() => alert('Αποτυχία αντιγραφής.'));
  };

  // ---------- Render ----------
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
      case 'suspended': return `Σε αφαίρεση (${c.removalDays} ημ.) · λήγει ${fmt(D.return)}`;
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
    if (c.state === 'appointment') act += `<button class="btn ghost" data-r="${c.id}">Αλλαγή ραντεβού</button>`;
    if (c.state.startsWith('inv') && c.state.endsWith('_next')) act += `<button class="btn ghost" data-copy="${c.id}">Αντιγραφή Κειμένου</button>`;
    
    // Παίρνουμε την τελευταία ενέργεια από το ιστορικό
const lastAction = c.history && c.history.length > 0 ? c.history[c.history.length - 1].action : '—';

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
      <div class="act">${act}</div>
      <details class="more"><summary>Λεπτομέρειες</summary>
        <div class="det">${det}</div>${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ''}
        <div class="row"><button class="btn" data-e="${c.id}">Επεξεργασία</button><button class="btn" data-h="${c.id}">Ιστορικό (${c.history.length})</button></div>
      </details></article>`;
  };

  const render = () => {
    tick();
    
    // Dashboard Stats
    let total = 0, dueToday = 0, dueSoon = 0, waiting = 0;
    const tToday = todayStr();
    const tSoon = addDays(tToday, 5); // 5 μέρες μπροστά
    
    cases.forEach(c => {
      if (c.state === 'closed') return;
      total++;
      
      const dueDate = getCaseDueDate(c);
      if (dueDate) {
        if (dueDate <= tToday) dueToday++;
        else if (dueDate <= tSoon) dueSoon++;
      }
      
      if (['informed', 'inv1_wait', 'inv2_wait', 'inv3_wait', 'inv1_sent', 'inv2_sent', 'inv3_sent'].includes(c.state)) {
        waiting++;
      }
    });
    
    $('#statTotal').textContent = total;
    $('#statDueToday').textContent = dueToday;
    $('#statDueSoon').textContent = dueSoon;
    $('#statWaiting').textContent = waiting;

    // Filters
    const fm = {}; cases.forEach(c => { const f = c.folder || '(χωρίς φάκελο)'; fm[f] = (fm[f] || 0) + 1; });
    $('#folderFilters').innerHTML = chip('f', 'all', 'Όλοι', cases.length, folderF === 'all') +
      Object.keys(fm).sort().map(f => chip('f', f, f, fm[f], folderF === f)).join('');
      
    const sc = {}; cases.forEach(c => sc[c.state] = (sc[c.state] || 0) + 1);
    $('#stateFilters').innerHTML = chip('s', 'all', 'Όλα', null, stateF === 'all') +
      Object.keys(ST).filter(k => sc[k]).map(k => chip('s', k, ST[k].l, sc[k], stateF === k)).join('');

    // Smart Inbox Banners
    const urg = cases.filter(c => URG.includes(c.state));
    const grp = {};
    urg.forEach(c => { grp[c.state] = (grp[c.state] || 0) + 1; });
    const bannerHTML = Object.keys(grp).map(st => {
      return `<button class="banner${st.endsWith('_next') ? ' w' : ''}" data-bf="${st}">
        <b>${grp[st]} ${BANNER[st]}</b>
        <span>Κλικ για προβολή</span>
      </button>`;
    }).join('');
    $('#banners').innerHTML = bannerHTML;

    const ql = q.toLowerCase();
    const list = cases.filter(c =>
      (folderF === 'all' || (c.folder || '(χωρίς φάκελο)') === folderF) && (stateF === 'all' || c.state === stateF) &&
      (!ql || [c.name, c.plate, c.folder, c.phone].join(' ').toLowerCase().includes(ql))
    ).sort((a, b) => (URG.includes(b.state) - URG.includes(a.state)) || (b.receivedDate || '').localeCompare(a.receivedDate || ''));
    
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
    $('#fDaysWrap').hidden = !$('#fReq').checked;
  };

  const checkPlate = (val) => {
    const exists = cases.some(c => c.plate === val && c.id !== F.dataset.id);
    const w = $('#plateWarning');
    if (exists) { w.textContent = 'Βρέθηκαν προηγούμενες υποθέσεις για αυτή την πινακίδα.'; w.style.display = 'block'; }
    else { w.style.display = 'none'; }
  };
  E.plate.addEventListener('input', (e) => checkPlate(e.target.value.trim().toUpperCase()));

  const openForm = (id) => {
    const c = id ? get(id) : null;
    F.reset();
    $('#formTitle').textContent = c ? 'Επεξεργασία υπόθεσης' : 'Νέα υπόθεση';
    $('#btnFormDelete').hidden = !c;
    
    E.manualState.innerHTML = Object.keys(ST).map(k => `<option value="${k}">${ST[k].l}</option>`).join('');
    folderOpts(c ? c.folder : '');
    
    if (c) {
      E.plate.value = c.plate; E.name.value = c.name; E.service.value = c.service || ''; E.phone.value = c.phone || '';
      E.receivedDate.value = c.receivedDate;
      if (VIOL.includes(c.violationType)) E.violationType.value = c.violationType;
      else if (c.violationType) { E.violationType.value = 'custom'; E.violationOther.value = c.violationType; }
      E.fine.value = c.fine || ''; E.requiresLicense.checked = c.removalDays > 0;
      E.removalDays.value = c.removalDays || 30; E.notes.value = c.notes || '';
      E.manualState.value = c.state;
      
      const D = c.dates;
      E.d_phone.value = D.phone; E.d_appt.value = D.appt; E.d_susp.value = D.susp; E.d_return.value = D.return;
      E.d_inv1Send.value = D.inv1Send; E.d_inv1Proof.value = D.inv1Proof; E.d_inv2Send.value = D.inv2Send;
      E.d_inv2Proof.value = D.inv2Proof; E.d_inv3Send.value = D.inv3Send; E.d_inv3Proof.value = D.inv3Proof;
      
      if (c.folder && $('#fFolder').value === '') { $('#fFolder').value = 'custom'; E.folderCustom.value = c.folder; }
      checkPlate(c.plate);
    } else {
      E.receivedDate.value = todayStr(); E.requiresLicense.checked = true;
      $('#plateWarning').style.display = 'none';
    }
    toggles();
    F.dataset.id = id || '';
    dlgF.showModal();
  };

  F.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = F.dataset.id || uid(), old = get(id);
    const folder = E.folderSelect.value === 'custom' ? E.folderCustom.value.trim() : E.folderSelect.value;
    const req = E.requiresLicense.checked, days = req ? Number(E.removalDays.value) : 0;
    const keep = (v) => old ? v : '';
    
    const D = {
      phone: keep(E.d_phone.value), appt: keep(E.d_appt.value), susp: keep(E.d_susp.value),
      return: E.d_return.value, inv1Send: keep(E.d_inv1Send.value), inv1Proof: keep(E.d_inv1Proof.value),
      inv2Send: keep(E.d_inv2Send.value), inv2Proof: keep(E.d_inv2Proof.value),
      inv3Send: keep(E.d_inv3Send.value), inv3Proof: keep(E.d_inv3Proof.value), closed: old ? old.dates.closed : ''
    };
    if (D.susp && days) D.return = addDays(D.susp, days, 'backward');
    
    const rec = {
      id, plate: E.plate.value.trim().toUpperCase(), name: E.name.value.trim(), service: E.service.value.trim(),
      phone: E.phone.value.trim(), receivedDate: E.receivedDate.value, folder,
      violationType: E.violationType.value === 'custom' ? E.violationOther.value.trim() : E.violationType.value,
      fine: E.fine.value.trim(), requiresLicense: req, removalDays: days, notes: E.notes.value.trim(),
      state: old ? E.manualState.value : (E.phone.value.trim() ? 'to_call' : 'search'),
      history: old ? old.history : [{ date: todayStr(), action: 'Δημιουργία νέας υπόθεσης' }], dates: D
    };
    
    if (old) {
      rec.history.push({ date: todayStr(), action: 'Χειροκίνητη επεξεργασία' });
      cases[cases.indexOf(old)] = rec;
    } else {
      cases.unshift(rec);
    }
    save(); render(); dlgF.close();
  });

  // ---------- Events ----------
  $('#casesList').addEventListener('click', (e) => {
    const t = e.target.closest('[data-a],[data-r],[data-e],[data-h],[data-copy]'); 
    if (!t) return;
    const id = t.dataset.a || t.dataset.r || t.dataset.e || t.dataset.h || t.dataset.copy;
    const c = get(id); if (!c) return;
    
    if (t.dataset.a) { const a = ACT[c.state]; if (a) a[1](c); }
    else if (t.dataset.r) actAppt(c);
    else if (t.dataset.e) openForm(c.id);
    else if (t.dataset.copy) copyTemplate(c);
    else { 
      $('#histBody').innerHTML = [...c.history].reverse().map(h => `<div class="hi"><span>${esc(h.action)}</span><time>${fmt(h.date)}</time></div>`).join(''); 
      $('#dlgHistory').showModal(); 
    }
  });

  $('#banners').addEventListener('click', (e) => {
    const b = e.target.closest('[data-bf]'); if (!b) return;
    stateF = b.dataset.bf; folderF = 'all'; q = ''; $('#searchInput').value = ''; render();
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#folderFilters').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { folderF = b.dataset.f; render(); } });
  $('#stateFilters').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) { stateF = b.dataset.s; render(); } });
  $('#searchInput').oninput = (e) => { q = e.target.value; render(); };
  
  $('#fFolder').onchange = toggles; $('#fViol').onchange = toggles; $('#fReq').onchange = toggles;
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
          cases = arr.map(migrate); save(); render(); alert('Επιτυχής επαναφορά: ' + cases.length + ' υποθέσεις.');
        }
      } catch { alert('Μη έγκυρο αρχείο.'); }
      e.target.value = '';
    };
    r.readAsText(file);
  };

  $('#btnPrint').onclick = () => {
    let h = `<h1>ΚΑΤΑΣΤΑΣΗ ΥΠΟΘΕΣΕΩΝ</h1><div style="font-size:10px; margin-bottom:8px">Ημερομηνία: ${fmt(todayStr())} | Σύνολο: ${cases.length}</div>` +
      '<table><thead><tr><th>Α/Α</th><th>Πινακίδα</th><th>Ονοματεπώνυμο</th><th>Τηλέφωνο</th><th>Κατάσταση</th><th>Ραντεβού</th><th>Απόδοση</th><th>Φάκελος</th></tr></thead><tbody>';
    cases.forEach((c, i) => { 
      h += `<tr><td>${i + 1}</td><td><b>${esc(c.plate)}</b></td><td>${esc(c.name)}</td><td>${esc(c.phone || '—')}</td><td>${(ST[c.state] || {}).l || '—'}</td><td>${fmt(c.dates.appt)}</td><td>${fmt(c.dates.return)}</td><td>${esc(c.folder || '—')}</td></tr>`; 
    });
    $('#printArea').innerHTML = h + '</tbody></table>';
    print();
  };

  // ---------- Init ----------
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => { if (granted) console.log("Storage persisted"); });
  }

  load(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();
