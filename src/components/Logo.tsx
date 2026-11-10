import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", height = 52, chip = false }: { href?: string; height?: number; chip?: boolean }) {
  const img = (
    <Image src="/logo.png" alt="Greenzone Academy Limited" width={Math.round((height * 500) / 270)} height={height} priority />
  );
  return (
    <Link href={href} aria-label="Greenzone Learning Hub home" className={chip ? "inline-flex rounded-xl bg-white px-3 py-2" : "inline-flex"}>
      {img}
    </Link>
  );
}
