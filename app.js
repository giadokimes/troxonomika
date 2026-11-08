(() => {
  const KEY = 'troxonomika_final_v19';
  const OLD = [...Array(15)].map((_, i) => 'troxonomika_final_v' + (18 - i))
    .concat(['ypotheseis_pwa_v1','ypotheseis.v1','troxonomika.cases.v1','ypotheseis.v2','ypotheseis_gemini_v1']);

  // tone: info | warn | bad | ok
  const ST = {
    search:{l:'Προς Αναζήτηση',t:'info',a:'Εκκρεμεί αναζήτηση τηλεφώνου'},
    to_call:{l:'Προς Κλήση',t:'info',a:''},
    informed:{l:'Ενημερώθηκε',t:'warn',a:''},
    appointment:{l:'Κλεισμένο Ραντεβού',t:'info',a:''},
    no_show:{l:'Μη Προσέλευση',t:'bad',a:'Δεν προσήλθε στο ραντεβού'},
    suspended:{l:'Σε Αφαίρεση',t:'info',a:''},
    to_return:{l:'Προς Απόδοση',t:'bad',a:'Έληξε η αφαίρεση'},
    inv1_next:{l:'Προς 1η Πρόσκληση',t:'warn',a:'Αποστολή 1ης πρόσκλησης'},
    inv1_sent:{l:'Αναμονή 1ου Αποδεικτικού',t:'warn',a:''},
    inv1_wait:{l:'Αναμονή 10ημ. (1ο Αποδ.)',t:'warn',a:''},
    inv2_next:{l:'Προς 2η Πρόσκληση',t:'warn',a:'Αποστολή 2ης πρόσκλησης'},
    inv2_sent:{l:'Αναμονή 2ου Αποδεικτικού',t:'warn',a:''},
    inv2_wait:{l:'Αναμονή 10ημ. (2ο Αποδ.)',t:'warn',a:''},
    inv3_next:{l:'Προς 3η Πρόσκληση',t:'warn',a:'Αποστολή 3ης πρόσκλησης'},
    inv3_sent:{l:'Αναμονή 3ου Αποδεικτικού',t:'warn',a:''},
    inv3_wait:{l:'Αναμονή 10ημ. (3ο Αποδ.)',t:'warn',a:''},
    return_service:{l:'Επιστροφή στην Υπηρεσία',t:'bad',a:'Αποστολή φακέλου στην υπηρεσία'},
    closed:{l:'Ολοκληρωμένη',t:'ok',a:''}
  };
  const URG = ['no_show','to_return','return_service','inv1_next','inv2_next','inv3_next'];
  const BANNER = {no_show:'Μη προσέλευση στο ραντεβού',to_return:'Έληξε η αφαίρεση: απόδοση διπλώματος',return_service:'Επιστροφή στην Υπηρεσία',
    inv1_next:'Αποστολή 1ης πρόσκλησης',inv2_next:'Αποστολή 2ης πρόσκλησης',inv3_next:'Αποστολή 3ης πρόσκλησης'};
  const FOLDERS = {
    'Τηλέφωνα':['Με ραντεβού','Χωρίς ραντεβού'],
    'Προσκλήσεις':['1η πρόσκληση','2η πρόσκληση','3η πρόσκληση'],
    'Αναμονή αποδεικτικού':['Αναμονή αποδεικτικού'],
    'Εκκρεμότητες':['Αναζήτηση τηλεφώνου','Αποστολή πρόσκλησης','Διαβίβαση σε Υπηρεσία','Καταχώρηση POL']
  };
  const VIOL = ['Υπερβολική ταχύτητα','ΚΤΕΟ','Διόδια','Στάθμευση','Απόφαση'];
  const BLANK = {phone:'',appt:'',susp:'',return:'',inv1Send:'',inv1Proof:'',inv2Send:'',inv2Proof:'',inv3Send:'',inv3Proof:'',closed:''};

  let cases = [], folderF = 'all', stateF = 'all', q = '';

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const today = () => iso(new Date());
  const fmt = v => v ? new Date(v + 'T12:00:00').toLocaleDateString('el-GR') : '—';
  // dir>=0: Σαβ/Κυρ -> Δευτέρα (προθεσμίες)· dir<0: Σαβ/Κυρ -> Παρασκευή (απόδοση διπλώματος)
  const add = (s, n, dir = 1) => {
    if (!s) return '';
    const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + Number(n));
    const w = d.getDay();
    if (w === 6) d.setDate(d.getDate() + (dir < 0 ? -1 : 2));
    else if (w === 0) d.setDate(d.getDate() + (dir < 0 ? -2 : 1));
    return iso(d);
  };
  const due = d => !!d && d <= today();
  const retDate = (s, n) => add(s, n, -1);

  // ---------- Αποθήκευση / μετάβαση δεδομένων ----------
  const save = () => localStorage.setItem(KEY, JSON.stringify(cases));
  const get = id => cases.find(x => x.id === id);
  const stripNo = f => String(f || '').replace(/^[0-9]\.\s*/, '');

  const mapOld = o => {
    const s = (o.status || '').toLowerCase();
    const m = {search:'search',to_call:'to_call',informed:'informed',called:'informed',appointment:'appointment',appt:'appointment',
      removed:'suspended',suspended:'suspended',to_return:'to_return',inv1_sent:'inv1_sent',invite1:'inv1_sent',inv1_proof:'inv2_next',
      inv2_sent:'inv2_sent',invite2:'inv2_sent',inv2_proof:'inv3_next',inv3_sent:'inv3_sent',invite3:'inv3_sent',inv3_proof:'return_service',
      return_service:'return_service',closed:'closed',done:'closed'};
    if (s === 'new') return o.phone ? 'to_call' : 'search';
    return m[s] || (o.phone ? 'to_call' : 'search');
  };

  const migrate = o => {
    if (o.state && o.dates) {          // ήδη στη νέα μορφή
      o.folder = stripNo(o.folder); o.dates = {...BLANK, ...o.dates}; o.history = o.history || [];
      return o;
    }
    const c = {
      id: o.id || uid(), plate: o.plate || o.ref || '', name: o.name || o.fullName || '', service: o.service || '',
      phone: o.phone || '', receivedDate: o.receivedDate || o.dateReceived || today(), folder: stripNo(o.folder || o.folderLocation),
      violationType: o.violationType || '', fine: o.fine || o.fineAmount || '',
      requiresLicense: o.requiresLicense !== false && o.hasRemoval !== false, removalDays: o.removalDays || o.suspDays || 30,
      notes: o.notes || '', state: mapOld(o),
      history: o.history || [{date: today(), action: 'Μεταφορά από παλιά έκδοση'}],
      dates: {...BLANK,
        phone: o.phoneDate || o.callDate || '', appt: o.apptDate || o.appointmentDate || '',
        susp: o.suspDate || o.removalDate || o.arrivedDate || '', return: o.returnDate || '',
        inv1Send: o.inv1Send || o.invite1Date || o.invite1 || '', inv1Proof: o.inv1Proof || o.proof1 || '',
        inv2Send: o.inv2Send || o.invite2Date || o.invite2 || '', inv2Proof: o.inv2Proof || o.proof2 || '',
        inv3Send: o.inv3Send || o.invite3Date || o.invite3 || '', inv3Proof: o.inv3Proof || o.proof3 || '',
        closed: o.closedDate || ''}
    };
    if (c.dates.susp && c.removalDays && !c.dates.return) c.dates.return = retDate(c.dates.susp, c.removalDays);
    return c;
  };

  const load = () => {
    try { const cur = localStorage.getItem(KEY); if (cur) { cases = (JSON.parse(cur) || []).map(migrate); return; } } catch (e) {}
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

  // ---------- Μηχανή καταστάσεων ----------
  const tick = () => {
    let ch = false;
    cases.forEach(c => {
      const D = c.dates, s = c.state; let n = s;
      if (s === 'informed' && due(add(D.phone, 5))) n = 'inv1_next';
      else if (s === 'appointment' && due(add(D.appt, 5))) n = 'no_show';
      else if (s === 'suspended' && due(D.return)) n = 'to_return';
      else if (s === 'inv1_wait' && due(add(D.inv1Proof, 10))) n = 'inv2_next';
      else if (s === 'inv2_wait' && due(add(D.inv2Proof, 10))) n = 'inv3_next';
      else if (s === 'inv3_wait' && due(add(D.inv3Proof, 10))) n = 'return_service';
      if (n !== s) { c.state = n; ch = true; }
    });
    if (ch) save();
  };

  const go = (c, state, extra, log) => {
    c.state = state; Object.assign(c.dates, extra || {});
    if (log) c.history.push({date: today(), action: log});
    if (state === 'suspended' && c.dates.susp && c.removalDays) c.dates.return = retDate(c.dates.susp, c.removalDays);
    save(); render();
  };

  // ---------- Παράθυρο ροής (wizard) ----------
  const dlgW = $('#dlgWizard');
  const wiz = (title, desc, body, btns) => {
    $('#wT').textContent = title; $('#wD').textContent = desc || ''; $('#wB').innerHTML = body || '';
    const a = $('#wA'); a.innerHTML = '';
    btns.concat([{t:'Άκυρο', c:'ghost'}]).forEach(b => {
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'btn ' + (b.c || ''); x.textContent = b.t;
      x.onclick = () => { if (b.v && !b.v()) return; dlgW.close(); if (b.f) b.f(); };
      a.append(x);
    });
    if (!dlgW.open) dlgW.showModal();
  };
  const dateWiz = (title, desc, cb) => wiz(title, desc, `<input type="date" id="wV" value="${today()}">`,
    [{t:'Αποθήκευση', c:'pri', v:() => $('#wV').value, f:() => cb($('#wV').value)}]);

  const actSearch = c => wiz('Αναζήτηση τηλεφώνου', 'Βρέθηκε τηλέφωνο;', '', [
    {t:'Όχι, δεν βρέθηκε', c:'bad', f:() => go(c, 'inv1_next', {}, 'Δεν βρέθηκε τηλέφωνο, μετάβαση σε πρόσκληση')},
    {t:'Ναι', c:'ok', f:() => wiz('Εισαγωγή τηλεφώνου', 'Πληκτρολογήστε τον αριθμό:', '<input type="tel" id="wV">',
      [{t:'Αποθήκευση', c:'pri', v:() => $('#wV').value.trim(), f:() => { const p = $('#wV').value.trim(); c.phone = p; go(c, 'to_call', {}, 'Καταχώρηση τηλεφώνου: ' + p); }}])}
  ]);

  const actCall = c => wiz('Καταχώρηση κλήσης', 'Απάντησε ο πολίτης;', '', [
    {t:'Όχι', c:'bad', f:() => go(c, 'inv1_next', {}, 'Κλήση χωρίς απάντηση, μετάβαση σε πρόσκληση')},
    {t:'Ναι', c:'ok', f:() => wiz('Ραντεβού', 'Έκλεισε ραντεβού;', '', [
      {t:'Όχι, ενημερώθηκε (αναμονή 5 ημερών)', c:'bad', f:() => go(c, 'informed', {phone: today()}, 'Ενημερώθηκε, δεν έκλεισε ραντεβού. Αναμονή 5 ημερών.')},
      {t:'Ναι', c:'ok', f:() => dateWiz('Ημερομηνία ραντεβού', 'Επιλέξτε ημερομηνία:', v => go(c, 'appointment', {appt: v, phone: c.dates.phone || today()}, 'Κλείσιμο ραντεβού για: ' + fmt(v)))}
    ])}
  ]);

  const actAppt = c => dateWiz('Ραντεβού', 'Ημερομηνία ραντεβού:', v => go(c, 'appointment', {appt: v}, 'Νέο ραντεβού: ' + fmt(v)));

  const actRemoval = c => wiz('Πραγματοποιήθηκε αφαίρεση', 'Ημερομηνία αφαίρεσης και ημέρες:',
    `<input type="date" id="wV" value="${today()}"><input type="number" id="wN" min="1" value="${c.removalDays || 30}">`,
    [{t:'Αποθήκευση', c:'pri', v:() => $('#wV').value && Number($('#wN').value) > 0, f:() => {
      const d = $('#wV').value, n = Number($('#wN').value);
      c.removalDays = n; c.requiresLicense = true;
      go(c, 'suspended', {susp: d}, `Αφαίρεση διπλώματος στις ${fmt(d)} για ${n} ημ. Λήγει: ${fmt(retDate(d, n))}`);
    }}]);

  const actDeliver = c => dateWiz('Απόδοση διπλώματος', 'Ημερομηνία απόδοσης:', v => go(c, 'closed', {closed: v}, 'Απόδοση διπλώματος και κλείσιμο στις ' + fmt(v)));
  const actClose = c => go(c, 'closed', {closed: today()}, 'Επιστροφή στην υπηρεσία και κλείσιμο');
  const invite = (c, n) => dateWiz(`Αποστολή ${n}ης πρόσκλησης`, 'Ημερομηνία αποστολής:',
    v => go(c, `inv${n}_sent`, {['inv' + n + 'Send']: v}, `Αποστολή ${n}ης πρόσκλησης στις ${fmt(v)}`));
  const proof = (c, n) => dateWiz(`Αποδεικτικό ${n}ης`, 'Ημερομηνία παραλαβής:',
    v => go(c, `inv${n}_wait`, {['inv' + n + 'Proof']: v}, `Παραλαβή αποδεικτικού ${n}ης στις ${fmt(v)}. Αναμονή 10 ημερών.`));

  const ACT = {
    search:['Αναζήτηση τηλεφώνου', actSearch], to_call:['Καταχώρηση κλήσης', actCall], informed:['Κλείσιμο ραντεβού', actAppt],
    appointment:['Πραγματοποιήθηκε αφαίρεση', actRemoval], no_show:['Αποστολή 1ης πρόσκλησης', c => invite(c, 1)],
    to_return:['Απόδοση διπλώματος', actDeliver],
    inv1_next:['Αποστολή 1ης πρόσκλησης', c => invite(c, 1)], inv1_sent:['Ήρθε αποδεικτικό 1ης', c => proof(c, 1)],
    inv2_next:['Αποστολή 2ης πρόσκλησης', c => invite(c, 2)], inv2_sent:['Ήρθε αποδεικτικό 2ης', c => proof(c, 2)],
    inv3_next:['Αποστολή 3ης πρόσκλησης', c => invite(c, 3)], inv3_sent:['Ήρθε αποδεικτικό 3ης', c => proof(c, 3)],
    return_service:['Επιστροφή στην Υπηρεσία', actClose]
  };

  // ---------- Εμφάνιση ----------
  const calLink = c => {
    if (!c.dates.appt) return '#';
    const d = c.dates.appt.replace(/-/g, '');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(`Ραντεβού: ${c.name} (${c.plate})`) +
      `&dates=${d}T090000/${d}T093000&ctz=Europe/Athens&details=` + encodeURIComponent(`Τηλ: ${c.phone || '—'} | Φάκελος: ${c.folder || '—'}`);
  };
  const chip = (k, v, l, n, on) => `<button class="chip${on ? ' on' : ''}" data-${k}="${esc(v)}">${esc(l)}${n != null ? ' <b>' + n + '</b>' : ''}</button>`;

  const infoLine = c => {
    const D = c.dates;
    switch (c.state) {
      case 'informed': return 'Αναμονή 5 ημερών έως ' + fmt(add(D.phone, 5));
      case 'appointment': return `Ραντεβού ${fmt(D.appt)} · έλεγχος ${fmt(add(D.appt, 5))}`;
      case 'suspended': return `Σε αφαίρεση (${c.removalDays} ημ.) · λήγει ${fmt(D.return)}`;
      case 'inv1_wait': case 'inv2_wait': case 'inv3_wait': {
        const n = c.state[3]; return `Αναμονή 10 ημερών από το αποδεικτικό, έως ${fmt(add(D['inv' + n + 'Proof'], 10))}`;
      }
      default: return ST[c.state].a;
    }
  };

  const card = c => {
    const s = ST[c.state] || ST.search, a = ACT[c.state];
    let act = '';
    if (c.state === 'to_call' && c.phone) act += `<a class="btn ghost" href="tel:${esc(c.phone)}">Κλήση ${esc(c.phone)}</a>`;
    if (c.state === 'appointment') act += `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(calLink(c))}">Προσθήκη στο Google Calendar</a>`;
    if (a) act += `<button class="btn pri" data-a="${c.id}">${a[0]}</button>`;
    if (c.state === 'appointment') act += `<button class="btn ghost" data-r="${c.id}">Αλλαγή ραντεβού</button>`;
    const det = [
      c.service && `<span><b>Υπηρεσία:</b> ${esc(c.service)}</span>`, c.folder && `<span><b>Φάκελος:</b> ${esc(c.folder)}</span>`,
      `<span><b>Παραλαβή:</b> ${fmt(c.receivedDate)}</span>`,
      c.phone && `<span><b>Τηλ:</b> <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></span>`,
      c.violationType && `<span><b>Παράβαση:</b> ${esc(c.violationType)}</span>`, c.fine && `<span><b>Πρόστιμο:</b> ${esc(c.fine)} €</span>`,
      c.removalDays > 0 && `<span><b>Ημέρες αφαίρεσης:</b> ${esc(c.removalDays)}</span>`
    ].filter(Boolean).join('');
    return `<article class="card t-${s.t}">
      <div class="hd"><div><div class="nm">${esc(c.name)}</div><div class="pl">${esc(c.plate)}</div></div><span class="badge">${s.l}</span></div>
      ${infoLine(c) ? `<div class="info">${esc(infoLine(c))}</div>` : ''}
      <div class="act">${act}</div>
      <details class="more"><summary>Λεπτομέρειες</summary>
        <div class="det">${det}</div>${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ''}
        <div class="row"><button class="btn" data-e="${c.id}">Επεξεργασία</button><button class="btn" data-h="${c.id}">Ιστορικό (${c.history.length})</button></div>
      </details></article>`;
  };

  const render = () => {
    tick();
    const fm = {}; cases.forEach(c => { const f = c.folder || '(χωρίς φάκελο)'; fm[f] = (fm[f] || 0) + 1; });
    $('#folderFilters').innerHTML = chip('f', 'all', 'Όλοι', cases.length, folderF === 'all') +
      Object.keys(fm).sort().map(f => chip('f', f, f, fm[f], folderF === f)).join('');
    const sc = {}; cases.forEach(c => sc[c.state] = (sc[c.state] || 0) + 1);
    $('#stateFilters').innerHTML = chip('s', 'all', 'Όλα', null, stateF === 'all') +
      Object.keys(ST).filter(k => sc[k]).map(k => chip('s', k, ST[k].l, sc[k], stateF === k)).join('');

    $('#banners').innerHTML = cases.filter(c => URG.includes(c.state)).map(c =>
      `<button class="banner${c.state.endsWith('_next') ? ' w' : ''}" data-plate="${esc(c.plate)}"><b>${esc(c.name)}</b> · ${esc(c.plate)}` +
      `<span>${BANNER[c.state]}</span>${c.phone ? `<span>Τηλ: ${esc(c.phone)}</span>` : ''}</button>`).join('');

    const ql = q.toLowerCase();
    const list = cases.filter(c =>
      (folderF === 'all' || (c.folder || '(χωρίς φάκελο)') === folderF) && (stateF === 'all' || c.state === stateF) &&
      (!ql || [c.name, c.plate, c.folder, c.phone].join(' ').toLowerCase().includes(ql))
    ).sort((a, b) => (URG.includes(b.state) - URG.includes(a.state)) || (b.receivedDate || '').localeCompare(a.receivedDate || ''));
    $('#casesList').innerHTML = list.map(card).join('') || '<div class="empty">Δεν βρέθηκαν υποθέσεις.</div>';
  };

  // ---------- Φόρμα ----------
  const F = $('#caseForm'), dlgF = $('#dlgForm'), E = F.elements;
  const folderOpts = cur => {
    let h = '<option value="">—</option>';
    const std = [];
    for (const [g, subs] of Object.entries(FOLDERS)) {
      h += `<optgroup label="${esc(g)}">` + subs.map(s => { const v = subs.length === 1 ? g : g + ' - ' + s; std.push(v); return `<option value="${esc(v)}">${esc(s)}</option>`; }).join('') + '</optgroup>';
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

  const openForm = id => {
    const c = id ? get(id) : null;
    F.reset();
    $('#formTitle').textContent = c ? 'Επεξεργασία υπόθεσης' : 'Νέα υπόθεση';
    $('#btnFormDelete').hidden = !c;
    E.manualState.innerHTML = Object.keys(ST).map(k => `<option value="${k}">${ST[k].l}</option>`).join('');  // πρώτα τα options
    folderOpts(c ? c.folder : '');
    if (c) {
      E.plate.value = c.plate; E.name.value = c.name; E.service.value = c.service || ''; E.phone.value = c.phone || '';
      E.receivedDate.value = c.receivedDate;
      if (VIOL.includes(c.violationType)) E.violationType.value = c.violationType;
      else if (c.violationType) { E.violationType.value = 'custom'; E.violationOther.value = c.violationType; }
      E.fine.value = c.fine || ''; E.requiresLicense.checked = c.removalDays > 0; E.removalDays.value = c.removalDays || 30; E.notes.value = c.notes || '';
      E.manualState.value = c.state;
      const D = c.dates;
      E.d_phone.value = D.phone; E.d_appt.value = D.appt; E.d_susp.value = D.susp; E.d_return.value = D.return;
      E.d_inv1Send.value = D.inv1Send; E.d_inv1Proof.value = D.inv1Proof; E.d_inv2Send.value = D.inv2Send;
      E.d_inv2Proof.value = D.inv2Proof; E.d_inv3Send.value = D.inv3Send; E.d_inv3Proof.value = D.inv3Proof;
      if (c.folder && $('#fFolder').value === '') { $('#fFolder').value = 'custom'; E.folderCustom.value = c.folder; }
    } else { E.receivedDate.value = today(); E.requiresLicense.checked = true; }
    toggles(); F.dataset.id = id || ''; dlgF.showModal();
  };

  F.addEventListener('submit', e => {
    e.preventDefault();
    const id = F.dataset.id || uid(), old = get(id);
    const folder = E.folderSelect.value === 'custom' ? E.folderCustom.value.trim() : E.folderSelect.value;
    const req = E.requiresLicense.checked, days = req ? Number(E.removalDays.value) : 0;
    const keep = (v, k) => old ? v : '';
    const D = {
      phone: keep(E.d_phone.value), appt: keep(E.d_appt.value), susp: keep(E.d_susp.value),
      return: E.d_return.value, inv1Send: keep(E.d_inv1Send.value), inv1Proof: keep(E.d_inv1Proof.value),
      inv2Send: keep(E.d_inv2Send.value), inv2Proof: keep(E.d_inv2Proof.value),
      inv3Send: keep(E.d_inv3Send.value), inv3Proof: keep(E.d_inv3Proof.value), closed: old ? old.dates.closed : ''
    };
    if (D.susp && days) D.return = retDate(D.susp, days);
    const rec = {
      id, plate: E.plate.value.trim().toUpperCase(), name: E.name.value.trim(), service: E.service.value.trim(),
      phone: E.phone.value.trim(), receivedDate: E.receivedDate.value, folder,
      violationType: E.violationType.value === 'custom' ? E.violationOther.value.trim() : E.violationType.value,
      fine: E.fine.value.trim(), requiresLicense: req, removalDays: days, notes: E.notes.value.trim(),
      state: old ? E.manualState.value : (E.phone.value.trim() ? 'to_call' : 'search'),
      history: old ? old.history : [{date: today(), action: 'Δημιουργία νέας υπόθεσης'}], dates: D
    };
    if (old) { rec.history.push({date: today(), action: 'Χειροκίνητη επεξεργασία στοιχείων'}); cases[cases.indexOf(old)] = rec; }
    else cases.unshift(rec);
    save(); render(); dlgF.close();
  });

  // ---------- Συμβάντα ----------
  $('#casesList').addEventListener('click', e => {
    const t = e.target.closest('[data-a],[data-r],[data-e],[data-h]'); if (!t) return;
    const c = get(t.dataset.a || t.dataset.r || t.dataset.e || t.dataset.h); if (!c) return;
    if (t.dataset.a) { const a = ACT[c.state]; if (a) a[1](c); }
    else if (t.dataset.r) actAppt(c);
    else if (t.dataset.e) openForm(c.id);
    else { $('#histBody').innerHTML = [...c.history].reverse().map(h => `<div class="hi"><span>${esc(h.action)}</span><time>${fmt(h.date)}</time></div>`).join(''); $('#dlgHistory').showModal(); }
  });
  $('#banners').addEventListener('click', e => {
    const b = e.target.closest('[data-plate]'); if (!b) return;
    q = b.dataset.plate; $('#searchInput').value = q; folderF = stateF = 'all'; render(); scrollTo({top: 0, behavior: 'smooth'});
  });
  $('#folderFilters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { folderF = b.dataset.f; render(); } });
  $('#stateFilters').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { stateF = b.dataset.s; render(); } });
  $('#searchInput').oninput = e => { q = e.target.value; render(); };
  $('#fFolder').onchange = toggles; $('#fViol').onchange = toggles; $('#fReq').onchange = toggles;
  $('#btnNew').onclick = () => openForm(null);
  $('#btnFormCancel').onclick = () => dlgF.close();
  $('#btnHistoryClose').onclick = () => $('#dlgHistory').close();
  $('#btnFormDelete').onclick = () => {
    if (confirm('Οριστική διαγραφή υπόθεσης;')) { cases = cases.filter(x => x.id !== F.dataset.id); save(); render(); dlgF.close(); }
  };

  $('#btnExport').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cases, null, 2)], {type: 'application/json'}));
    a.download = 'ypotheseis_' + today() + '.json'; a.click();
  };
  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
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
    let h = `<h1>ΚΑΤΑΣΤΑΣΗ ΥΠΟΘΕΣΕΩΝ</h1><div style="font-size:10px;margin-bottom:8px">Ημερομηνία: ${fmt(today())} | Σύνολο: ${cases.length}</div>` +
      '<table><thead><tr><th>Α/Α</th><th>Πινακίδα</th><th>Ονοματεπώνυμο</th><th>Τηλέφωνο</th><th>Κατάσταση</th><th>Ραντεβού</th><th>Απόδοση</th><th>Φάκελος</th></tr></thead><tbody>';
    cases.forEach((c, i) => { h += `<tr><td>${i + 1}</td><td><b>${esc(c.plate)}</b></td><td>${esc(c.name)}</td><td>${esc(c.phone || '—')}</td><td>${(ST[c.state] || {}).l || '—'}</td><td>${fmt(c.dates.appt)}</td><td>${fmt(c.dates.return)}</td><td>${esc(c.folder || '—')}</td></tr>`; });
    $('#printArea').innerHTML = h + '</tbody></table>';
    print();
  };

  load(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();
