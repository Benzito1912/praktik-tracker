const CONSENT_KEY = 'zb_consent_v1'
const SESSION_KEY = 'zb_analytics_session_v1'
const MAX_AGE = 365 * 24 * 60 * 60 * 1000
let lastTracked = ''

export function readConsent() {
  try { const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); return saved?.choice && saved.savedAt && Date.now() - saved.savedAt <= MAX_AGE ? saved.choice : null } catch { return null }
}
export function saveConsent(choice) { localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, savedAt: Date.now(), version: 1 })); window.dispatchEvent(new CustomEvent('zb-consent-change')) }
function sessionId() { let id = sessionStorage.getItem(SESSION_KEY); if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, id) } return id }
function referrer() { try { const host = document.referrer && new URL(document.referrer).hostname; return host && host !== location.hostname ? host.slice(0, 255) : null } catch { return null } }
async function track() {
  if (readConsent() !== 'analytics') return
  const path = `${location.pathname}${location.hash}`.slice(0, 500)
  if (lastTracked === path) return
  lastTracked = path
  const width = innerWidth
  await supabase?.from('analytics_events').insert({ site: 'praktiktracker', event_name: 'page_view', path, session_id: sessionId(), referrer_host: referrer(), device_type: width < 640 ? 'Mobil' : width < 1024 ? 'Tablet' : 'Computer', locale: navigator.language.slice(0, 20), consent_version: '1' })
}
import { supabase } from './supabase'
export function startAnalytics() { const run = () => void track(); run(); addEventListener('hashchange', run); addEventListener('popstate', run); addEventListener('zb-consent-change', run); return () => { removeEventListener('hashchange', run); removeEventListener('popstate', run); removeEventListener('zb-consent-change', run) } }
