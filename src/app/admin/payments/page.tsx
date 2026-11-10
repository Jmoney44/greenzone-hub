import { db } from "@/lib/db";
import { day } from "@/lib/format";

export default async function AdminPayments() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { user: true } });
  const th = "border-b border-line px-3 py-2.5";
  const td = "border-b border-[#eef4f0] px-3 py-3";
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-deep">Payments</h1>
        <p className="text-soft">Every Selar payment notice and every access you granted by hand.</p>
      </div>
      <section className="card p-6">
        {payments.length === 0 ? <p className="text-soft">No payments recorded yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-xs tracking-wider text-muted uppercase">
                  <th className={th}>Date</th><th className={th}>Buyer email</th><th className={th}>Account</th><th className={th}>Amount</th><th className={th}>Source</th><th className={th}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{day(p.createdAt)}</td>
                    <td className={td}>{p.email}</td>
                    <td className={td}>
                      {p.user ? p.user.name : <span className="pill bg-[#fbf3b4] text-[#4a4200]">Waiting for sign-up</span>}
                    </td>
                    <td className={td}>{p.amount || "—"}</td>
                    <td className={td}>{p.source === "manual" ? "Granted by admin" : "Selar"}</td>
                    <td className={`${td} text-[13px] text-muted`}>{p.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
