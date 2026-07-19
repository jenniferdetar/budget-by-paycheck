import { useState } from 'react'
import { formatDate, formatMoney, sum, todayISO } from '../lib/format'

export default function ExpenseTracker({ entries, expenseItems, onAdd, onDelete }) {
  const [entryDate, setEntryDate] = useState(todayISO())
  const [lineItemId, setLineItemId] = useState(expenseItems[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [adding, setAdding] = useState(false)

  const itemsById = Object.fromEntries(expenseItems.map((i) => [i.id, i]))
  const total = sum(entries, 'amount')

  async function handleAdd(e) {
    e.preventDefault()
    if (!lineItemId || !amount) return
    setAdding(true)
    try {
      await onAdd({ entryDate, lineItemId, amount: Number(amount), description })
      setAmount('')
      setDescription('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="card section-card">
      <h2>Expense Tracker</h2>
      <p className="muted small">
        Log every purchase here — it automatically rolls up into the matching category's Actual total above.
      </p>

      {expenseItems.length === 0 ? (
        <p className="muted">Add an expense category above before logging purchases.</p>
      ) : (
        <>
          <form className="add-row expense-tracker-row" onSubmit={handleAdd}>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            <select value={lineItemId} onChange={(e) => setLineItemId(e.target.value)}>
              {expenseItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="money-input money-input-form">
              <span className="money-prefix">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={adding}>
              Log
            </button>
          </form>

          <div className="table-scroll">
            <table className="line-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th className="col-item">Description</th>
                  <th className="num">Amount</th>
                  <th className="col-narrow" aria-label="Delete" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.entry_date)}</td>
                    <td>{itemsById[entry.line_item_id]?.name || '—'}</td>
                    <td>{entry.description}</td>
                    <td className="num">{formatMoney(entry.amount)}</td>
                    <td className="col-narrow">
                      <button type="button" className="icon-btn" aria-label="Remove" onClick={() => onDelete(entry.id)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>
                    <strong>Total</strong>
                  </td>
                  <td className="num">
                    <strong>{formatMoney(total)}</strong>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
