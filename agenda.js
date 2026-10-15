'use strict';
const element = id => document.getElementById(id);
let client;
let currentUserId = null;
let viewRevision = 0;
let busy = false;

function message(text, isError = false) {
  element('notice').hidden = true;
  element('error').hidden = true;
  if (text) {
    const target = element(isError ? 'error' : 'notice');
    target.textContent = text;
    target.hidden = false;
  }
}
function explain(error) {
  if (error.code === 'invalid_credentials') return 'Anmeldung fehlgeschlagen. Bitte E-Mail-Adresse und Passwort prüfen.';
  if (error.code === 'email_not_confirmed') return 'Das Konto ist noch nicht bestätigt. Bitte die organisierende Person kontaktieren.';
  if (error.status === 429) return 'Zu viele Anmeldeversuche. Bitte kurz warten und erneut versuchen.';
  if (error.code === '42501') return 'Keine Berechtigung für diese Aktion. Bitte erneut anmelden oder die organisierende Person kontaktieren.';
  if (error.name === 'AbortError' || error.name === 'TimeoutError') return 'Die Verbindung dauert zu lange. Bitte erneut versuchen.';
  return 'Der Vorgang konnte nicht abgeschlossen werden. Bitte die Verbindung prüfen und erneut versuchen.';
}
function setBusy(value) {
  busy = value;
  document.querySelectorAll('button,input').forEach(control => { control.disabled = value; });
  element('agenda-form').setAttribute('aria-busy', String(value));
  element('login-form').setAttribute('aria-busy', String(value));
}
async function perform(action) {
  if (busy) return false;
  setBusy(true);
  message('');
  try { await action(); return true; }
  catch (error) { message(explain(error), true); return false; }
  finally { setBusy(false); }
}
function resetList() {
  element('agenda-items').replaceChildren();
  element('empty').hidden = true;
  element('item-count').textContent = 'Wird geladen …';
  element('updated').textContent = '';
}
function showSession(session) {
  const id = session?.user?.id || null;
  if (id === currentUserId) return false;
  currentUserId = id;
  viewRevision += 1;
  resetList();
  element('login-view').hidden = Boolean(id);
  element('app-view').hidden = !id;
  element('session-label').textContent = id ? `Angemeldet: ${session.user.email}` : '';
  element('password').value = '';
  element('agenda-form').reset();
  return true;
}
async function loadAgenda() {
  const revision = viewRevision;
  resetList();
  const { data, error } = await client.from('pm_agenda_items')
    .select('id,start_time,title').order('start_time').order('created_at').order('id')
    .abortSignal(AbortSignal.timeout(15000));
  if (error) {
    element('item-count').textContent = 'Nicht geladen';
    throw error;
  }
  // Eine Antwort aus einer früheren Anmeldung darf nach dem Abmelden nicht mehr sichtbar werden.
  if (revision !== viewRevision || !currentUserId) return;
  for (const entry of data) {
    const row = document.createElement('li');
    const time = document.createElement('time');
    time.dateTime = entry.start_time;
    time.textContent = entry.start_time;
    const title = document.createElement('span');
    title.textContent = entry.title;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Entfernen';
    remove.setAttribute('aria-label', `${entry.title} um ${entry.start_time} entfernen`);
    remove.addEventListener('click', async () => {
      const success = await perform(async () => {
        const { error: deleteError } = await client.from('pm_agenda_items').delete().eq('id', entry.id)
          .abortSignal(AbortSignal.timeout(15000));
        if (deleteError) throw deleteError;
        message('Agendapunkt entfernt.');
        await loadAgenda();
      });
      if (success) element('agenda-title').focus();
    });
    row.append(time, title, remove);
    element('agenda-items').append(row);
  }
  element('item-count').textContent = `${data.length} ${data.length === 1 ? 'Programmpunkt' : 'Programmpunkte'}`;
  element('empty').hidden = data.length !== 0;
  element('updated').textContent = `Stand: ${new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date())} Uhr`;
}
element('login-form').addEventListener('submit', event => {
  event.preventDefault();
  const password = element('password').value;
  element('password').value = '';
  perform(async () => {
    const { data, error } = await client.auth.signInWithPassword({ email: element('email').value.trim(), password });
    if (error) throw error;
    showSession(data.session);
    await loadAgenda();
  });
});
element('agenda-title').addEventListener('input', () => element('agenda-title').setCustomValidity(''));
element('agenda-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = element('agenda-title').value.trim();
  element('agenda-title').setCustomValidity(title ? '' : 'Bitte einen Agendapunkt eingeben.');
  if (!element('agenda-form').reportValidity()) return;
  perform(async () => {
    const { error } = await client.from('pm_agenda_items')
      .insert({ start_time: element('agenda-time').value, title })
      .abortSignal(AbortSignal.timeout(15000));
    if (error) throw error;
    // Erst nach bestätigter Speicherung leeren; bei einem Schreibfehler bleibt die Eingabe erhalten.
    element('agenda-form').reset();
    message('Agendapunkt gespeichert.');
    await loadAgenda();
  }).then(success => { if (success) element('agenda-time').focus(); });
});
element('refresh').addEventListener('click', () => perform(loadAgenda));
element('logout').addEventListener('click', () => perform(async () => {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
  showSession(null);
  message('Du bist abgemeldet.');
}));
async function initialize() {
  try {
    if (!window.supabase?.createClient) throw new Error('sdk_unavailable');
    client = window.supabase.createClient(window.TEAMTAG_CONFIG.supabaseUrl, window.TEAMTAG_CONFIG.publishableKey, {
      auth: { storage: window.sessionStorage, storageKey: 'teamtag-agenda-session', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    // Keine asynchronen SDK-Aufrufe im Auth-Callback: erst außerhalb der Auth-Sperre nachladen.
    client.auth.onAuthStateChange((event, session) => {
      window.setTimeout(() => {
        if (!showSession(session)) return;
        if (session && !busy) perform(loadAgenda);
        if (!session) message('Bitte melde dich an.');
      }, 0);
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (showSession(data.session) && data.session) await perform(loadAgenda);
  } catch {
    message('Die Agenda konnte nicht gestartet werden. Bitte die Seite über HTTP(S) öffnen und erneut laden.', true);
    element('login-button').disabled = true;
  }
}
initialize();
