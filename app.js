(() => {
  const KEY = 'troxonomika_final_v14';
  const OLD_KEYS = ['troxonomika_final_v13','troxonomika_final_v12','troxonomika_final_v11','troxonomika_final_v10','troxonomika_final_v9','troxonomika_final_v8','troxonomika_final_v7','troxonomika_final_v6','troxonomika_final_v5','troxonomika_final_v4','ypotheseis_pwa_v1','ypotheseis.v1','troxonomika.cases.v1','ypotheseis.v2','ypotheseis_gemini_v1'];
  
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  
  const todayStr = () => new Date().toISOString().split('T')[0];
  const formatDate = v => v ? new Date(v + 'T12:00:00').toLocaleDateString('el-GR') : '—';
  
  function addDays(dateStr, days) {
    if (!dateStr) return '';
    let d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + Number(days));
    const day = d.getDay();
    if (day === 6) d.setDate(d.getDate() + 2);
    else if (day === 0) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  function isPast(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr + 'T12:00:00') < new Date(todayStr() + 'T12:00:00');
  }

  let cases = [];
  
  function migrateData() {
    const current = localStorage.getItem(KEY);
    if (current) { cases = JSON.parse(current) || []; return; }
    for (const oldKey of OLD_KEYS) {
      const oldData = localStorage.getItem(oldKey);
      if (!oldData) continue;
      try {
        const arr = JSON.parse(oldData);
        if (!Array.isArray(arr) || !arr.length) continue;
        cases = arr.map(o => migrateCase(o));
        save();
        setTimeout(() => alert(`Επιτυχής μεταφορά ${cases.length} υποθέσεων!`), 500);
        return;
      } catch(e) {}
    }
    cases = [];
  }

  function migrateCase(old) {
    const c = {
      id: old.id || Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      plate: old.plate || old.ref || '',
      name: old.name || old.fullName || '',
      service: old.service || '',
      phone: old.phone || '',
      receivedDate: old.receivedDate || old.dateReceived || todayStr(),
      folder: old.folder || old.folderLocation || '',
      violationType: old.violationType || '',
      fine: old.fine || old.fineAmount || '',
      requiresLicense: old.requiresLicense !== false && old.hasRemoval !== false,
      removalDays: old.removalDays || old.suspDays || 30,
      notes: old.notes || '',
      state: mapOldState(old),
      history: old.history || [{ date: todayStr(), action: 'Μεταφορά από παλιά έκδοση' }],
      dates: {
        phone: old.phoneDate || old.callDate || '',
        appt: old.apptDate || old.appointmentDate || '',
        susp: old.suspDate || old.removalDate || old.arrivedDate || '',
        return: old.returnDate || '',
        inv1Send: old.inv1Send || old.invite1Date || old.invite1 || '',
        inv1Proof: old.inv1Proof || old.proof1 || '',
        inv2Send: old.inv2Send || old.invite2Date || old.invite2 || '',
        inv2Proof: old.inv2Proof || old.proof2 || '',
        inv3Send: old.inv3Send || old.invite3Date || old.invite3 || '',
        inv3Proof: old.inv3Proof || old.proof3 || '',
        closed: old.closedDate || ''
      }
    };
    if (c.dates.susp && c.removalDays && !c.dates.return) c.dates.return = addDays(c.dates.susp, c.removalDays);
    return c;
  }

  function mapOldState(old) {
    const s = (old.status || '').toLowerCase();
    if (s === 'search' || (!old.phone && s === 'new')) return 'search';
    if (s === 'to_call' || (old.phone && s === 'new')) return 'to_call';
    if (s === 'informed' || s === 'called') return 'informed';
    if (s === 'appointment' || s === 'appt') return 'appointment';
    if (s === 'removed' || s === 'suspended') return 'suspended';
    if (s === 'to_return') return 'to_return';
    if (s === 'inv1_sent' || s === 'invite1') return 'inv1_sent';
    if (s === 'inv1_proof') return 'inv2_next';
    if (s === 'inv2_sent' || s === 'invite2') return 'inv2_sent';
    if (s === 'inv2_proof') return 'inv3_next';
    if (s === 'inv3_sent' || s === 'invite3') return 'inv3_sent';
    if (s === 'inv3_proof' || s === 'return_service') return 'return_service';
    if (s === 'closed' || s === 'done') return 'closed';
    return old.phone ? 'to_call' : 'search';
  }

  function save() { localStorage.setItem(KEY, JSON.stringify(cases)); }
  function getCase(id) { return cases.find(x => x.id === id); }

  const ST = {
    search:      { label: 'Προς Αναζήτηση', color: 'blue', alert: 'Εκκρεμεί αναζήτηση τηλεφώνου' },
    to_call:     { label: 'Προς Κλήση', color: 'blue', alert: '' },
    informed:    { label: 'Ενημερώθηκε', color: 'orange', alert: '' },
    appointment: { label: 'Κλεισμένο Ραντεβού', color: 'blue', alert: '' },
    no_show:     { label: 'Μη Προσέλευση', color: 'red', alert: 'Δεν προσήλθε στο ραντεβού' },
    suspended:   { label: 'Σε Αφαίρεση', color: 'blue', alert: '' },
    to_return:   { label: 'Προς Απόδοση', color: 'red', alert: 'Έληξε η αφαίρεση!' },
    inv1_next:   { label: 'Προς 1η Πρόσκληση', color: 'orange', alert: 'Αποστολή 1ης Πρόσκλησης' },
    inv1_sent:   { label: 'Αναμονή 1ου Αποδεικτικού', color: 'orange', alert: '' },
    inv2_next:   { label: 'Προς 2η Πρόσκληση', color: 'orange', alert: 'Αποστολή 2ης Πρόσκλησης' },
    inv2_sent:   { label: 'Αναμονή 2ου Αποδεικτικού', color: 'orange', alert: '' },
    inv3_next:   { label: 'Προς 3η Πρόσκληση', color: 'orange', alert: 'Αποστολή 3ης Πρόσκλησης' },
    inv3_sent:   { label: 'Αναμονή 3ου Αποδεικτικού', color: 'orange', alert: '' },
    return_service: { label: 'Επιστροφή στην Υπηρεσία', color: 'red', alert: 'Αποστολή φακέλου στην υπηρεσία' },
    closed:      { label: 'Ολοκληρωμένη', color: 'green', alert: '' }
  };

  function getPrimaryAction(c) {
    switch (c.state) {
      case 'search': return { label: 'Αναζήτηση Τηλεφώνου', action: () => actSearch(c) };
      case 'to_call': return { label: 'Καταχώρηση Κλήσης', action: () => actCall(c) };
      case 'informed': return { label: isPast(addDays(c.dates.phone, 5)) ? 'Αποστολή 1ης' : 'Κλείσιμο Ραντεβού', action: () => isPast(addDays(c.dates.phone, 5)) ? actSendInvite(c, 1) : actSetAppt(c) };
      case 'appointment': return { label: 'Πραγματοποιήθηκε Αφαίρεση', action: () => actRemoval(c) };
      case 'no_show': return { label: 'Αποστολή 1ης Πρόσκλησης', action: () => actSendInvite(c, 1) };
      case 'to_return': return { label: 'Απόδοση Διπλώματος', action: () => actDeliver(c) };
      case 'inv1_next': return { label: 'Αποστολή 1ης', action: () => actSendInvite(c, 1) };
      case 'inv1_sent': return { label: 'Ήρθε Αποδεικτικό 1ης', action: () => actProof(c, 1) };
      case 'inv2_next': return { label: 'Αποστολή 2ης', action: () => actSendInvite(c, 2) };
      case 'inv2_sent': return { label: 'Ήρθε Αποδεικτικό 2ης', action: () => actProof(c, 2) };
      case 'inv3_next': return { label: 'Αποστολή 3ης', action: () => actSendInvite(c, 3) };
      case 'inv3_sent': return { label: 'Ήρθε Αποδεικτικό 3ης', action: () => actProof(c, 3) };
      case 'return_service': return { label: 'Επιστροφή στην Υπηρεσία', action: () => actClose(c) };
      default: return null;
    }
  }

  function setState(id, newState, extra = {}, logMsg = '') {
    const c = getCase(id);
    if (!c) return;
    c.state = newState;
    Object.assign(c.dates, extra);
    if (logMsg) c.history.push({ date: todayStr(), action: logMsg });
    if (newState === 'suspended' && c.dates.susp && c.removalDays) c.dates.return = addDays(c.dates.susp, c.removalDays);
    save(); render();
  }

  function openWizard(title, desc, buttons) {
    $('#wizardTitle').textContent = title;
    $('#wizardDesc').textContent = desc || '';
    $('#wizardContent').innerHTML = '';
    const actEl = $('#wizardActions');
    actEl.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn ' + (b.cls || '');
      btn.textContent = b.label;
      btn.onclick = () => { $('#dlgWizard').close(); b.fn(); };
      actEl.appendChild(btn);
    });
    $('#dlgWizard').showModal();
  }

  function openDatePrompt(title, desc, callback) {
    $('#wizardTitle').textContent = title;
    $('#wizardDesc').textContent = desc;
    $('#wizardContent').innerHTML = `<input type="date" id="wizDateVal" value="${todayStr()}" style="text-align:center; font-size:16px;">`;
    $('#wizardActions').innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'btn-ok'; btn.textContent = 'Αποθήκευση';
    btn.onclick = () => { const val = $('#wizDateVal').value; $('#dlgWizard').close(); if (val) callback(val); };
    $('#wizardActions').appendChild(btn);
    $('#dlgWizard').showModal();
  }

  function actSearch(c) {
    openWizard('Αναζήτηση Τηλεφώνου', 'Βρέθηκε τηλέφωνο;', [
      { label: 'Όχι – Δεν βρέθηκε', cls: 'danger', fn: () => setState(c.id, 'inv1_next', {}, 'Δεν βρέθηκε τηλέφωνο -> Μετάβαση σε Πρόσκληση') },
      { label: 'Ναι', cls: 'success', fn: () => {
          $('#wizardTitle').textContent = 'Εισαγωγή Τηλεφώνου';
          $('#wizardDesc').textContent = 'Πληκτρολογήστε τον αριθμό:';
          $('#wizardContent').innerHTML = `<input type="tel" id="wizPhone" style="text-align:center; font-size:16px;">`;
          $('#wizardActions').innerHTML = '';
          const btn = document.createElement('button');
          btn.className = 'btn-ok'; btn.textContent = 'Αποθήκευση';
          btn.onclick = () => {
            const ph = $('#wizPhone').value.trim();
            if (ph) { $('#dlgWizard').close(); setState(c.id, 'to_call', { phone: ph }, `Καταχώρηση τηλεφώνου: ${ph}`); }
          };
          $('#wizardActions').appendChild(btn);
          $('#dlgWizard').showModal();
      }}
    ]);
  }

  function actCall(c) {
    openWizard('Καταχώρηση Κλήσης', 'Απάντησε ο πολίτης;', [
      { label: 'Όχι', cls: 'danger', fn: () => setState(c.id, 'inv1_next', {}, 'Κλήση χωρίς απάντηση -> Μετάβαση σε Πρόσκληση') },
      { label: 'Ναι', cls: 'success', fn: () => {
          openWizard('Ραντεβού', 'Έκλεισε ραντεβού;', [
            { label: 'Όχι – Ενημερώθηκε (Αναμονή 5 ημερών)', cls: 'danger', fn: () => setState(c.id, 'informed', { phone: todayStr() }, 'Ενημερώθηκε, δεν έκλεισε ραντεβού. Αναμονή 5 ημερών.') },
            { label: 'Ναι', cls: 'success', fn: () => openDatePrompt('Ημερομηνία Ραντεβού', 'Επιλέξτε ημερομηνία:', (val) => setState(c.id, 'appointment', { appt: val, phone: c.dates.phone || todayStr() }, `Κλείσιμο ραντεβού για: ${val}`)) }
          ]);
      }}
    ]);
  }

  function actSetAppt(c) { openDatePrompt('Κλείσιμο Ραντεβού', 'Ημερομηνία ραντεβού:', (val) => setState(c.id, 'appointment', { appt: val }, `Νέο ραντεβού: ${val}`)); }
  function actRemoval(c) { openDatePrompt('Πραγματοποιήθηκε Αφαίρεση', 'Ημερομηνία αφαίρεσης:', (val) => setState(c.id, 'suspended', { susp: val }, `Αφαίρεση διπλώματος στις ${val}. Λήγει: ${addDays(val, c.removalDays)}`)); }
  function actDeliver(c) { openDatePrompt('Απόδοση Διπλώματος', 'Ημερομηνία απόδοσης:', (val) => setState(c.id, 'closed', { closed: val }, `Απόδοση διπλώματος και οριστικό κλείσιμο στις ${val}`)); }
  function actClose(c) { setState(c.id, 'closed', { closed: todayStr() }, 'Επιστροφή στην υπηρεσία και κλείσιμο'); }
  
  function actSendInvite(c, n) {
    const field = n === 1 ? 'inv1Send' : n === 2 ? 'inv2Send' : 'inv3Send';
    const nextState = n === 1 ? 'inv1_sent' : n === 2 ? 'inv2_sent' : 'inv3_sent';
    setState(c.id, nextState, { [field]: todayStr() }, `Αποστολή ${n}ης Πρόσκλησης`);
  }

  function actProof(c, n) {
    openDatePrompt(`Αποδεικτικό ${n}ης`, 'Ημερομηνία παραλαβής:', (val) => {
      const field = n === 1 ? 'inv1Proof' : n === 2 ? 'inv2Proof' : 'inv3Proof';
      const nextState = n === 1 ? 'inv2_next' : n === 2 ? 'inv3_next' : 'return_service';
      setState(c.id, nextState, { [field]: val }, `Παραλαβή αποδεικτικού ${n}ης στις ${val}`);
    });
  }

  let folderFilter = 'all', stateFilter = 'all', q = '';
  
  function render() {
    cases.forEach(c => {
      if (c.state === 'informed' && isPast(addDays(c.dates.phone, 5))) c.state = 'inv1_next';
      if (c.state === 'appointment' && isPast(addDays(c.dates.appt, 5))) c.state = 'no_show';
      if (c.state === 'suspended' && c.dates.return && isPast(c.dates.return)) c.state = 'to_return';
    });
    save();

    const folderMap = {};
    cases.forEach(c => { const f = c.folder || '(χωρίς φάκελο)'; folderMap[f] = (folderMap[f] || 0) + 1; });
    const fNames = Object.keys(folderMap).sort();
    $('#folderFilters').innerHTML = `<button class="f-chip ${folderFilter==='all'?'active':''}" data-f="all">Όλοι <b>${cases.length}</b></button>` +
      fNames.map(f => `<button class="f-chip ${folderFilter===f?'active':''}" data-f="${f}">${f} <b>${folderMap[f]}</b></button>`).join('');

    const stateCounts = {};
    cases.forEach(c => { stateCounts[c.state] = (stateCounts[c.state] || 0) + 1; });
    let stateHtml = `<button class="f-chip ${stateFilter==='all'?'active':''}" data-s="all">Όλα</button>`;
    Object.keys(ST).forEach(k => {
      if (stateCounts[k] > 0) stateHtml += `<button class="f-chip ${stateFilter===k?'active':''}" data-s="${k}">${ST[k].label} <b>${stateCounts[k]}</b></button>`;
    });
    $('#stateFilters').innerHTML = stateHtml;

    const urgent = cases.filter(c => ['no_show','to_return','return_service'].includes(c.state) || (c.state === 'informed' && isPast(addDays(c.dates.phone, 5))));
    if (urgent.length) $('#banners').innerHTML = `<div class="banner"><span class="count">${urgent.length}</span> Επείγουσες Εκκρεμότητες</div>`;
    else $('#banners').innerHTML = '';

    const filtered = cases.filter(c => {
      if (folderFilter !== 'all' && (c.folder || '(χωρίς φάκελο)') !== folderFilter) return false;
      if (stateFilter !== 'all' && c.state !== stateFilter) return false;
      if (!q) return true;
      return [c.name, c.plate, c.folder, c.phone].join(' ').toLowerCase().includes(q.toLowerCase());
    }).sort((a,b) => {
      const urgA = ['no_show','to_return','return_service'].includes(a.state) ? 1 : 0;
      const urgB = ['no_show','to_return','return_service'].includes(b.state) ? 1 : 0;
      if (urgA !== urgB) return urgB - urgA;
      return (b.receivedDate || '').localeCompare(a.receivedDate || '');
    });

    $('#casesList').innerHTML = filtered.map(c => {
      const st = ST[c.state] || ST.search;
      const isMinimal = ['search','to_call','inv1_next'].includes(c.state);
      let alertHtml = '';
      
      if (c.state === 'informed') alertHtml = `<div class="card-alert warn">Αναμονή 5 ημερών (${formatDate(addDays(c.dates.phone, 5))})</div>`;
      if (c.state === 'appointment') alertHtml = `<div class="card-alert ok">Ραντεβού: ${formatDate(c.dates.appt)} (Έλεγχος: ${formatDate(addDays(c.dates.appt, 5))})</div>`;
      if (c.state === 'suspended') alertHtml = `<div class="card-alert ok">Σε αφαίρεση (${c.removalDays} ημ.). Λήγει: ${formatDate(c.dates.return)}</div>`;
      if (c.state === 'no_show') alertHtml = `<div class="card-alert danger">Μη προσέλευση στο ραντεβού!</div>`;
      if (c.state === 'to_return') alertHtml = `<div class="card-alert danger">Έληξε η αφαίρεση! Προς Απόδοση.</div>`;
      if (c.state === 'return_service') alertHtml = `<div class="card-alert danger">Επιστροφή στην Υπηρεσία!</div>`;

      let actionHtml = '';
      const act = getPrimaryAction(c);
      if (c.state === 'to_call' && c.phone) actionHtml += `<a href="tel:${c.phone}" class="phone-link">${c.phone}</a>`;
      if (c.state === 'appointment') actionHtml += `<a href="${calLink(c)}" target="_blank" class="cal-link">Προσθήκη στο Google Calendar</a>`;
      if (act) actionHtml += `<button class="btn-primary" data-act="${c.id}">${act.label}</button>`;

      const details = [
        c.service ? `<span><b>Υπηρεσία:</b> ${c.service}</span>` : '',
        c.folder ? `<span><b>Φάκελος:</b> ${c.folder}</span>` : '',
        `<span><b>Παραλαβή:</b> ${formatDate(c.receivedDate)}</span>`,
        c.phone && c.state !== 'to_call' ? `<span><b>Τηλ:</b> <a href="tel:${c.phone}" style="color:var(--blue); font-weight:700;">${c.phone}</a></span>` : '',
        c.violationType ? `<span><b>Παράβαση:</b> ${c.violationType}</span>` : '',
        c.fine ? `<span><b>Πρόστιμο:</b> ${c.fine} €</span>` : '',
        c.removalDays ? `<span><b>Ημέρες αφαίρεσης:</b> ${c.removalDays}</span>` : '',
      ].filter(Boolean).join('');

      return `
        <article class="card st-${st.color}" data-id="${c.id}">
          <div class="card-main">
            <div class="card-header">
              <div><div class="card-title">${c.name}</div><div class="card-plate">${c.plate}</div></div>
              <span class="badge" style="background:var(--${st.color}-bg); color:var(--${st.color}-ink);">${st.label}</span>
            </div>
            ${!isMinimal ? alertHtml : `<div style="font-size:13px; color:var(--muted); margin-bottom:8px;">${st.alert}</div>`}
            <div class="action-area">${actionHtml}</div>
            <button class="details-toggle" data-toggle="${c.id}">+ Λεπτομέρειες</button>
          </div>
          <div class="card-details" id="det-${c.id}">
            <div class="detail-row">${details}</div>
            ${c.notes ? `<div class="detail-notes">${c.notes}</div>` : ''}
            <div style="display:flex; gap:8px; margin-top:12px;">
              <button class="btn-secondary" style="flex:1" data-edit="${c.id}">Επεξεργασία</button>
              <button class="history-btn" style="flex:1" data-history="${c.id}">Ιστορικό (${c.history.length})</button>
            </div>
          </div>
        </article>
      `;
    }).join('') || '<div style="text-align:center; padding:40px; color:var(--muted);">Δεν βρέθηκαν υποθέσεις.</div>';

    $$('[data-act]').forEach(b => b.onclick = e => { e.stopPropagation(); getPrimaryAction(getCase(b.dataset.act)).action(); });
    $$('[data-toggle]').forEach(b => b.onclick = e => { e.stopPropagation(); $(`#det-${b.dataset.toggle}`).classList.toggle('open'); b.textContent = $(`#det-${b.dataset.toggle}`).classList.contains('open') ? '− Απόκρυψη' : '+ Λεπτομέρειες'; });
    $$('[data-edit]').forEach(b => b.onclick = e => { e.stopPropagation(); openForm(b.dataset.edit); });
    $$('[data-history]').forEach(b => b.onclick = e => { e.stopPropagation(); openHistory(b.dataset.history); });
  }

  function calLink(c) {
    if (!c.dates.appt) return '#';
    const d = c.dates.appt.replace(/-/g,'');
    const title = encodeURIComponent(`Ραντεβού: ${c.name} (${c.plate})`);
    const details = encodeURIComponent(`Τηλ: ${c.phone || '—'} | Φάκελος: ${c.folder || '—'}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}T090000Z/${d}T100000Z&ctz=Europe/Athens&details=${details}`;
  }

  // --- MODALS & FORMS ---
  window.toggleAdvanced = () => {
    const el = $('#advancedFields');
    const btn = $('#btnAdvancedToggle');
    if (el.style.display === 'none') {
      el.style.display = 'block';
      btn.textContent = '- Απόκρυψη Προχωρημένων';
      btn.style.background = '#cbd5e1';
    } else {
      el.style.display = 'none';
      btn.textContent = '+ Προχωρημένη Διόρθωση (Κατάσταση & Ημερομηνίες)';
      btn.style.background = '#e2e8f0';
    }
  };

  window.toggleFolderCustom = () => { $('#fFolderCustom').style.display = $('#fFolderSelect').value === 'custom' ? 'block' : 'none'; }
  window.toggleViolationCustom = () => { $('#fViolationCustom').style.display = $('#fViolationSelect').value === 'custom' ? 'block' : 'none'; }
  window.toggleLicenseFields = () => { $('#licenseDaysWrap').style.display = $('#fReqLicense').checked ? 'flex' : 'none'; }

  function populateFolderSelect(currentFolder) {
    const folders = [...new Set(cases.map(c => c.folder).filter(Boolean))].sort();
    const sel = $('#fFolderSelect');
    sel.innerHTML = '<option value="">— Επιλέξτε —</option>' +
      folders.map(f => `<option value="${f}">${f}</option>`).join('') +
      '<option value="custom">+ Νέος Φάκελος...</option>';

    if (!currentFolder) {
      sel.value = '';
      $('#fFolderCustom').style.display = 'none';
    } else if (folders.includes(currentFolder)) {
      sel.value = currentFolder;
      $('#fFolderCustom').style.display = 'none';
    } else {
      sel.value = 'custom';
      $('#fFolderCustom').style.display = 'block';
      $('#fFolderCustom').value = currentFolder;
    }
  }

  function openForm(id) {
    const c = id ? getCase(id) : null;
    const f = $('#caseForm');
    f.reset();
    $('#formTitle').textContent = c ? 'Επεξεργασία Υπόθεσης' : 'Νέα Υπόθεση';
    $('#btnFormDelete').style.display = c ? 'block' : 'none';
    
    $('#advancedFields').style.display = 'none';
    $('#btnAdvancedToggle').textContent = '+ Προχωρημένη Διόρθωση (Κατάσταση & Ημερομηνίες)';
    $('#btnAdvancedToggle').style.background = '#e2e8f0';

    populateFolderSelect(c ? c.folder : '');

    if (c) {
      f.plate.value = c.plate; f.name.value = c.name; f.service.value = c.service || '';
      f.phone.value = c.phone || ''; f.receivedDate.value = c.receivedDate;
      
      if (['Υπερβολική ταχύτητα', 'ΚΤΕΟ', 'Διόδια', 'Στάθμευση', 'Απόφαση'].includes(c.violationType)) {
        f.violationType.value = c.violationType; f.violationOther.value = '';
      } else if (c.violationType) {
        f.violationType.value = 'custom'; f.violationOther.value = c.violationType;
      } else { f.violationType.value = ''; f.violationOther.value = ''; }
      
      f.fine.value = c.fine || ''; f.requiresLicense.checked = c.removalDays > 0;
      f.removalDays.value = c.removalDays || 30; f.notes.value = c.notes || '';
      
      f.manualState.value = c.state;
      f.d_phone.value = c.dates.phone || ''; f.d_appt.value = c.dates.appt || '';
      f.d_susp.value = c.dates.susp || ''; f.d_return.value = c.dates.return || '';
      f.d_inv1Send.value = c.dates.inv1Send || ''; f.d_inv1Proof.value = c.dates.inv1Proof || '';
      f.d_inv2Send.value = c.dates.inv2Send || ''; f.d_inv2Proof.value = c.dates.inv2Proof || '';
      f.d_inv3Send.value = c.dates.inv3Send || ''; f.d_inv3Proof.value = c.dates.inv3Proof || '';
    } else {
      f.receivedDate.value = todayStr(); f.requiresLicense.checked = true;
    }
    
    let stateOpts = '';
    for (const k in ST) stateOpts += `<option value="${k}">${ST[k].label}</option>`;
    f.manualState.innerHTML = stateOpts;

    toggleLicenseFields(); toggleViolationCustom();
    f.dataset.id = id || '';
    $('#dlgForm').showModal();
  }

  $('#caseForm').onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    const id = f.dataset.id || Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const old = getCase(id);
    const vType = f.violationType.value === 'custom' ? f.violationOther.value.trim() : f.violationType.value;
    const folder = f.folderSelect.value === 'custom' ? f.folderCustom.value.trim() : f.folderSelect.value;
    
    let calcReturn = f.d_return.value;
    if (f.d_susp.value && f.removalDays.value) calcReturn = addDays(f.d_susp.value, f.removalDays.value);

    const rec = {
      id, plate: f.plate.value.trim().toUpperCase(), name: f.name.value.trim(), service: f.service.value.trim(),
      phone: f.phone.value.trim(), receivedDate: f.receivedDate.value, folder,
      violationType: vType, fine: f.fine.value.trim(),
      requiresLicense: f.requiresLicense.checked, removalDays: f.requiresLicense.checked ? Number(f.removalDays.value) : 0,
      notes: f.notes.value.trim(),
      state: old ? f.manualState.value : (f.phone.value.trim() ? 'to_call' : 'search'),
      history: old ? old.history : [{ date: todayStr(), action: 'Δημιουργία Νέας Υπόθεσης' }],
      dates: {
        phone: old ? f.d_phone.value : '', 
        appt: old ? f.d_appt.value : '', 
        susp: old ? f.d_susp.value : '', 
        return: calcReturn,
        inv1Send: old ? f.d_inv1Send.value : '', 
        inv1Proof: old ? f.d_inv1Proof.value : '',
        inv2Send: old ? f.d_inv2Send.value : '', 
        inv2Proof: old ? f.d_inv2Proof.value : '',
        inv3Send: old ? f.d_inv3Send.value : '', 
        inv3Proof: old ? f.d_inv3Proof.value : '',
        closed: old ? old.dates.closed : ''
      }
    };

    if (old) {
      rec.history.push({ date: todayStr(), action: 'Χειροκίνητη επεξεργασία στοιχείων' });
      cases[cases.findIndex(x => x.id === id)] = rec;
    } else {
      cases.unshift(rec);
    }
    save(); render(); $('#dlgForm').close();
  };

  $('#btnFormDelete').onclick = () => {
    if (confirm('Οριστική διαγραφή υπόθεσης;')) {
      cases = cases.filter(x => x.id !== $('#caseForm').dataset.id);
      save(); render(); $('#dlgForm').close();
    }
  };

  function openHistory(id) {
    const c = getCase(id);
    if (!c) return;
    $('#historyContent').innerHTML = [...c.history].reverse().map(h => `
      <div class="history-item">
        <span>${h.action}</span>
        <time>${formatDate(h.date)}</time>
      </div>
    `).join('');
    $('#dlgHistory').showModal();
  }

  // --- EVENT LISTENERS ---
  $('#btnNew').onclick = () => openForm(null);
  $('#searchInput').oninput = e => { q = e.target.value; render(); };
  $('#btnFormCancel').onclick = () => $('#dlgForm').close();
  $('#btnHistoryClose').onclick = () => $('#dlgHistory').close();
  $('#fReqLicense').onchange = toggleLicenseFields;
  $('#fViolationSelect').onchange = toggleViolationCustom;
  $('#fFolderSelect').onchange = toggleFolderCustom;
  $('#btnAdvancedToggle').onclick = toggleAdvanced;
  
  $('#folderFilters').onclick = e => { const b = e.target.closest('.f-chip'); if (b) { folderFilter = b.dataset.f; render(); } };
  $('#stateFilters').onclick = e => { const b = e.target.closest('.f-chip'); if (b) { stateFilter = b.dataset.s; render(); } };

  const exportData = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cases, null, 2)], {type:'application/json'}));
    a.download = `ypotheseis_${todayStr()}.json`; a.click();
  };
  $('#btnExport').onclick = exportData;
  
  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (Array.isArray(arr)) {
          if (confirm('Η εισαγωγή θα αντικαταστήσει τις τρέχουσες υποθέσεις. Συνέχεια;')) {
            cases = arr.map(o => migrateCase(o));
            save(); render(); alert('Επιτυχής επαναφορά!');
          }
        }
      } catch { alert('Μη έγκυρο αρχείο.'); }
    };
    r.readAsText(file);
  };

  $('#btnPrint').onclick = () => {
    let html = `<h1>ΚΑΤΑΣΤΑΣΗ ΥΠΟΘΕΣΕΩΝ</h1><div style="font-size:10px; margin-bottom:10px;">Ημερομηνία: ${formatDate(todayStr())} | Σύνολο: ${cases.length}</div>`;
    html += `<table><thead><tr><th>Α/Α</th><th>Πινακίδα</th><th>Ονοματεπώνυμο</th><th>Τηλέφωνο</th><th>Κατάσταση</th><th>Ραντεβού</th><th>Απόδοση</th><th>Φάκελος</th></tr></thead><tbody>`;
    cases.forEach((c,i) => {
      html += `<tr>
        <td>${i+1}</td>
        <td><b>${c.plate}</b></td>
        <td>${c.name}</td>
        <td>${c.phone || '—'}</td>
        <td>${(ST[c.state]||{}).label || '—'}</td>
        <td>${c.dates.appt ? formatDate(c.dates.appt) : '—'}</td>
        <td>${c.dates.return ? formatDate(c.dates.return) : '—'}</td>
        <td>${c.folder || '—'}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    $('#printArea').innerHTML = html;
    window.print();
  };

  migrateData();
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();