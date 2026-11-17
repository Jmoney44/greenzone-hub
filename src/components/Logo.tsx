import Link from "@/components/Link";

export function Logo({ href = "/", height = 52, chip = false }: { href?: string; height?: number; chip?: boolean }) {
  const img = (
    <img src="/logo.png" alt="Greenzone Academy Limited" width={Math.round((height * 500) / 270)} height={height} />
  );
  return (
    <Link href={href} aria-label="Greenzone Learning Hub home" className={chip ? "inline-flex rounded-xl bg-white px-3 py-2" : "inline-flex"}>
      {img}
    </Link>
  );
}
