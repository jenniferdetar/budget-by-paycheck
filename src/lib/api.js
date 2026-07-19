import { supabase } from './supabaseClient'

// -- Pay periods ------------------------------------------------------------

export async function listPayPeriods() {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function getPayPeriod(id) {
  const { data, error } = await supabase.from('pay_periods').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createPayPeriod({ label, startDate, endDate }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('pay_periods')
    .insert({ label, start_date: startDate, end_date: endDate, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePayPeriod(id, fields) {
  const { data, error } = await supabase.from('pay_periods').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePayPeriod(id) {
  const { error } = await supabase.from('pay_periods').delete().eq('id', id)
  if (error) throw error
}

// -- Line items (income / bill / expense / savings / debt) -----------------

export async function listLineItems(payPeriodId) {
  const { data, error } = await supabase
    .from('line_items')
    .select('*')
    .eq('pay_period_id', payPeriodId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createLineItem(payPeriodId, section, fields = {}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('line_items')
    .insert({
      pay_period_id: payPeriodId,
      user_id: user.id,
      section,
      name: fields.name ?? '',
      due_date: fields.dueDate ?? null,
      budget_amount: fields.budgetAmount ?? 0,
      actual_amount: fields.actualAmount ?? 0,
      is_sinking_fund: fields.isSinkingFund ?? false,
      is_paid: fields.isPaid ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLineItem(id, fields) {
  const { data, error } = await supabase.from('line_items').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLineItem(id) {
  const { error } = await supabase.from('line_items').delete().eq('id', id)
  if (error) throw error
}

// -- Expense tracker entries -------------------------------------------------

export async function listExpenseEntries(payPeriodId) {
  const { data, error } = await supabase
    .from('expense_entries')
    .select('*')
    .eq('pay_period_id', payPeriodId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createExpenseEntry(payPeriodId, fields) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('expense_entries')
    .insert({
      pay_period_id: payPeriodId,
      user_id: user.id,
      entry_date: fields.entryDate ?? null,
      line_item_id: fields.lineItemId ?? null,
      amount: fields.amount ?? 0,
      description: fields.description ?? '',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpenseEntry(id) {
  const { error } = await supabase.from('expense_entries').delete().eq('id', id)
  if (error) throw error
}

// -- Reference presets --------------------------------------------------------

export async function listReferenceItems() {
  const { data, error } = await supabase
    .from('reference_items')
    .select('*')
    .order('section', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createReferenceItem({ section, name, defaultAmount }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('reference_items')
    .insert({ section, name, default_amount: defaultAmount ?? null, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateReferenceItem(id, fields) {
  const { data, error } = await supabase
    .from('reference_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReferenceItem(id) {
  const { error } = await supabase.from('reference_items').delete().eq('id', id)
  if (error) throw error
}

export async function bulkCreateReferenceItems(presets) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const rows = presets.map((p) => ({
    section: p.section,
    name: p.name,
    default_amount: p.defaultAmount ?? null,
    user_id: user.id,
  }))
  const { error } = await supabase.from('reference_items').insert(rows)
  if (error) throw error
}
