import { useEffect, useState } from 'react'
import {
  bulkCreateReferenceItems,
  createReferenceItem,
  deleteReferenceItem,
  listReferenceItems,
  updateReferenceItem,
} from '../lib/api'
import { SECTIONS } from '../lib/format'
import { STARTER_PRESETS } from '../lib/starterPresets'

const SECTION_ORDER = ['bill', 'expense', 'savings', 'debt']

export default function ReferencesPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState(
    Object.fromEntries(SECTION_ORDER.map((s) => [s, { name: '', amount: '' }])),
  )
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  async function handleSeedStarters() {
    setSeeding(true)
    try {
      await bulkCreateReferenceItems(STARTER_PRESETS)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSeeding(false)
    }
  }

  async function refresh() {
    try {
      setItems(await listReferenceItems())
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAdd(section, e) {
    e.preventDefault()
    const draft = drafts[section]
    if (!draft.name.trim()) return
    try {
      await createReferenceItem({
        section,
        name: draft.name.trim(),
        defaultAmount: draft.amount ? Number(draft.amount) : null,
      })
      setDrafts((d) => ({ ...d, [section]: { name: '', amount: '' } }))
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdateAmount(id, amount) {
    try {
      await updateReferenceItem(id, { default_amount: amount === '' ? null : Number(amount) })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteReferenceItem(id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>References</h1>
          <p className="page-subtitle">
            Reusable presets for your recurring bills, expenses, savings, and debts. Typing a saved name into a pay
            period will auto-fill its budget amount.
          </p>
        </div>
        {items && items.length === 0 && (
          <button type="button" className="btn btn-secondary" onClick={handleSeedStarters} disabled={seeding}>
            {seeding ? 'Loading…' : 'Load starter categories'}
          </button>
        )}
      </div>

      {error && <div className="banner error">{error}</div>}

      {items === null ? (
        <div className="page-loading">Loading…</div>
      ) : (
        <div className="section-grid">
          {SECTION_ORDER.map((section) => {
            const sectionItems = items.filter((i) => i.section === section)
            const draft = drafts[section]
            return (
              <section className="card section-card" key={section}>
                <h2>{SECTIONS[section].label}</h2>
                <div className="table-scroll">
                  <table className="line-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="num">Default amount</th>
                        <th aria-label="Delete" />
                      </tr>
                    </thead>
                    <tbody>
                      {sectionItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td className="num">
                            <input
                              type="number"
                              step="0.01"
                              className="cell-input num"
                              value={item.default_amount ?? ''}
                              onChange={(e) => handleUpdateAmount(item.id, e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label="Remove"
                              onClick={() => handleDelete(item.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sectionItems.length === 0 && (
                        <tr>
                          <td colSpan={3} className="muted">
                            No presets yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <form className="add-row" onSubmit={(e) => handleAdd(section, e)}>
                  <input
                    placeholder="Item name…"
                    value={draft.name}
                    onChange={(e) => setDrafts((d) => ({ ...d, [section]: { ...d[section], name: e.target.value } }))}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Default amount"
                    value={draft.amount}
                    onChange={(e) => setDrafts((d) => ({ ...d, [section]: { ...d[section], amount: e.target.value } }))}
                  />
                  <button type="submit" className="btn btn-secondary">
                    Add
                  </button>
                </form>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
