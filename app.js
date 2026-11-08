(() => {
  // ==========================================
  // --- CONFIGURATION & CONSTANTS ---
  // ==========================================
  const KEY = 'troxonomika_final_v19';
  const OLD_KEYS = ['troxonomika_final_v18','troxonomika_final_v17','troxonomika_final_v16','troxonomika_final_v15','troxonomika_final_v14','troxonomika_final_v13','troxonomika_final_v12','troxonomika_final_v11','troxonomika_final_v10','troxonomika_final_v9','troxonomika_final_v8','troxonomika_final_v7','troxonomika_final_v6','troxonomika_final_v5','troxonomika_final_v4','ypotheseis_pwa_v1','ypotheseis.v1','troxonomika.cases.v1','ypotheseis.v2','ypotheseis_gemini_v1'];
  
  const ST = {
    search:      { label: 'Προς Αναζήτηση', color: 'primary', alert: 'Εκκρεμεί αναζήτηση τηλεφώνου' },
    to_call:     { label: 'Προς Κλήση', color: 'primary', alert: '' },
    informed:    { label: 'Ενημερώθηκε', color: 'warning', alert: '' },
    appointment: { label: 'Κλεισμένο Ραντεβού', color: 'primary', alert: '' },
    no_show:     { label: 'Μη Προσέλευση', color: 'error', alert: 'Δεν προσήλθε στο ραντεβού' },
    suspended:   { label: 'Σε Αφαίρεση', color: 'primary', alert: '' },
    to_return:   { label: 'Προς Απόδοση', color: 'error', alert: 'Έληξε η αφαίρεση!' },
    inv1_next:   { label: 'Προς 1η Πρόσκληση', color: 'warning', alert: 'Αποστολή 1ης Πρόσκλησης' },
    inv1_sent:   { label: 'Αναμονή 1ου Αποδεικτικού', color: 'warning', alert: '' },
    inv1_wait:   { label: 'Αναμονή 10ημ. (1ο Αποδ.)', color: 'warning', alert: '' },
    inv2_next:   { label: 'Προς 2η Πρόσκληση', color: 'warning', alert: 'Αποστολή 2ης Πρόσκλησης' },
    inv2_sent:   { label: 'Αναμονή 2ου Αποδεικτικού', color: 'warning', alert: '' },
    inv2_wait:   { label: 'Αναμονή 10ημ. (2ο Αποδ.)', color: 'warning', alert: '' },
    inv3_next:   { label: 'Προς 3η Πρόσκληση', color: 'warning', alert: 'Αποστολή 3ης Πρόσκλησης' },
    inv3_sent:   { label: 'Αναμονή 3ου Αποδεικτικού', color: 'warning', alert: '' },
    inv3_wait:   { label: 'Αναμονή 10ημ. (3ο Αποδ.)', color: 'warning', alert: '' },
    return_service: { label: 'Επιστροφή στην Υπηρεσία', color: 'error', alert: 'Αποστολή φακέλου στην υπηρεσία' },
    closed:      { label: 'Ολοκληρωμένη', color: 'success', alert: '' }
  };

  const DEFAULT_FOLDERS = {
    "Τηλέφωνα": ["Με ραντεβού", "Χωρίς ραντεβού"],
    "Προσκλήσεις": ["1η πρόσκληση", "2η πρόσκληση", "3η πρόσκληση"],
    "Αναμονή αποδεικτικού": ["Αναμονή αποδεικτικού"],
    "Εκκρεμότητες": ["Αναζήτηση τηλεφώνου", "Αποστολή πρόσκλησης", "Διαβίβαση σε Υπηρεσία", "Καταχώρηση POL"]
  };

  let cases = [];
  let folderFilter = 'all', stateFilter = 'all', q = '';

  // --- UTILS ---
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const DOM = {
    list: $('#casesList'), stateFilters: $('#stateFilters'), folderFilters: $('#folderFilters'),
    banners: $('#banners'), form: $('#caseForm'), dlgForm: $('#dlgForm'),
    dlgWizard: $('#dlgWizard'), dlgHistory: $('#dlgHistory')
  };

  // ==========================================
  // --- DATE SERVICE ---
  // ==========================================
  const DateService = {
    todayStr: () => {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    },
    formatDate: (v) => v ? new Date(v + 'T12:00:00').toLocaleDateString('el-GR') : '—',
    addDays: (dateStr, days) => {
      if (!dateStr) return '';
      let d = new Date(dateStr + 'T12:00:00');
      d.setDate(d.getDate() + Number(days));
      const day = d.getDay();
      if (day === 6) d.setDate(d.getDate() + 2); // Σάββατο -> Δευτέρα
      else if (day === 0) d.setDate(d.getDate() + 1); // Κυριακή -> Δευτέρα
      return d.toISOString().split('T')[0];
    },
    getReturnDate: (dateStr, days) => {
      if (!dateStr) return '';
      let d = new Date(dateStr + 'T12:00:00');
      d.setDate(d.getDate() + Number(days));
      const day = d.getDay();
      if (day === 6) d.setDate(d.getDate() - 1); // Σάββατο -> Παρασκευή
      if (day === 0) d.setDate(d.getDate() - 2); // Κυριακή -> Παρασκευή
      return d.toISOString().split('T')[0];
    },
    isPast: (dateStr) => {
      if (!dateStr) return false;
      return new Date(dateStr + 'T12:00:00') < new Date(DateService.todayStr() + 'T12:00:00');
    },
    isTodayOrPast: (dateStr) => {
      if (!dateStr) return false;
      return new Date(dateStr + 'T12:00:00') <= new Date(DateService.todayStr() + 'T12:00:00');
    }
  };

  // ==========================================
  // --- STORAGE SERVICE ---
  // ==========================================
  const StorageService = {
    save: () => localStorage.setItem(KEY, JSON.stringify(cases)),
    getCase: (id) => cases.find(x => x.id === id),
    
    migrateData: () => {
      const current = localStorage.getItem(KEY);
      if (current) { cases = JSON.parse(current) || []; return; }
      for (const oldKey of OLD_KEYS) {
        const oldData = localStorage.getItem(oldKey);
        if (!oldData) continue;
        try {
          const arr = JSON.parse(oldData);
          if (!Array.isArray(arr) || !arr.length) continue;
          cases = arr.map(o => StorageService.migrateCase(o));
          StorageService.save();
          setTimeout(() => alert(`Επιτυχής μεταφορά ${cases.length} υποθέσεων!`), 500);
          return;
        } catch(e) {}
      }
      cases = [];
    },

    migrateCase: (old) => {
      // Αν είναι ήδη στη νέα μορφή, επέστρεψέ το ως έχει
      if (old.state && old.dates) return old;

      let folder = old.folder || old.folderLocation || '';
      folder = folder.replace(/^[0-9]\.\s*/, ''); // Αφαίρεση αρίθμησης
      
      // Ενοποίηση παλιών φακέλων
      if (folder.toLowerCase().includes('τηλεφων')) {
        if (folder.toLowerCase().includes('ραντεβου')) folder = 'Τηλέφωνα - Με ραντεβού';
        else if (folder.toLowerCase().includes('χωρις')) folder = 'Τηλέφωνα - Χωρίς ραντεβού';
        else folder = 'Τηλέφωνα';
      } else if (folder.toLowerCase().includes('προσκλησ')) {
        folder = 'Προσκλήσεις';
      } else if (folder.toLowerCase().includes('αναμονη')) {
        folder = 'Αναμονή αποδεικτικού';
      } else if (folder.toLowerCase().includes('εκκρεμ')) {
        folder = 'Εκκρεμότητες';
      }

      const c = {
        id: old.id || Date.now().toString(36) + Math.random().toString(36).slice(2,6),
        plate: old.plate || old.ref || '',
        name: old.name || old.fullName || '',
        service: old.service || '',
        phone: old.phone || '',
        receivedDate: old.receivedDate || old.dateReceived || DateService.todayStr(),
        folder: folder,
        violationType: old.violationType || '',
        fine: old.fine || old.fineAmount || '',
        requiresLicense: old.requiresLicense !== false && old.hasRemoval !== false,
        removalDays: old.removalDays || old.suspDays || 30,
        notes: old.notes || '',
        state: StorageService.mapOldState(old),
        history: old.history || [{ date: DateService.todayStr(), action: 'Μεταφορά από παλιά έκδοση' }],
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
      if (c.dates.susp && c.removalDays && !c.dates.return) c.dates.return = DateService.getReturnDate(c.dates.susp, c.removalDays);
      return c;
    },

    mapOldState: (old) => {
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
  };

  // ==========================================
  // --- STATE MACHINE & ACTIONS ---
  // ==========================================
  function getPrimaryAction(c) {
    const today = DateService.todayStr();
    switch (c.state) {
      case 'search': return { label: 'Αναζήτηση Τηλεφώνου', action: () => UI.actSearch(c) };
      case 'to_call': return { label: 'Καταχώρηση Κλήσης', action: () => UI.actCall(c) };
      case 'informed': 
        const dueInf = DateService.addDays(c.dates.phone, 5);
        return { label: DateService.isTodayOrPast(dueInf) ? 'Αποστολή 1ης' : 'Κλείσιμο Ραντεβού', action: () => DateService.isTodayOrPast(dueInf) ? UI.actSendInvite(c, 1) : UI.actSetAppt(c) };
      case 'appointment': return { label: 'Πραγματοποιήθηκε Αφαίρεση', action: () => UI.actRemoval(c) };
      case 'no_show': return { label: 'Αποστολή 1ης Πρόσκλησης', action: () => UI.actSendInvite(c, 1) };
      case 'to_return': return { label: 'Απόδοση Διπλώματος', action: () => UI.actDeliver(c) };
      
      case 'inv1_next': return { label: 'Αποστολή 1ης', action: () => UI.actSendInvite(c, 1) };
      case 'inv1_sent': return { label: 'Ήρθε Αποδεικτικό 1ης', action: () => UI.actProof(c, 1) };
      case 'inv1_wait': 
        const due1 = DateService.addDays(c.dates.inv1Proof, 10);
        return { label: DateService.isTodayOrPast(due1) ? 'Αποστολή 2ης' : `Αναμονή έως ${DateService.formatDate(due1)}`, action: DateService.isTodayOrPast(due1) ? () => UI.actSendInvite(c, 2) : null };
      
      case 'inv2_next': return { label: 'Αποστολή 2ης', action: () => UI.actSendInvite(c, 2) };
      case 'inv2_sent': return { label: 'Ήρθε Αποδεικτικό 2ης', action: () => UI.actProof(c, 2) };
      case 'inv2_wait': 
        const due2 = DateService.addDays(c.dates.inv2Proof, 10);
        return { label: DateService.isTodayOrPast(due2) ? 'Αποστολή 3ης' : `Αναμονή έως ${DateService.formatDate(due2)}`, action: DateService.isTodayOrPast(due2) ? () => UI.actSendInvite(c, 3) : null };
      
      case 'inv3_next': return { label: 'Αποστολή 3ης', action: () => UI.actSendInvite(c, 3) };
      case 'inv3_sent': return { label: 'Ήρθε Αποδεικτικό 3ης', action: () => UI.actProof(c, 3) };
      case 'inv3_wait': 
        const due3 = DateService.addDays(c.dates.inv3Proof, 10);
        return { label: DateService.isTodayOrPast(due3) ? 'Επιστροφή Υπηρεσίας' : `Αναμονή έως ${DateService.formatDate(due3)}`, action: DateService.isTodayOrPast(due3) ? () => UI.actClose(c) : null };
      
      case 'return_service': return { label: 'Επιστροφή στην Υπηρεσία', action: () => UI.actClose(c) };
      default: return null;
    }
  }

  function setState(id, newState, extra = {}, logMsg = '') {
    const c = StorageService.getCase(id);
    if (!c) return;
    c.state = newState;
    Object.assign(c.dates, extra);
    if (logMsg) c.history.push({ date: DateService.todayStr(), action: logMsg });
    
    if (newState === 'suspended' && c.dates.susp && c.removalDays) {
      c.dates.return = DateService.getReturnDate(c.dates.susp, c.removalDays);
    }
    StorageService.save(); UI.render();
  }

  // ==========================================
  // --- UI & RENDER SERVICE ---
  // ==========================================
  const UI = {
    render: () => {
      // 1. Auto-update states
      cases.forEach(c => {
        if (c.state === 'informed' && DateService.isTodayOrPast(DateService.addDays(c.dates.phone, 5))) c.state = 'inv1_next';
        if (c.state === 'appointment' && DateService.isTodayOrPast(DateService.addDays(c.dates.appt, 5))) c.state = 'no_show';
        if (c.state === 'suspended' && c.dates.return && DateService.isTodayOrPast(c.dates.return)) c.state = 'to_return';
      });
      StorageService.save();

      // 2. Filters
      const folderMap = {};
      cases.forEach(c => { const f = c.folder || '(χωρίς φάκελο)'; folderMap[f] = (folderMap[f] || 0) + 1; });
      const fNames = Object.keys(folderMap).sort();
      
      DOM.folderFilters.innerHTML = `<button class="f-chip ${folderFilter==='all'?'active':''}" data-f="all" style="flex-shrink:0;">Όλοι <b>${cases.length}</b></button>` +
        fNames.map(f => `<button class="f-chip ${folderFilter===f?'active':''}" data-f="${f}" style="flex-shrink:0;">${esc(f)} <b>${folderMap[f]}</b></button>`).join('');

      const stateCounts = {};
      cases.forEach(c => { stateCounts[c.state] = (stateCounts[c.state] || 0) + 1; });
      let stateHtml = `<button class="f-chip ${stateFilter==='all'?'active':''}" data-s="all" style="flex-shrink:0;">Όλα</button>`;
      Object.keys(ST).forEach(k => {
        if (stateCounts[k] > 0) stateHtml += `<button class="f-chip ${stateFilter===k?'active':''}" data-s="${k}" style="flex-shrink:0;">${ST[k].label} <b>${stateCounts[k]}</b></button>`;
      });
      DOM.stateFilters.innerHTML = stateHtml;

      // 3. Banners
      const urgent = cases.filter(c => ['no_show','to_return','return_service'].includes(c.state) || (c.state === 'informed' && DateService.isTodayOrPast(DateService.addDays(c.dates.phone, 5))));
      if (urgent.length) {
        DOM.banners.innerHTML = urgent.map(c => `
          <div class="banner" style="margin-bottom:8px; display:block; cursor:pointer;" onclick="document.getElementById('searchInput').value='${esc(c.plate)}'; document.getElementById('searchInput').dispatchEvent(new Event('input'));">
            <strong>${esc(c.name)}</strong> (${esc(c.plate)})<br>
            <span style="font-weight:normal; font-size:12px;">
            ${c.state === 'no_show' ? 'Μη προσέλευση στο ραντεβού.' : ''}
            ${c.state === 'to_return' ? 'Έληξε η αφαίρεση, προς απόδοση.' : ''}
            ${c.state === 'return_service' ? 'Επιστροφή στην υπηρεσία.' : ''}
            ${c.state === 'informed' ? 'Πέρασαν 5 μέρες από την ενημέρωση.' : ''}
            </span>
            ${c.phone ? `<br>Τηλ: <a href="tel:${esc(c.phone)}" style="color:inherit; font-weight:bold;">${esc(c.phone)}</a>` : ''}
          </div>
        `).join('');
      } else {
        DOM.banners.innerHTML = '';
      }

      // 4. Cards
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

      DOM.list.innerHTML = filtered.map(c => UI.renderCard(c)).join('') || '<div style="text-align:center; padding:40px; color:var(--md-sys-color-secondary);">Δεν βρέθηκαν υποθέσεις.</div>';
    },

    renderCard: (c) => {
      const st = ST[c.state] || ST.search;
      const isMinimal = ['search','to_call','inv1_next'].includes(c.state);
      let alertHtml = '';
      
      if (c.state === 'informed') alertHtml = `<div class="card-alert warn">Αναμονή 5 ημερών (${DateService.formatDate(DateService.addDays(c.dates.phone, 5))})</div>`;
      if (c.state === 'appointment') alertHtml = `<div class="card-alert ok">Ραντεβού: ${DateService.formatDate(c.dates.appt)} (Έλεγχος: ${DateService.formatDate(DateService.addDays(c.dates.appt, 5))})</div>`;
      if (c.state === 'suspended') alertHtml = `<div class="card-alert ok">Σε αφαίρεση (${c.removalDays} ημ.). Λήγει: ${DateService.formatDate(c.dates.return)}</div>`;
      if (c.state === 'no_show') alertHtml = `<div class="card-alert danger">Μη προσέλευση στο ραντεβού!</div>`;
      if (c.state === 'to_return') alertHtml = `<div class="card-alert danger">Έληξε η αφαίρεση! Προς Απόδοση.</div>`;
      if (c.state === 'return_service') alertHtml = `<div class="card-alert danger">Επιστροφή στην Υπηρεσία!</div>`;

      let actionHtml = '';
      const act = getPrimaryAction(c);
      
      if (c.state === 'to_call' && c.phone) actionHtml += `<a href="tel:${esc(c.phone)}" class="phone-link">${esc(c.phone)}</a>`;
      
      if (c.state === 'appointment') {
        actionHtml += `<a href="${UI.calLink(c)}" target="_blank" class="cal-link">Προσθήκη στο Google Calendar</a>`;
        actionHtml += `<button class="btn-primary" data-act="${c.id}">Πραγματοποιήθηκε Αφαίρεση</button>`;
        actionHtml += `<button class="btn-secondary" data-resched="${c.id}" style="margin-top:8px;">Αλλαγή Ραντεβού</button>`;
      } else if (act) {
        if (act.action) {
          actionHtml += `<button class="btn-primary" data-act="${c.id}">${esc(act.label)}</button>`;
        } else {
          actionHtml += `<div class="card-alert warn" style="justify-content:center;">${esc(act.label)}</div>`;
        }
      }

      const details = [
        c.service ? `<span><b>Υπηρεσία:</b> ${esc(c.service)}</span>` : '',
        c.folder ? `<span><b>Φάκελος:</b> ${esc(c.folder)}</span>` : '',
        `<span><b>Παραλαβή:</b> ${DateService.formatDate(c.receivedDate)}</span>`,
        c.phone && c.state !== 'to_call' ? `<span><b>Τηλ:</b> <a href="tel:${esc(c.phone)}" style="color:var(--md-sys-color-primary); font-weight:700;">${esc(c.phone)}</a></span>` : '',
        c.violationType ? `<span><b>Παράβαση:</b> ${esc(c.violationType)}</span>` : '',
        c.fine ? `<span><b>Πρόστιμο:</b> ${esc(c.fine)} €</span>` : '',
        c.removalDays ? `<span><b>Ημέρες αφαίρεσης:</b> ${esc(c.removalDays)}</span>` : '',
      ].filter(Boolean).join('');

      return `
        <article class="card st-${st.color}" data-id="${c.id}">
          <div class="card-main">
            <div class="card-header">
              <div><div class="card-title">${esc(c.name)}</div><div class="card-plate">${esc(c.plate)}</div></div>
              <span class="badge bg-${st.color}">${st.label}</span>
            </div>
            ${!isMinimal ? alertHtml : `<div style="font-size:13px; color:var(--md-sys-color-secondary); margin-bottom:8px;">${st.alert}</div>`}
            <div class="action-area">${actionHtml}</div>
            <button class="details-toggle" data-toggle="${c.id}">+ Λεπτομέρειες</button>
          </div>
          <div class="card-details" id="det-${c.id}">
            <div class="detail-row">${details}</div>
            ${c.notes ? `<div class="detail-notes">${esc(c.notes)}</div>` : ''}
            <div style="display:flex; gap:8px; margin-top:12px;">
              <button class="btn-secondary" style="flex:1" data-edit="${c.id}">Επεξεργασία</button>
              <button class="history-btn" style="flex:1" data-history="${c.id}">Ιστορικό (${c.history.length})</button>
            </div>
          </div>
        </article>
      `;
    },

    calLink: (c) => {
      if (!c.dates.appt) return '#';
      const d = c.dates.appt.replace(/-/g,'');
      const title = encodeURIComponent(`Ραντεβού: ${c.name} (${c.plate})`);
      const details = encodeURIComponent(`Τηλ: ${c.phone || '—'} | Φάκελος: ${c.folder || '—'}`);
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}T090000/${d}T093000&ctz=Europe/Athens&details=${details}`;
    },

    // Modal Helpers
    openWizard: (title, desc, buttons) => {
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
        btn.onclick = () => { DOM.dlgWizard.close(); b.fn(); };
        actEl.appendChild(btn);
      });
      DOM.dlgWizard.showModal();
    },

    openDatePrompt: (title, desc, callback) => {
      $('#wizardTitle').textContent = title;
      $('#wizardDesc').textContent = desc;
      $('#wizardContent').innerHTML = `<input type="date" id="wizDateVal" value="${DateService.todayStr()}" style="text-align:center; font-size:16px;">`;
      $('#wizardActions').innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'btn-ok'; btn.textContent = 'Αποθήκευση';
      btn.onclick = () => { const val = $('#wizDateVal').value; DOM.dlgWizard.close(); if (val) callback(val); };
      $('#wizardActions').appendChild(btn);
      DOM.dlgWizard.showModal();
    },

    // Wizard Flows
    actSearch: (c) => {
      UI.openWizard('Αναζήτηση Τηλεφώνου', 'Βρέθηκε τηλέφωνο;', [
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
              if (ph) { DOM.dlgWizard.close(); setState(c.id, 'to_call', { phone: ph }, `Καταχώρηση τηλεφώνου: ${ph}`); }
            };
            $('#wizardActions').appendChild(btn);
            DOM.dlgWizard.showModal();
        }}
      ]);
    },

    actCall: (c) => {
      UI.openWizard('Καταχώρηση Κλήσης', 'Απάντησε ο πολίτης;', [
        { label: 'Όχι', cls: 'danger', fn: () => setState(c.id, 'inv1_next', {}, 'Κλήση χωρίς απάντηση -> Μετάβαση σε Πρόσκληση') },
        { label: 'Ναι', cls: 'success', fn: () => {
            UI.openWizard('Ραντεβού', 'Έκλεισε ραντεβού;', [
              { label: 'Όχι – Ενημερώθηκε (Αναμονή 5 ημερών)', cls: 'danger', fn: () => setState(c.id, 'informed', { phone: DateService.todayStr() }, 'Ενημερώθηκε, δεν έκλεισε ραντεβού. Αναμονή 5 ημερών.') },
              { label: 'Ναι', cls: 'success', fn: () => UI.openDatePrompt('Ημερομηνία Ραντεβού', 'Επιλέξτε ημερομηνία:', (val) => setState(c.id, 'appointment', { appt: val, phone: c.dates.phone || DateService.todayStr() }, `Κλείσιμο ραντεβού για: ${val}`)) }
            ]);
        }}
      ]);
    },

    actSetAppt: (c) => UI.openDatePrompt('Κλείσιμο Ραντεβού', 'Ημερομηνία ραντεβού:', (val) => setState(c.id, 'appointment', { appt: val }, `Νέο ραντεβού: ${val}`)),
    
    actRemoval: (c) => {
      $('#wizardTitle').textContent = 'Πραγματοποιήθηκε Αφαίρεση';
      $('#wizardDesc').textContent = 'Ημερομηνία αφαίρεσης και ημέρες:';
      $('#wizardContent').innerHTML = `
        <input type="date" id="wizDateVal" value="${DateService.todayStr()}" style="text-align:center; font-size:16px; margin-bottom:8px;">
        <input type="number" id="wizDaysVal" value="${c.removalDays || 30}" style="text-align:center; font-size:16px;" placeholder="Ημέρες">
      `;
      $('#wizardActions').innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'btn-ok'; btn.textContent = 'Αποθήκευση';
      btn.onclick = () => {
        const dateVal = $('#wizDateVal').value;
        const daysVal = Number($('#wizDaysVal').value);
        DOM.dlgWizard.close();
        if (dateVal && daysVal > 0) {
          c.removalDays = daysVal; // Ενημέρωση ημερών
          setState(c.id, 'suspended', { susp: dateVal }, `Αφαίρεση διπλώματος στις ${dateVal}. Λήγει: ${DateService.getReturnDate(dateVal, daysVal)}`);
        }
      };
      $('#wizardActions').appendChild(btn);
      DOM.dlgWizard.showModal();
    },

    actDeliver: (c) => UI.openDatePrompt('Απόδοση Διπλώματος', 'Ημερομηνία απόδοσης:', (val) => setState(c.id, 'closed', { closed: val }, `Απόδοση διπλώματος και οριστικό κλείσιμο στις ${val}`)),
    actClose: (c) => setState(c.id, 'closed', { closed: DateService.todayStr() }, 'Επιστροφή στην υπηρεσία και κλείσιμο'),

    actSendInvite: (c, n) => {
      const field = n === 1 ? 'inv1Send' : n === 2 ? 'inv2Send' : 'inv3Send';
      const nextState = n === 1 ? 'inv1_sent' : n === 2 ? 'inv2_sent' : 'inv3_sent';
      setState(c.id, nextState, { [field]: DateService.todayStr() }, `Αποστολή ${n}ης Πρόσκλησης`);
    },

    actProof: (c, n) => {
      UI.openDatePrompt(`Αποδεικτικό ${n}ης`, 'Ημερομηνία παραλαβής:', (val) => {
        const field = n === 1 ? 'inv1Proof' : n === 2 ? 'inv2Proof' : 'inv3Proof';
        const nextState = n === 1 ? 'inv1_wait' : n === 2 ? 'inv2_wait' : 'inv3_wait';
        setState(c.id, nextState, { [field]: val }, `Παραλαβή αποδεικτικού ${n}ης στις ${val}. Αναμονή 10 ημερών.`);
      });
    }
  };

  // ==========================================
  // --- FORM MANAGEMENT (MODALS) ---
  // ==========================================
  const Form = {
    toggleAdvanced: () => {
      const el = $('#advancedFields');
      const btn = $('#btnAdvancedToggle');
      if (el.style.display === 'none') {
        el.style.display = 'block';
        btn.textContent = '- Απόκρυψη Προχωρημένων';
        btn.style.background = '#cbd5e1';
      } else {
        el.style.display = 'none';
        btn.textContent = '+ Προχωρημένη Διόρθωση (Κατάσταση & Ημερομηνίες)';
        btn.style.background = '';
      }
    },
    toggleFolderCustom: () => { $('#fFolderCustom').style.display = $('#fFolderSelect').value === 'custom' ? 'block' : 'none'; },
    toggleViolationCustom: () => { $('#fViolationCustom').style.display = $('#fViolationSelect').value === 'custom' ? 'block' : 'none'; },
    toggleLicenseFields: () => { $('#licenseDaysWrap').style.display = $('#fReqLicense').checked ? 'flex' : 'none'; },

    populateFolderSelect: (currentFolder) => {
      const sel = $('#fFolderSelect');
      let html = '<option value="">— Επιλέξτε —</option>';
      
      for (const [group, subFolders] of Object.entries(DEFAULT_FOLDERS)) {
        html += `<optgroup label="${group}">`;
        subFolders.forEach(sub => {
          const val = subFolders.length === 1 ? group : `${group} - ${sub}`;
          html += `<option value="${val}">${sub}</option>`;
        });
        html += `</optgroup>`;
      }

      const existingFolders = [...new Set(cases.map(c => c.folder).filter(Boolean))];
      const customFolders = existingFolders.filter(f => {
        return !Object.entries(DEFAULT_FOLDERS).some(([group, subs]) => 
          subs.some(sub => (subs.length === 1 ? group : `${group} - ${sub}`) === f)
        );
      });

      if (customFolders.length > 0) {
        html += `<optgroup label="Προσαρμοσμένοι Φάκελοι">`;
        customFolders.sort().forEach(f => {
          html += `<option value="${esc(f)}">${esc(f)}</option>`;
        });
        html += `</optgroup>`;
      }

      html += '<option value="custom">+ Νέος Φάκελος...</option>';
      sel.innerHTML = html;

      if (!currentFolder) {
        sel.value = '';
        $('#fFolderCustom').style.display = 'none';
      } else if (existingFolders.includes(currentFolder)) {
        sel.value = currentFolder;
        $('#fFolderCustom').style.display = 'none';
      } else {
        sel.value = 'custom';
        $('#fFolderCustom').style.display = 'block';
        $('#fFolderCustom').value = currentFolder;
      }
    },

    open: (id) => {
      const c = id ? StorageService.getCase(id) : null;
      const f = DOM.form;
      f.reset();
      $('#formTitle').textContent = c ? 'Επεξεργασία Υπόθεσης' : 'Νέα Υπόθεση';
      $('#btnFormDelete').style.display = c ? 'block' : 'none';
      
      $('#advancedFields').style.display = 'none';
      $('#btnAdvancedToggle').textContent = '+ Προχωρημένη Διόρθωση (Κατάσταση & Ημερομηνίες)';
      $('#btnAdvancedToggle').style.background = '';

      // Χτίσιμο των options ΠΡΙΝ οριστεί η τιμή
      let stateOpts = '';
      for (const k in ST) stateOpts += `<option value="${k}">${ST[k].label}</option>`;
      f.manualState.innerHTML = stateOpts;

      Form.populateFolderSelect(c ? c.folder : '');

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
        f.receivedDate.value = DateService.todayStr(); f.requiresLicense.checked = true;
      }

      Form.toggleLicenseFields(); Form.toggleViolationCustom();
      f.dataset.id = id || '';
      DOM.dlgForm.showModal();
    },

    save: (e) => {
      e.preventDefault();
      const f = e.target;
      const id = f.dataset.id || Date.now().toString(36) + Math.random().toString(36).slice(2,6);
      const old = StorageService.getCase(id);
      const vType = f.violationType.value === 'custom' ? f.violationOther.value.trim() : f.violationType.value;
      const folder = f.folderSelect.value === 'custom' ? f.folderCustom.value.trim() : f.folderSelect.value;
      
      let calcReturn = f.d_return.value;
      if (f.d_susp.value && f.removalDays.value) calcReturn = DateService.getReturnDate(f.d_susp.value, f.removalDays.value);

      const rec = {
        id, plate: f.plate.value.trim().toUpperCase(), name: f.name.value.trim(), service: f.service.value.trim(),
        phone: f.phone.value.trim(), receivedDate: f.receivedDate.value, folder,
        violationType: vType, fine: f.fine.value.trim(),
        requiresLicense: f.requiresLicense.checked, removalDays: f.requiresLicense.checked ? Number(f.removalDays.value) : 0,
        notes: f.notes.value.trim(),
        state: old ? f.manualState.value : (f.phone.value.trim() ? 'to_call' : 'search'),
        history: old ? old.history : [{ date: DateService.todayStr(), action: 'Δημιουργία Νέας Υπόθεσης' }],
        dates: {
          phone: old ? f.d_phone.value : '', appt: old ? f.d_appt.value : '', susp: old ? f.d_susp.value : '', 
          return: calcReturn,
          inv1Send: old ? f.d_inv1Send.value : '', inv1Proof: old ? f.d_inv1Proof.value : '',
          inv2Send: old ? f.d_inv2Send.value : '', inv2Proof: old ? f.d_inv2Proof.value : '',
          inv3Send: old ? f.d_inv3Send.value : '', inv3Proof: old ? f.d_inv3Proof.value : '',
          closed: old ? old.dates.closed : ''
        }
      };

      if (old) {
        rec.history.push({ date: DateService.todayStr(), action: 'Χειροκίνητη επεξεργασία στοιχείων' });
        cases[cases.findIndex(x => x.id === id)] = rec;
      } else {
        cases.unshift(rec);
      }
      StorageService.save(); UI.render(); DOM.dlgForm.close();
    }
  };

  // ==========================================
  // --- EVENT DELEGATION & GLOBAL LISTENERS ---
  // ==========================================
  
  DOM.list.addEventListener('click', e => {
    const actBtn = e.target.closest('[data-act]');
    if (actBtn) { getPrimaryAction(StorageService.getCase(actBtn.dataset.act)).action(); return; }

    const reschedBtn = e.target.closest('[data-resched]');
    if (reschedBtn) { UI.actSetAppt(StorageService.getCase(reschedBtn.dataset.resched)); return; }

    const toggleBtn = e.target.closest('[data-toggle]');
    if (toggleBtn) {
      const el = $(`#det-${toggleBtn.dataset.toggle}`);
      el.classList.toggle('open');
      toggleBtn.textContent = el.classList.contains('open') ? '− Απόκρυψη' : '+ Λεπτομέρειες';
      return;
    }

    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) { Form.open(editBtn.dataset.edit); return; }

    const historyBtn = e.target.closest('[data-history]');
    if (historyBtn) { UI.openHistoryModal(historyBtn.dataset.history); return; }
  });

  UI.openHistoryModal = (id) => {
    const c = StorageService.getCase(id);
    if (!c) return;
    $('#historyContent').innerHTML = [...c.history].reverse().map(h => `
      <div class="history-item">
        <span>${esc(h.action)}</span>
        <time>${DateService.formatDate(h.date)}</time>
      </div>
    `).join('');
    DOM.dlgHistory.showModal();
  };

  DOM.folderFilters.addEventListener('click', e => { const b = e.target.closest('.f-chip'); if (b) { folderFilter = b.dataset.f; UI.render(); } });
  DOM.stateFilters.addEventListener('click', e => { const b = e.target.closest('.f-chip'); if (b) { stateFilter = b.dataset.s; UI.render(); } });

  DOM.form.addEventListener('submit', Form.save);
  $('#fReqLicense').onchange = Form.toggleLicenseFields;
  $('#fViolationSelect').onchange = Form.toggleViolationCustom;
  $('#fFolderSelect').onchange = Form.toggleFolderCustom;
  $('#btnAdvancedToggle').onclick = Form.toggleAdvanced;
  $('#btnFormCancel').onclick = () => DOM.dlgForm.close();
  $('#btnHistoryClose').onclick = () => DOM.dlgHistory.close();
  $('#btnFormDelete').onclick = () => {
    if (confirm('Οριστική διαγραφή υπόθεσης;')) {
      cases = cases.filter(x => x.id !== DOM.form.dataset.id);
      StorageService.save(); UI.render(); DOM.dlgForm.close();
    }
  };

  $('#btnNew').onclick = () => Form.open(null);
  $('#searchInput').oninput = e => { q = e.target.value; UI.render(); };
  
  $('#btnExport').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cases, null, 2)], {type:'application/json'}));
    a.download = `ypotheseis_${DateService.todayStr()}.json`; a.click();
  };
  
  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (Array.isArray(arr)) {
          if (confirm('Η εισαγωγή θα αντικαταστήσει τις τρέχουσες υποθέσεις. Συνέχεια;')) {
            cases = arr.map(o => StorageService.migrateCase(o));
            StorageService.save(); UI.render(); alert('Επιτυχής επαναφορά!');
          }
        }
      } catch { alert('Μη έγκυρο αρχείο.'); }
    };
    r.readAsText(file);
  };

  $('#btnPrint').onclick = () => {
    let html = `<h1>ΚΑΤΑΣΤΑΣΗ ΥΠΟΘΕΣΕΩΝ</h1><div style="font-size:10px; margin-bottom:10px;">Ημερομηνία: ${DateService.formatDate(DateService.todayStr())} | Σύνολο: ${cases.length}</div>`;
    html += `<table><thead><tr><th>Α/Α</th><th>Πινακίδα</th><th>Ονοματεπώνυμο</th><th>Τηλέφωνο</th><th>Κατάσταση</th><th>Ραντεβού</th><th>Απόδοση</th><th>Φάκελος</th></tr></thead><tbody>`;
    cases.forEach((c,i) => {
      html += `<tr>
        <td>${i+1}</td>
        <td><b>${esc(c.plate)}</b></td>
        <td>${esc(c.name)}</td>
        <td>${esc(c.phone || '—')}</td>
        <td>${(ST[c.state]||{}).label || '—'}</td>
        <td>${c.dates.appt ? DateService.formatDate(c.dates.appt) : '—'}</td>
        <td>${c.dates.return ? DateService.formatDate(c.dates.return) : '—'}</td>
        <td>${esc(c.folder || '—')}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    $('#printArea').innerHTML = html;
    window.print();
  };

  StorageService.migrateData();
  UI.render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();
