import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  createExpenseEntry,
  createLineItem,
  deleteExpenseEntry,
  deleteLineItem,
  getPayPeriod,
  listExpenseEntries,
  listLineItems,
  listReferenceItems,
  updateLineItem,
  updatePayPeriod,
} from '../lib/api'
import LineItemSection from '../components/LineItemSection'
import TransactionTracker from '../components/TransactionTracker'
import SummaryPanel from '../components/SummaryPanel'

export default function PayPeriodPage() {
  const { periodId } = useParams()
  const [period, setPeriod] = useState(null)
  const [items, setItems] = useState([])
  const [entries, setEntries] = useState([])
  const [references, setReferences] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [p, lineItems, transactionEntries, refs] = await Promise.all([
          getPayPeriod(periodId),
          listLineItems(periodId),
          listExpenseEntries(periodId),
          listReferenceItems(),
        ])
        if (cancelled) return
        setPeriod(p)
        setItems(lineItems)
        setEntries(transactionEntries)
        setReferences(refs)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [periodId])

  const bySection = useMemo(() => {
    const groups = { income: [], bill: [], expense: [], savings: [], debt: [] }
    for (const item of items) {
      groups[item.section]?.push(item)
    }
    return groups
  }, [items])

  const actualById = useMemo(() => {
    const map = {}
    for (const entry of entries) {
      if (!entry.line_item_id) continue
      map[entry.line_item_id] = (map[entry.line_item_id] || 0) + (Number(entry.amount) || 0)
    }
    return map
  }, [entries])

  function computeActual(item) {
    return actualById[item.id] || 0
  }

  const referencesBySection = useMemo(() => {
    const groups = { bill: [], expense: [], savings: [], debt: [] }
    for (const ref of references) {
      groups[ref.section]?.push(ref)
    }
    return groups
  }, [references])

  const referenceAmountByKey = useMemo(() => {
    const map = {}
    for (const ref of references) {
      if (ref.default_amount != null) {
        map[`${ref.section}:${ref.name}`] = Number(ref.default_amount)
      }
    }
    return map
  }, [references])

  function computeBudget(item) {
    const liveAmount = referenceAmountByKey[`${item.section}:${item.name}`]
    return liveAmount != null ? liveAmount : Number(item.budget_amount) || 0
  }

  async function refreshItems() {
    const lineItems = await listLineItems(periodId)
    setItems(lineItems)
  }

  async function handleAdd(section, fields) {
    try {
      await createLineItem(periodId, section, fields)
      await refreshItems()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdate(id, fields) {
    try {
      await updateLineItem(id, fields)
      await refreshItems()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteLineItem(id)
      await refreshItems()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddEntry(fields) {
    try {
      await createExpenseEntry(periodId, fields)
      setEntries(await listExpenseEntries(periodId))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteEntry(id) {
    try {
      await deleteExpenseEntry(id)
      setEntries(await listExpenseEntries(periodId))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDatesChange(field, value) {
    try {
      const updated = await updatePayPeriod(periodId, { [field]: value })
      setPeriod(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>
  if (!period) return <div className="page-loading">Pay period not found.</div>

  const incomeBudget = bySection.income.reduce((acc, i) => acc + computeBudget(i), 0)
  const incomeActual = bySection.income.reduce((acc, i) => acc + computeActual(i), 0)
  const billsBudget = bySection.bill.reduce((acc, i) => acc + computeBudget(i), 0)
  const billsActual = bySection.bill.reduce((acc, i) => acc + computeActual(i), 0)
  const expensesBudget = bySection.expense.reduce((acc, i) => acc + computeBudget(i), 0)
  const expensesActual = bySection.expense.reduce((acc, i) => acc + computeActual(i), 0)
  const savingsBudget = bySection.savings.reduce((acc, i) => acc + computeBudget(i), 0)
  const savingsActual = bySection.savings.reduce((acc, i) => acc + computeActual(i), 0)
  const debtBudget = bySection.debt.reduce((acc, i) => acc + computeBudget(i), 0)
  const debtActual = bySection.debt.reduce((acc, i) => acc + computeActual(i), 0)

  const remainingBudget = incomeBudget - (billsBudget + expensesBudget + savingsBudget + debtBudget)
  const remainingActual = incomeActual - (billsActual + expensesActual + savingsActual + debtActual)

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← All pay periods
      </Link>

      {error && <div className="banner error">{error}</div>}

      <div className="page-header period-header">
        <div>
          <h1>{period.label || 'Pay Period'}</h1>
          <p className="page-subtitle period-dates-edit">
            <span>For the period:</span>
            <input type="date" value={period.start_date} onChange={(e) => handleDatesChange('start_date', e.target.value)} />
            <span>to</span>
            <input type="date" value={period.end_date} onChange={(e) => handleDatesChange('end_date', e.target.value)} />
          </p>
        </div>
      </div>

      <div className="section-grid">
        <LineItemSection
          title="Income"
          section="income"
          items={bySection.income}
          showDueDate
          dueDateLabel="Date"
          budgetSource="manual"
          computeBudget={computeBudget}
          computeActual={computeActual}
          onAdd={(fields) => handleAdd('income', fields)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        <LineItemSection
          title="Bills"
          section="bill"
          items={bySection.bill}
          referenceOptions={referencesBySection.bill}
          showDueDate
          dueDateLabel="Due date"
          showPaid
          computeBudget={computeBudget}
          computeActual={computeActual}
          onAdd={(fields) => handleAdd('bill', fields)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        <LineItemSection
          title="Expenses"
          section="expense"
          items={bySection.expense}
          referenceOptions={referencesBySection.expense}
          computeBudget={computeBudget}
          computeActual={computeActual}
          onAdd={(fields) => handleAdd('expense', fields)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        <LineItemSection
          title="Savings"
          section="savings"
          items={bySection.savings}
          referenceOptions={referencesBySection.savings}
          showSinkingFund
          computeBudget={computeBudget}
          computeActual={computeActual}
          onAdd={(fields) => handleAdd('savings', fields)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        <LineItemSection
          title="Debt"
          section="debt"
          items={bySection.debt}
          referenceOptions={referencesBySection.debt}
          computeBudget={computeBudget}
          computeActual={computeActual}
          onAdd={(fields) => handleAdd('debt', fields)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        <SummaryPanel
          rows={[
            { label: 'Income', budget: incomeBudget, actual: incomeActual },
            { label: 'Bills', budget: billsBudget, actual: billsActual },
            { label: 'Expenses', budget: expensesBudget, actual: expensesActual },
            { label: 'Savings', budget: savingsBudget, actual: savingsActual },
            { label: 'Debt', budget: debtBudget, actual: debtActual },
          ]}
          remainingBudget={remainingBudget}
          remainingActual={remainingActual}
        />
      </div>

      <TransactionTracker entries={entries} lineItems={items} onAdd={handleAddEntry} onDelete={handleDeleteEntry} />
    </div>
  )
}
