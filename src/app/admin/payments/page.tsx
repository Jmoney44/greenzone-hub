import { Empty, PageHeader, Status } from "@/components/AdminUI";
import { db } from "@/lib/db";
import { day } from "@/lib/format";

export default async function AdminPayments() {
  const [payments, total, waiting] = await Promise.all([
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { user: true } }),
    db.payment.count(),
    db.payment.count({ where: { userId: null } }),
  ]);
  return (
    <>
      <PageHeader title="Payments" note="Every Selar payment notice and every access you granted by hand." />
      <section className="card overflow-hidden">
        <div className="panel-head">
          <h2 className="text-lg font-extrabold text-deep">{total.toLocaleString("en-GB")} payment{total === 1 ? "" : "s"}</h2>
          {waiting > 0 && <Status tone="warn">{waiting} waiting for sign-up</Status>}
        </div>
        {payments.length === 0 ? (
          <Empty title="No payments recorded yet"><p className="text-soft">Payments appear here as soon as Selar sends a notice.</p></Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[720px]">
              <thead>
                <tr><th>Date</th><th>Buyer</th><th>Account</th><th>Amount</th><th>Source</th><th>Reference</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap text-soft">{day(p.createdAt)}</td>
                    <td className="font-bold text-ink">{p.email}</td>
                    <td>{p.user ? p.user.name : <Status tone="warn">Waiting for sign-up</Status>}</td>
                    <td className="font-bold whitespace-nowrap tabular-nums">{p.amount || "—"}</td>
                    <td><Status tone={p.source === "manual" ? "off" : "on"}>{p.source === "manual" ? "Granted by admin" : "Selar"}</Status></td>
                    <td className="text-[13px] break-all text-muted">{p.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > payments.length && <p className="border-t border-line px-6 py-3 text-sm text-muted">Showing the latest {payments.length}.</p>}
      </section>
    </>
  );
}
