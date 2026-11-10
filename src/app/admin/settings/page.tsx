import { ActionForm, Submit } from "@/components/Form";
import { saveSettings } from "@/app/actions/admin";
import { getSettings } from "@/lib/settings";

export default async function AdminSettings() {
  const s = await getSettings();
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-deep">Settings</h1>
      <ActionForm action={saveSettings} className="card flex max-w-[640px] flex-col gap-4 p-7">
        <label htmlFor="selarUrl" className="label">Selar payment link (the price is shown on Selar, not on this site)</label>
        <input id="selarUrl" name="selarUrl" defaultValue={s.selarUrl} placeholder="https://selar.com/…" className="field" />
        <label htmlFor="supportEmail" className="label">Support email shown to parents</label>
        <input id="supportEmail" name="supportEmail" type="email" defaultValue={s.supportEmail} className="field" />
        <Submit className="btn self-start">Save settings</Submit>
      </ActionForm>
      <section className="card flex max-w-[640px] flex-col gap-3 p-7 text-[15px] leading-relaxed text-soft">
        <h2 className="text-xl font-extrabold text-deep">Connecting Selar</h2>
        <p>1. On Selar, set the product&apos;s redirect (thank-you) link to:</p>
        <code className="rounded-lg bg-mist px-3 py-2 text-sm break-all text-deep">{site}/subscribe/return</code>
        <p>2. Send Selar&apos;s payment notification (webhook) to this address, replacing KEY with the secret key set on the server:</p>
        <code className="rounded-lg bg-mist px-3 py-2 text-sm break-all text-deep">{site}/api/selar/webhook?key=KEY</code>
        <p>Parents must pay with the same email they registered with. If a payment does not match, grant access by hand on the Parents and teachers page.</p>
      </section>
    </>
  );
}
