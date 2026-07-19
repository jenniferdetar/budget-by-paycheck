import { useState } from 'react'
import { formatDate, formatMoney, sum } from '../lib/format'

export default function LineItemSection({
  title,
  section,
  items,
  referenceOptions = [],
  showDueDate = false,
  dueDateLabel = 'Due',
  showPaid = false,
  showSinkingFund = false,
  budgetSource = 'reference', // 'reference' (auto-filled, locked) | 'manual' (typed once at creation)
  computeActual,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [adding, setAdding] = useState(false)

  const manualBudget = budgetSource === 'manual'
  const budgetTotal = sum(items, 'budget_amount')
  const actualTotal = items.reduce((acc, item) => acc + (computeActual ? computeActual(item) : 0), 0)

  function handlePickReference(value) {
    setName(value)
    if (manualBudget) return
    const match = referenceOptions.find((r) => r.name === value)
    if (match && match.default_amount != null) {
      setBudgetAmount(String(match.default_amount))
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    try {
      await onAdd({
        name: name.trim(),
        dueDate: showDueDate && dueDate ? dueDate : null,
        budgetAmount: budgetAmount ? Number(budgetAmount) : 0,
      })
      setName('')
      setDueDate('')
      setBudgetAmount('')
    } finally {
      setAdding(false)
    }
  }

  const datalistId = `refs-${section}`

  return (
    <section className="card section-card">
      <h2>{title}</h2>
      <div className="table-scroll">
        <table className="line-table">
          <thead>
            <tr>
              <th className="col-item">Item</th>
              {showDueDate && <th>{dueDateLabel}</th>}
              {showSinkingFund && <th className="col-check">Sinking fund</th>}
              <th className="num">Budget</th>
              <th className="num">Actual</th>
              {showPaid && <th className="col-check">Paid</th>}
              <th className="col-narrow" aria-label="Delete" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="locked-value">{item.name}</span>
                </td>
                {showDueDate && (
                  <td>
                    <span className="locked-value">{formatDate(item.due_date) || '—'}</span>
                  </td>
                )}
                {showSinkingFund && (
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={!!item.is_sinking_fund}
                      onChange={(e) => onUpdate(item.id, { is_sinking_fund: e.target.checked })}
                    />
                  </td>
                )}
                <td className="num">
                  <span className="computed-value">{formatMoney(item.budget_amount)}</span>
                </td>
                <td className="num">
                  <span className="computed-value">{formatMoney(computeActual ? computeActual(item) : 0)}</span>
                </td>
                {showPaid && (
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={!!item.is_paid}
                      onChange={(e) => onUpdate(item.id, { is_paid: e.target.checked })}
                    />
                  </td>
                )}
                <td className="col-narrow">
                  <button type="button" className="icon-btn" aria-label="Remove" onClick={() => onDelete(item.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={showDueDate || showSinkingFund ? 2 : 1}>
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>{formatMoney(budgetTotal)}</strong>
              </td>
              <td className="num">
                <strong>{formatMoney(actualTotal)}</strong>
              </td>
              {showPaid && <td />}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <form className="add-row" onSubmit={handleAdd}>
        <input
          list={datalistId}
          placeholder={`Add ${title.toLowerCase()} item…`}
          value={name}
          onChange={(e) => handlePickReference(e.target.value)}
        />
        <datalist id={datalistId}>
          {referenceOptions.map((r) => (
            <option key={r.id} value={r.name} />
          ))}
        </datalist>
        {showDueDate && <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
        <div className="money-input money-input-form">
          <span className="money-prefix">$</span>
          <input
            type="number"
            step="0.01"
            placeholder={manualBudget ? 'Budget' : 'From References'}
            value={budgetAmount}
            readOnly={!manualBudget}
            title={manualBudget ? undefined : 'Budget comes from the matching References preset'}
            onChange={(e) => manualBudget && setBudgetAmount(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={adding}>
          Add
        </button>
      </form>
    </section>
  )
}
