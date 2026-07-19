export const SECTIONS = {
  income: { label: 'Income', totalLabel: 'Income Total' },
  bill: { label: 'Bills', totalLabel: 'Bills Total' },
  expense: { label: 'Expenses', totalLabel: 'Expenses Total' },
  savings: { label: 'Savings', totalLabel: 'Savings Total' },
  debt: { label: 'Debt', totalLabel: 'Debt Total' },
}

export const SECTION_ORDER = ['income', 'bill', 'expense', 'savings', 'debt']

export function formatMoney(value) {
  const n = Number(value) || 0
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatDate(value) {
  if (!value) return ''
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function sum(items, key) {
  return items.reduce((acc, item) => acc + (Number(item[key]) || 0), 0)
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function roundUpToDollar(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : Math.ceil(n)
}
