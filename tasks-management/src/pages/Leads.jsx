import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useFetch } from '../hooks/useFetch'
import { leadsApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import { fmtDate, exportCSV } from '../utils/helpers'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LeadModal from './modals/LeadModal'

const PIPELINE    = ['New','Contacted','Qualified','Proposal','Closed Won','Closed Lost']
const PAGE_SIZES  = [10, 25, 50, 100]

export default function Leads() {
  const { can } = useApp()
  const toast = useToast()

  const [search,    setSearch]    = useState('')
  const [statusF,   setStatusF]   = useState('')
  const [sourceF,   setSourceF]   = useState('')
  const [exportPeriod, setExportPeriod] = useState('all')
  const [exportFrom,   setExportFrom]   = useState('')
  const [exportTo,     setExportTo]     = useState('')
  const [showExport,   setShowExport]   = useState(false)

  const [leadModal, setLeadModal] = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  // Pagination
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const { data: leads = [], loading, error, refetch } = useFetch(
    () => leadsApi.list({}),
    []
  )

  const filtered = useMemo(() => leads.filter(l => {
    const matchS  = !search  || l.name.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase())
    const matchSt = !statusF || l.status === statusF
    const matchSo = !sourceF || l.source === sourceF
    return matchS && matchSt && matchSo
  }), [leads, search, statusF, sourceF])

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, statusF, sourceF])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  )

  const sources = useMemo(() => [...new Set(leads.map(l => l.source))].sort(), [leads])

  async function handleDelete() {
    setDeleting(true)
    try {
      await leadsApi.remove(confirm.id)
      toast({ message: `Lead "${confirm.name}" deleted`, type: 'info' })
      setConfirm(null)
      refetch()
    } catch (e) {
      toast({ message: e.message, type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const exportFiltered = useMemo(() => {
    const now = new Date()
    let from, to
    if (exportPeriod === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (exportPeriod === 'quarter') {
      const q = Math.floor(now.getMonth() / 3)
      from = new Date(now.getFullYear(), q * 3, 1)
      to   = new Date(now.getFullYear(), q * 3 + 3, 0)
    } else if (exportPeriod === 'year') {
      from = new Date(now.getFullYear(), 0, 1)
      to   = new Date(now.getFullYear(), 11, 31)
    } else if (exportPeriod === 'range' && exportFrom && exportTo) {
      from = new Date(exportFrom); to = new Date(exportTo)
    }
    if (from && to) {
      return filtered.filter(l => { const d = new Date(l.date); return d >= from && d <= to })
    }
    return filtered
  }, [filtered, exportPeriod, exportFrom, exportTo])

  function handleExport() {
    if (!exportFiltered.length) { toast({ message: 'No leads to export for selected period', type: 'info' }); return }
    exportCSV(
      exportFiltered.map(l => ({
        'Lead Company':  l.company,
        'Lead Name':     l.name,
        'Email':         l.email,
        'Phone':         l.phone,
        'Source':        l.source,
        'Date':          l.date,
        'Status':        l.status,
        'Our Company':   l.segment,
        'Product Name':  l.product_name,
        'Notes':         l.notes,
      })),
      `leads-${exportPeriod}-${new Date().toISOString().slice(0,10)}.csv`
    )
    toast({ message: `${exportFiltered.length} leads exported`, type: 'success' })
    setShowExport(false)
  }

  const pipelineCounts = useMemo(() =>
    Object.fromEntries(PIPELINE.map(s => [s, leads.filter(l => l.status === s).length])),
    [leads]
  )

  function handlePageSizeChange(e) {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Lead Tracker</div>
          <div className="page-subtitle">
            {loading ? 'Loading…' : `${leads.length} leads`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          <button className="btn-ghost" onClick={() => setShowExport(v => !v)} disabled={!filtered.length}>
            <i className="fa-solid fa-download" /> Export CSV
          </button>
          {showExport && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 50,
              background: 'var(--color-card)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: 16, minWidth: 280, boxShadow: 'var(--shadow-md)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Export Period</p>
              {[['all','All time'],['month','This month'],['quarter','This quarter'],['year','This year'],['range','Custom range']].map(([v, label]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="exportP" checked={exportPeriod === v} onChange={() => setExportPeriod(v)} style={{ accentColor: 'var(--color-brand)' }} />
                  {label}
                </label>
              ))}
              {exportPeriod === 'range' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>From</label>
                    <input className="form-input" type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} style={{ padding: '6px 10px' }} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>To</label>
                    <input className="form-input" type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} style={{ padding: '6px 10px' }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => setShowExport(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={handleExport}>
                  <i className="fa-solid fa-download" /> Export {exportFiltered.length}
                </button>
              </div>
            </div>
          )}
          {can('add-lead') && (
            <button className="btn-primary" onClick={() => setLeadModal('new')}>
              <i className="fa-solid fa-plus" /> Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Pipeline chips */}
      {!loading && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PIPELINE.map(stage => (
            <button
              key={stage} type="button"
              className={`co-pill ${statusF === stage ? 'co-active' : ''}`}
              onClick={() => setStatusF(prev => prev === stage ? '' : stage)}
              style={{ fontSize: 12 }}
            >
              {stage}
              <span style={{ marginLeft: 5, background: 'rgba(0,0,0,.1)', borderRadius: 99, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                {pipelineCounts[stage] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input className="search-input" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={sourceF} onChange={e => setSourceF(e.target.value)}>
          <option value="">All Sources</option>
          {sources.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || statusF || sourceF) && (
          <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => { setSearch(''); setStatusF(''); setSourceF('') }}>
            <i className="fa-solid fa-xmark" /> Clear
          </button>
        )}
        <span className="result-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="section-card overflow-y-auto p-0">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>Lead Company</th>
                <th style={{ minWidth: 160 }}>Name</th>
                <th style={{ minWidth: 180 }}>Contact</th>
                <th style={{ minWidth: 130 }}>Product</th>
                <th style={{ width: 110 }}>Source</th>
                <th style={{ width: 100 }}>Date</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 130 }}>Our Company</th>
                <th style={{ width: 110 }}>Country</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10}>
                  <div className="empty-state">
                    <i className="fa-solid fa-filter" />
                    <p>No leads match your filters.</p>
                  </div>
                </td></tr>
              )}
              {paginated.map(lead => (
                <tr key={lead.id}>
                  <td style={{ fontSize: 12.5, fontWeight: 500 }}>{lead.company || <span style={{ color: 'var(--color-ink-muted)' }}>—</span>}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{lead.name}</div>
                    {lead.notes && (
                      <div style={{ fontSize: 11.5, color: 'var(--color-ink-muted)', marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.notes}
                      </div>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: 12.5 }}>
                    {lead.email && <div>{lead.email}</div>}
                    {lead.phone && <div>{lead.phone}</div>}
                  </td>
                  <td style={{ fontSize: 12.5 }}>{lead.product_name || <span style={{ color: 'var(--color-ink-muted)' }}>—</span>}</td>
                  <td><span className="tag">{lead.source}</span></td>
                  <td className="text-muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{fmtDate(lead.date)}</td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td style={{ fontSize: 12.5 }}>{lead.segment || <span style={{ color: 'var(--color-ink-muted)' }}>—</span>}</td>
                  <td style={{ fontSize: 12.5 }}>{lead.country || <span style={{ color: 'var(--color-ink-muted)' }}>—</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {can('edit-lead') && (
                        <button className="action-btn" title="Edit lead" onClick={() => setLeadModal(lead)}>
                          <i className="fa-solid fa-pen" />
                        </button>
                      )}
                      {can('delete-lead') && (
                        <button className="action-btn danger" title="Delete lead" onClick={() => setConfirm(lead)}>
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid var(--color-border)',
            fontSize: 13, color: 'var(--color-ink-muted)',
          }}>
            {/* Left: rows per page + range info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: '3px 8px', fontSize: 13, background: 'var(--color-card)', color: 'var(--color-ink)', cursor: 'pointer' }}
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
            </div>

            {/* Right: page buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setPage(1)} disabled={page === 1}
                style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                title="First page"
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                title="Previous page"
              >‹</button>

              {/* Page number pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => p === '…'
                  ? <span key={`ellipsis-${i}`} style={{ padding: '4px 6px', color: 'var(--color-ink-muted)' }}>…</span>
                  : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: p === page ? 700 : 400,
                        border: '1px solid var(--color-border)',
                        background: p === page ? 'var(--color-brand)' : 'var(--color-card)',
                        color: p === page ? '#fff' : 'var(--color-ink)',
                        cursor: 'pointer',
                      }}
                    >{p}</button>
                  )
                )
              }

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
                title="Next page"
              >›</button>
              <button
                onClick={() => setPage(totalPages)} disabled={page === totalPages}
                style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
                title="Last page"
              >»</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {leadModal && (
        <LeadModal
          lead={leadModal === 'new' ? null : leadModal}
          onClose={() => setLeadModal(null)}
          onSaved={() => {
            toast({ message: leadModal === 'new' ? 'Lead added' : 'Lead updated', type: 'success' })
            refetch()
          }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete Lead"
          message={`Delete lead "${confirm.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
