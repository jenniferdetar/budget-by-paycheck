import { useState } from 'react'
import { formatMoney, sum } from '../lib/format'

export default function LineItemSection({
  title,
  section,
  items,
  referenceOptions = [],
  showDueDate = false,
  dueDateLabel = 'Due',
  showPaid = false,
  showSinkingFund = false,
  actualEditable = true,
  computeActual,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [adding, setAdding] = useState(false)

  const budgetTotal = sum(items, 'budget_amount')
  const actualTotal = items.reduce(
    (acc, item) => acc + (computeActual ? computeActual(item) : Number(item.actual_amount) || 0),
    0,
  )

  function handlePickReference(value) {
    setName(value)
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
                  <input
                    className="cell-input"
                    value={item.name}
                    onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  />
                </td>
                {showDueDate && (
                  <td>
                    <input
                      type="date"
                      className="cell-input"
                      value={item.due_date || ''}
                      onChange={(e) => onUpdate(item.id, { due_date: e.target.value || null })}
                    />
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
                  <div className="money-input">
                    <span className="money-prefix">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="cell-input num"
                      value={item.budget_amount}
                      onChange={(e) => onUpdate(item.id, { budget_amount: Number(e.target.value) || 0 })}
                    />
                  </div>
                </td>
                <td className="num">
                  {actualEditable ? (
                    <div className="money-input">
                      <span className="money-prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="cell-input num"
                        value={item.actual_amount}
                        onChange={(e) => onUpdate(item.id, { actual_amount: Number(e.target.value) || 0 })}
                      />
                    </div>
                  ) : (
                    <span className="computed-value">{formatMoney(computeActual ? computeActual(item) : 0)}</span>
                  )}
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
            placeholder="Budget"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={adding}>
          Add
        </button>
      </form>
    </section>
  )
}
