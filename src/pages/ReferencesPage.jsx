import { useEffect, useState } from 'react'
import {
  bulkCreateReferenceItems,
  createReferenceItem,
  deleteReferenceItem,
  listReferenceItems,
  updateReferenceItem,
} from '../lib/api'
import { formatMoney, roundUpToDollar, SECTIONS } from '../lib/format'
import { STARTER_PRESETS } from '../lib/starterPresets'

const SECTION_ORDER = ['bill', 'expense', 'savings', 'debt']
const EDIT_PASSWORD = 'Ble$$ed1'

export default function ReferencesPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState(
    Object.fromEntries(SECTION_ORDER.map((s) => [s, { name: '', amount: '' }])),
  )
  const [seeding, setSeeding] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [unlockError, setUnlockError] = useState('')

  useEffect(() => {
    refresh()
  }, [])

  function handleUnlock(e) {
    e.preventDefault()
    if (passwordInput === EDIT_PASSWORD) {
      setUnlocked(true)
      setPasswordInput('')
      setUnlockError('')
    } else {
      setUnlockError('Incorrect password.')
    }
  }

  function handleLock() {
    setUnlocked(false)
  }

  async function handleSeedStarters() {
    if (!unlocked) return
    setSeeding(true)
    try {
      await bulkCreateReferenceItems(
        STARTER_PRESETS.map((p) => ({ ...p, defaultAmount: roundUpToDollar(p.defaultAmount) })),
      )
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
    if (!unlocked) return
    const draft = drafts[section]
    if (!draft.name.trim()) return
    try {
      await createReferenceItem({
        section,
        name: draft.name.trim(),
        defaultAmount: roundUpToDollar(draft.amount),
      })
      setDrafts((d) => ({ ...d, [section]: { name: '', amount: '' } }))
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdateAmount(id, amount) {
    if (!unlocked) return
    try {
      await updateReferenceItem(id, { default_amount: roundUpToDollar(amount) })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!unlocked) return
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
            Reusable presets for your recurring bills, expenses, savings, and debts — the only place budgeted
            amounts can be set. Amounts round up to the next whole dollar. Typing a saved name into a pay period
            auto-fills its budget, but it can't be edited there.
          </p>
        </div>
        {unlocked ? (
          <button type="button" className="btn btn-ghost" onClick={handleLock}>
            🔓 Unlocked — Lock
          </button>
        ) : null}
      </div>

      {error && <div className="banner error">{error}</div>}

      {!unlocked && (
        <form className="card form-card unlock-card" onSubmit={handleUnlock}>
          <label>
            🔒 Enter password to change budgeted amounts
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoComplete="off"
            />
          </label>
          {unlockError && <div className="auth-message error">{unlockError}</div>}
          <button type="submit" className="btn btn-primary">
            Unlock
          </button>
        </form>
      )}

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
                        <th className="col-item">Item</th>
                        <th className="num">Default amount</th>
                        {unlocked && <th className="col-narrow" aria-label="Delete" />}
                      </tr>
                    </thead>
                    <tbody>
                      {sectionItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td className="num">
                            {unlocked ? (
                              <div className="money-input">
                                <span className="money-prefix">$</span>
                                <input
                                  type="number"
                                  step="1"
                                  className="cell-input num"
                                  value={item.default_amount ?? ''}
                                  onChange={(e) => handleUpdateAmount(item.id, e.target.value)}
                                />
                              </div>
                            ) : (
                              <span className="computed-value">
                                {item.default_amount != null ? formatMoney(item.default_amount) : '—'}
                              </span>
                            )}
                          </td>
                          {unlocked && (
                            <td className="col-narrow">
                              <button
                                type="button"
                                className="icon-btn"
                                aria-label="Remove"
                                onClick={() => handleDelete(item.id)}
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {sectionItems.length === 0 && (
                        <tr>
                          <td colSpan={unlocked ? 3 : 2} className="muted">
                            No presets yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {unlocked && (
                  <form className="add-row" onSubmit={(e) => handleAdd(section, e)}>
                    <input
                      placeholder="Item name…"
                      value={draft.name}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [section]: { ...d[section], name: e.target.value } }))
                      }
                    />
                    <div className="money-input money-input-form">
                      <span className="money-prefix">$</span>
                      <input
                        type="number"
                        step="1"
                        placeholder="Default amount"
                        value={draft.amount}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [section]: { ...d[section], amount: e.target.value } }))
                        }
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary">
                      Add
                    </button>
                  </form>
                )}
              </section>
            )
          })}
        </div>
      )}

      {unlocked && items && items.length === 0 && (
        <button type="button" className="btn btn-secondary" onClick={handleSeedStarters} disabled={seeding}>
          {seeding ? 'Loading…' : 'Load starter categories'}
        </button>
      )}
    </div>
  )
}
