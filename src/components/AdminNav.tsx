"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Book, Card, External, Film, Gear, Grid, People } from "@/components/icons";

const manage = [
  { href: "/admin", label: "Overview", Icon: Grid },
  { href: "/admin/videos", label: "Videos", Icon: Film },
  { href: "/admin/courses", label: "Teacher courses", Icon: Book },
  { href: "/admin/people", label: "Parents and teachers", Icon: People },
  { href: "/admin/payments", label: "Payments", Icon: Card },
  { href: "/admin/settings", label: "Settings", Icon: Gear },
];
const preview = [
  { href: "/library", label: "Parents Hub" },
  { href: "/teachers", label: "Teachers Hub" },
];

const item = "flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition";
const heading = "hidden px-3 pb-1 text-[11px] font-bold tracking-[0.14em] text-pale/70 uppercase md:block";

export function AdminNav() {
  const path = usePathname();
  const isOn = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  // On phones the menu scrolls sideways: keep the current page in view.
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = nav.current;
    const on = el?.querySelector<HTMLElement>("[aria-current]");
    if (el && on && el.scrollWidth > el.clientWidth) el.scrollLeft = on.offsetLeft - el.offsetLeft - 16;
  }, [path]);
  return (
    <nav ref={nav} aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      <span className={heading}>Manage</span>
      {manage.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isOn(href) ? "page" : undefined}
          className={`${item} ${isOn(href) ? "bg-white text-deep shadow-sm" : "text-[#e4f0e8] hover:bg-white/10"}`}
        >
          <Icon className={isOn(href) ? "text-brand" : "text-pale"} />
          {label}
        </Link>
      ))}
      <span className={`${heading} mt-6`}>View the site</span>
      {preview.map(({ href, label }) => (
        <Link key={href} href={href} className={`${item} text-[#e4f0e8] hover:bg-white/10`}>
          <External className="text-pale" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
