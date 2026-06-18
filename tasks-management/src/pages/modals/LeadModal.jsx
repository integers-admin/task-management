import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { leadsApi } from '../../api/client'

const SOURCES   = ['Website','Social','Email','Referral','Cold Outreach','LinkedIn','Instagram','Event','Facebook ads','Alibaba','Third Party','Other']
const STATUSES  = ['New','Contacted','Qualified','Proposal','Closed Won','Closed Lost']
const OUR_COS   = ['Umang Global','Consumer','Integers','Umang Particle Science','Umang Encapsulation Solution','Umang Nutraceutical','Umang Engineering','Other']
const COUNTRIES = [
  'India','United States','United Kingdom','United Arab Emirates','Australia','Canada',
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Austria','Azerbaijan',
  'Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Brazil','Bulgaria','Cambodia',
  'Cameroon','Chile','China','Colombia','Croatia','Cyprus','Czech Republic','Denmark',
  'Ecuador','Egypt','Estonia','Ethiopia','Finland','France','Georgia','Germany','Ghana',
  'Greece','Guatemala','Hungary','Iceland','Indonesia','Iran','Iraq','Ireland','Israel',
  'Italy','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Latvia','Lebanon','Libya',
  'Lithuania','Luxembourg','Malaysia','Maldives','Malta','Mexico','Morocco','Myanmar',
  'Nepal','Netherlands','New Zealand','Nigeria','Norway','Oman','Pakistan','Panama',
  'Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia',
  'Saudi Arabia','Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea',
  'Spain','Sri Lanka','Sudan','Sweden','Switzerland','Taiwan','Tanzania','Thailand',
  'Tunisia','Turkey','Uganda','Ukraine','Uruguay','Uzbekistan','Venezuela','Vietnam',
  'Yemen','Zimbabwe','Other',
]

const BLANK = {
  company: '', name: '', email: '', phone: '',
  source: 'Website', date: new Date().toISOString().split('T')[0],
  status: 'New', segment: '', product_name: '', country: '', notes: '',
}

// RFC-4180 compliant CSV tokeniser — handles quoted fields with commas and newlines
function tokeniseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false, i = 0
  // normalise CRLF
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  while (i < s.length) {
    const ch = s[i]
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; continue }  // escaped quote
        inQ = false; i++; continue
      }
      field += ch; i++
    } else {
      if (ch === '"') { inQ = true; i++; continue }
      if (ch === ',') { row.push(field.trim()); field = ''; i++; continue }
      if (ch === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; i++; continue }
      field += ch; i++
    }
  }
  row.push(field.trim())
  if (row.some(f => f !== '')) rows.push(row)
  return rows
}

// Parse a CSV file → array of lead objects
function parseCSV(text) {
  const rows = tokeniseCSV(text)
  if (rows.length < 2) throw new Error('CSV must have a header row and at least one data row.')
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'))
  return rows.slice(1).map((vals, i) => {
    const row = Object.fromEntries(headers.map((h, idx) => [h, vals[idx] ?? '']))
    return {
      company:      row.lead_company  || '',
      name:         row.name          || '',
      email:        row.email         || '',
      phone:        row.phone         || '',
      source:       row.source        || 'Website',
      date:         row.date          || new Date().toISOString().split('T')[0],
      status:       row.status        || 'New',
      segment:      row.company       || '',
      product_name: row.product_name  || '',
      country:      row.country       || '',
      notes:        row.notes         || '',
    }
  })
}

