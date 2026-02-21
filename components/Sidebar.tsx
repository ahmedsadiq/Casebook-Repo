"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

const NAV: Record<UserRole, { href: string; label: string }[]> = {
  advocate: [
    { href: "/advocate/dashboard",  label: "Dashboard"  },
    { href: "/advocate/cases",      label: "Cases"      },
    { href: "/advocate/clients",    label: "Clients"    },
    { href: "/advocate/associates", label: "Associates" },
    { href: "/advocate/profile",    label: "Profile"    },
  ],
  associate: [
    { href: "/associate/dashboard", label: "Dashboard" },
    { href: "/associate/cases",     label: "Cases"     },
    { href: "/associate/profile",   label: "Profile"   },
  ],
  client: [
    { href: "/client/dashboard", label: "Dashboard" },
    { href: "/client/cases",     label: "My Cases"  },
    { href: "/client/profile",   label: "Profile"   },
  ],
};

const ROLE_BADGE: Record<UserRole, string> = {
  advocate:  "role-advocate",
  associate: "role-associate",
  client:    "role-client",
};

// Simple SVG icons as inline components
function DashIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function CasesIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
}
function ClientsIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function UserIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

const ICON_MAP: Record<string, React.FC> = {
  Dashboard:  DashIcon,
  "My Cases": CasesIcon,
  Cases:      CasesIcon,
  Clients:    ClientsIcon,
  Associates: ClientsIcon,
  Profile:    UserIcon,
};

export default function Sidebar({ fullName, role }: { fullName: string | null; role: UserRole }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const nav      = NAV[role];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Image src="/app-icon.jpg" alt="Casebook" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold text-gray-900 tracking-tight">Casebook</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label }) => {
          const isDash = label === "Dashboard";
          const active = isDash ? pathname === href : pathname.startsWith(href);
          const Icon   = ICON_MAP[label] ?? UserIcon;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-navy-50 text-navy-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2.5">
        <div>
          <p className="text-sm font-medium text-gray-800 truncate leading-tight">{fullName || "User"}</p>
          <span className={`${ROLE_BADGE[role]} mt-1.5`}>{role}</span>
        </div>
        <button onClick={handleSignOut} className="btn-ghost btn-sm w-full justify-start gap-2 -ml-1 text-gray-500 hover:text-red-600 hover:bg-red-50">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
