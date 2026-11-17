import { PageHeader } from "@/components/AdminUI";
import { ActionForm, Submit } from "@/components/Form";
import { Loading } from "@/components/Loading";
import { saveSettings } from "@/lib/actions";
import { useLoad, useTitle } from "@/lib/load";
import { getSettings } from "@/lib/settings";
import { SUPABASE_URL } from "@/lib/supabase";

export default function AdminSettings() {
  useTitle("Settings");
  const load = useLoad(getSettings, []);
  if (!load.data) return <Loading />;
  const s = load.data;
  const site = window.location.origin;
  const code = "block rounded-lg border border-line bg-[#f7faf8] px-3 py-2.5 text-sm break-all text-deep";
  const step = "flex size-7 shrink-0 items-center justify-center rounded-full bg-tint text-[13px] font-extrabold text-deep";
  return (
    <>
      <PageHeader title="Settings" note="The payment link parents are sent to, and the contact address they see." />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="card min-w-0 overflow-hidden">
          <div className="panel-head"><h2 className="text-lg font-extrabold text-deep">Subscription and support</h2></div>
          <ActionForm action={saveSettings} className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="selarUrl" className="label">Selar payment link</label>
              <input id="selarUrl" name="selarUrl" defaultValue={s.selarUrl} placeholder="https://selar.com/…" className="field" />
              <p className="text-[13px] text-muted">The price is shown on Selar, not on this site.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="supportEmail" className="label">Support email shown to parents</label>
              <input id="supportEmail" name="supportEmail" type="email" defaultValue={s.supportEmail} className="field" />
            </div>
            <Submit className="btn self-start">Save settings</Submit>
          </ActionForm>
        </section>
        <section className="card min-w-0 overflow-hidden">
          <div className="panel-head"><h2 className="text-lg font-extrabold text-deep">Connecting Selar</h2></div>
          <ol className="flex flex-col gap-5 p-6 text-[15px] leading-relaxed text-soft">
            <li className="flex gap-3">
              <span aria-hidden className={step}>1</span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p>On Selar, set the product&apos;s redirect (thank-you) link to:</p>
                <code className={code}>{site}/subscribe/return</code>
              </div>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className={step}>2</span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p>Send Selar&apos;s payment notification (webhook) to this address. Replace KEY with the secret you saved as <strong className="text-deep">SELAR_WEBHOOK_KEY</strong> in Supabase (Edge Functions &gt; Secrets):</p>
                <code className={code}>{SUPABASE_URL}/functions/v1/selar-webhook?key=KEY</code>
              </div>
            </li>
          </ol>
          <p className="border-t border-line bg-[#f7faf8] px-6 py-4 text-sm leading-relaxed text-soft">Parents must pay with the same email they registered with. If a payment does not match, grant access by hand on the Parents and teachers page.</p>
        </section>
      </div>
    </>
  );
}
