import { formatMoney } from '../lib/format'

export default function SummaryPanel({ rows, remainingBudget, remainingActual }) {
  return (
    <section className="card summary-panel">
      <h2>Summary</h2>
      <div className="table-scroll">
        <table className="line-table">
          <thead>
            <tr>
              <th>Total</th>
              <th className="num">Budget</th>
              <th className="num">Actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="num">{formatMoney(row.budget)}</td>
                <td className="num">{formatMoney(row.actual)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Remaining</strong>
              </td>
              <td className={`num ${remainingBudget < 0 ? 'negative' : 'positive'}`}>
                <strong>{formatMoney(remainingBudget)}</strong>
              </td>
              <td className={`num ${remainingActual < 0 ? 'negative' : 'positive'}`}>
                <strong>{formatMoney(remainingActual)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
