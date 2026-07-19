import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPayPeriod, deletePayPeriod, listLineItems, listPayPeriods } from '../lib/api'
import { formatDate, formatMoney, sum, todayISO } from '../lib/format'

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const [periods, setPeriods] = useState(null)
  const [totalsByPeriod, setTotalsByPeriod] = useState({})
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState(addDays(todayISO(), 14))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    try {
      const data = await listPayPeriods()
      setPeriods(data)
      const entries = await Promise.all(
        data.map(async (p) => {
          const items = await listLineItems(p.id)
          const income = sum(items.filter((i) => i.section === 'income'), 'budget_amount')
          const outflow = sum(items.filter((i) => i.section !== 'income'), 'budget_amount')
          return [p.id, { income, outflow, remaining: income - outflow }]
        }),
      )
      setTotalsByPeriod(Object.fromEntries(entries))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const period = await createPayPeriod({
        label: label || null,
        startDate,
        endDate,
      })
      setShowForm(false)
      setLabel('')
      await refresh()
      window.location.assign(`/periods/${period.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this pay period and all of its budget data? This cannot be undone.')) return
    try {
      await deletePayPeriod(id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const overall = useMemo(() => {
    const values = Object.values(totalsByPeriod)
    return {
      income: sum(values, 'income'),
      outflow: sum(values, 'outflow'),
      remaining: sum(values, 'remaining'),
    }
  }, [totalsByPeriod])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pay Periods</h1>
          <p className="page-subtitle">Every paycheck gets its own budget: income, bills, expenses, savings, and debt.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New pay period'}
        </button>
      </div>

      {error && <div className="banner error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Label <span className="muted">(optional)</span>
              <input
                type="text"
                placeholder="e.g. July 1–15 paycheck"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Start date
              <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              End date
              <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create pay period'}
          </button>
        </form>
      )}

      {periods === null ? (
        <div className="page-loading">Loading…</div>
      ) : periods.length === 0 ? (
        <div className="empty-state card">
          <p>No pay periods yet. Create your first one to start budgeting.</p>
        </div>
      ) : (
        <>
          <div className="summary-strip">
            <div className="summary-tile">
              <span>Total Income</span>
              <strong>{formatMoney(overall.income)}</strong>
            </div>
            <div className="summary-tile">
              <span>Total Planned Out</span>
              <strong>{formatMoney(overall.outflow)}</strong>
            </div>
            <div className={`summary-tile ${overall.remaining < 0 ? 'negative' : 'positive'}`}>
              <span>Net Remaining</span>
              <strong>{formatMoney(overall.remaining)}</strong>
            </div>
          </div>

          <div className="period-grid">
            {periods.map((p) => {
              const totals = totalsByPeriod[p.id] || { income: 0, outflow: 0, remaining: 0 }
              return (
                <Link to={`/periods/${p.id}`} key={p.id} className="period-card">
                  <div className="period-card-head">
                    <h3>{p.label || 'Pay Period'}</h3>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(p.id)
                      }}
                      aria-label="Delete pay period"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="period-dates">
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                  </p>
                  <div className="period-card-totals">
                    <div>
                      <span>Income</span>
                      <strong>{formatMoney(totals.income)}</strong>
                    </div>
                    <div>
                      <span>Planned Out</span>
                      <strong>{formatMoney(totals.outflow)}</strong>
                    </div>
                    <div className={totals.remaining < 0 ? 'negative' : 'positive'}>
                      <span>Remaining</span>
                      <strong>{formatMoney(totals.remaining)}</strong>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