export default function LeadModal({ lead, onClose, onSaved }) {
  const editing = !!lead
  const [form,        setForm]        = useState(lead ?? { ...BLANK })
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  // CSV import state
  const [csvMode,     setCsvMode]     = useState(false)
  const [csvRows,     setCsvRows]     = useState([])
  const [csvError,    setCsvError]    = useState('')
  const [csvParsed,   setCsvParsed]   = useState(false)
  const [importing,   setImporting]   = useState(false)
  const [importDone,  setImportDone]  = useState(null)  // { ok, fail }

  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    // if (!form.name.trim()) { setError('Lead name is required.'); return }
    setSaving(true); setError('')
    try {
      editing ? await leadsApi.update(lead.id, form) : await leadsApi.create(form)
      onSaved(); onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setCsvError(''); setCsvParsed(false); setCsvRows([]); setImportDone(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target.result)
        setCsvRows(rows)
        setCsvParsed(true)
      } catch (err) { setCsvError(err.message) }
    }
    reader.readAsText(file)
  }

  async function importCSV() {
    setImporting(true)
    try {
      const result = await leadsApi.bulkImport(csvRows)
      setImportDone({ ok: result.inserted, fail: result.failed, errors: result.errors || [] })
      if (result.inserted > 0) onSaved()
    } catch (e) {
      setCsvError(e.message)
    } finally {
      setImporting(false)
    }
  }

  // ── CSV mode UI ──────────────────────────────────────────────
  if (csvMode) {
    return (
      <Modal
        onClose={onClose}
        title="Bulk Import Leads (CSV)"
        maxWidth={540}
        footer={
          <>
            <button className="btn-ghost" onClick={() => { setCsvMode(false); setCsvRows([]); setCsvParsed(false); setImportDone(null) }} disabled={importing}>
              ← Back to manual
            </button>
            {csvParsed && !importDone && (
              <button className="btn-primary" onClick={importCSV} disabled={importing || !csvRows.length}>
                {importing ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <i className="fa-solid fa-file-import" />}
                {' '}Import {csvRows.length} leads
              </button>
            )}
            {importDone && (
              <button className="btn-primary" onClick={onClose}>
                <i className="fa-solid fa-check" /> Done
              </button>
            )}
          </>
        }
      >
        {/* Template download hint */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12.5, lineHeight: 1.7 }}>
          <strong>Required:</strong> <code>name</code><br />
          <strong>Optional:</strong> <code>lead_company, email, phone, source, date, status, company, product_name, country, notes</code>
        </div>

        {/* File input */}
        {!importDone && (
          <div className="form-group">
            <label className="form-label">Upload CSV file <span className="req">*</span></label>
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange}
              style={{ display: 'block', padding: '8px', border: '1.5px dashed var(--color-border)', borderRadius: 8, width: '100%', fontSize: 13, cursor: 'pointer' }} />
          </div>
        )}

        {csvError && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{csvError}</div>}

        {csvParsed && !importDone && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-ink)' }}>
              Preview — {csvRows.length} leads found
            </p>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface)' }}>
                    {['Company','Name','Email','Source','Status'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 10.5, color: 'var(--color-ink-soft)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 20).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '6px 10px' }}>{r.company}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--color-ink-muted)' }}>{r.email}</td>
                      <td style={{ padding: '6px 10px' }}>{r.source}</td>
                      <td style={{ padding: '6px 10px' }}>{r.status}</td>
                    </tr>
                  ))}
                  {csvRows.length > 20 && (
                    <tr><td colSpan={5} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--color-ink-soft)', fontSize: 12 }}>
                      +{csvRows.length - 20} more rows
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importDone && (
          <div style={{ textAlign: 'center', paddingTop: 24 }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 36, color: '#22C55E', display: 'block', marginBottom: 12 }} />
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Import Complete</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: importDone.errors?.length ? 16 : 0 }}>
              <span style={{ color: '#22C55E', fontWeight: 600 }}>{importDone.ok} imported</span>
              {importDone.fail > 0 && <span style={{ color: 'var(--color-red)', marginLeft: 12, fontWeight: 600 }}>{importDone.fail} failed</span>}
            </p>
            {importDone.errors?.length > 0 && (
              <div style={{ textAlign: 'left', maxHeight: 200, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface)', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>Row</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--color-border)' }}>Name</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--color-border)' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importDone.errors.map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '5px 10px', color: 'var(--color-red)', fontWeight: 600 }}>{e.row}</td>
                        <td style={{ padding: '5px 10px' }}>{e.name || '—'}</td>
                        <td style={{ padding: '5px 10px', color: 'var(--color-ink-muted)', fontSize: 11 }}>{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    )
  }

  // ── Manual entry UI ──────────────────────────────────────────
  return (
    <Modal
      onClose={onClose}
      title={editing ? 'Edit Lead' : 'New Lead'}
      footer={
        <>
          {!editing && (
            <button className="btn-ghost" style={{ marginRight: 'auto' }} onClick={() => setCsvMode(true)}>
              <i className="fa-solid fa-file-csv" /> Bulk Import CSV
            </button>
          )}
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
            {editing ? 'Save Changes' : 'Add Lead'}
          </button>
        </>
      }
    >
      {error && <div className="form-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="form-label">Lead Company</label>
          <input className="form-input" value={form.company} onChange={up('company')} placeholder="Prospect's company name" />
        </div>
        <div>
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={up('name')} placeholder="Person or company name" />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={up('email')} placeholder="email@example.com" />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone} onChange={up('phone')} placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className="form-label">Source <span className="req">*</span></label>
          <select className="form-select" value={form.source} onChange={up('source')}>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Date <span className="req">*</span></label>
          <input className="form-input" type="date" value={form.date} onChange={up('date')} />
        </div>
        <div>
          <label className="form-label">Status <span className="req">*</span></label>
          <select className="form-select" value={form.status} onChange={up('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Company</label>
          <select className="form-select" value={form.segment} onChange={up('segment')}>
            <option value="">— Select company —</option>
            {OUR_COS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Product Name</label>
          <input className="form-input" value={form.product_name || ''} onChange={up('product_name')} placeholder="Product or service name" />
        </div>
        <div>
          <label className="form-label">Country</label>
          <select className="form-select" value={form.country || ''} onChange={up('country')}>
            <option value="">— Select country —</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" rows={2} value={form.notes} onChange={up('notes')} placeholder="Any relevant notes…" />
        </div>
      </div>
    </Modal>
  )
}
