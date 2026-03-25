"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

const NAV: Record<UserRole, { href: string; label: string }[]> = {
  advocate: [
    { href: "/advocate/dashboard", label: "Dashboard" },
    { href: "/advocate/cases", label: "Cases" },
    { href: "/advocate/calendar", label: "Calendar" },
    { href: "/advocate/clients", label: "Clients" },
    { href: "/advocate/associates", label: "Associates" },
    { href: "/advocate/profile", label: "Profile" },
  ],
  associate: [
    { href: "/associate/dashboard", label: "Dashboard" },
    { href: "/associate/cases", label: "Cases" },
    { href: "/associate/calendar", label: "Calendar" },
    { href: "/associate/profile", label: "Profile" },
  ],
  client: [
    { href: "/client/dashboard", label: "Dashboard" },
    { href: "/client/cases", label: "My Cases" },
    { href: "/client/calendar", label: "Calendar" },
    { href: "/client/profile", label: "Profile" },
  ],
};

const ROLE_BADGE: Record<UserRole, string> = {
  advocate: "role-advocate",
  associate: "role-associate",
  client: "role-client",
};

function DashIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}
function CasesIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
}
function ClientsIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
}
function UserIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function CalendarIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M8 2v4M16 2v4M3 10h18" /></svg>;
}

const ICON_MAP: Record<string, React.FC> = {
  Dashboard: DashIcon,
  "My Cases": CasesIcon,
  Cases: CasesIcon,
  Clients: ClientsIcon,
  Associates: ClientsIcon,
  Profile: UserIcon,
  Calendar: CalendarIcon,
};

export default function Sidebar({ fullName, role }: { fullName: string | null; role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const nav = NAV[role];
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const navLinks = nav.map(({ href, label }) => {
    const isDash = label === "Dashboard";
    const active = isDash ? pathname === href : pathname.startsWith(href);
    const Icon = ICON_MAP[label] ?? UserIcon;
    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          active
            ? "bg-navy-50 text-navy-700 font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Icon />
        {label}
      </Link>
    );
  });

  const footer = (
    <div className="space-y-3">
      <div>
        <p className="truncate text-sm font-medium leading-tight text-gray-800">{fullName || "User"}</p>
        <span className={`${ROLE_BADGE[role]} mt-1.5`}>{role}</span>
      </div>
      <button onClick={handleSignOut} className="btn-ghost btn-sm w-full justify-start gap-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign out
      </button>
    </div>
  );

  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5 sm:py-5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Image src="/app-icon.jpg" alt="Casebook" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold tracking-tight text-gray-900">Casebook</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(open => !open)}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          aria-expanded={mobileOpen}
          aria-controls="mobile-casebook-menu"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div
        id="mobile-casebook-menu"
        className={`overflow-hidden border-b border-gray-100 transition-all duration-300 ease-out lg:hidden ${
          mobileOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`px-4 py-4 transition-all duration-300 ease-out ${
            mobileOpen ? "translate-y-0" : "-translate-y-2"
          }`}
        >
          <div className="space-y-1">{navLinks}</div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            {footer}
          </div>
        </div>
      </div>

      <div className="hidden h-full lg:flex lg:flex-1 lg:flex-col">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center gap-2.5">
            <Image src="/app-icon.jpg" alt="Casebook" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold tracking-tight text-gray-900">Casebook</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {navLinks}
          </div>
        </nav>

        <div className="mt-auto border-t border-gray-100 px-4 py-4">
          {footer}
        </div>
      </div>
    </aside>
  );
}
