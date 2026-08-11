"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Phone, Settings } from "lucide-react";

import { APP_NAME, APP_VERSION, COMPANY_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Calls", href: ROUTES.CALLS, icon: Phone },
  { label: "Settings", href: ROUTES.SETTINGS, icon: Settings, disabled: true },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-brand-teal text-white shadow-sm">
      <div className="flex min-h-[52px] flex-wrap items-center gap-3 px-4">
        <Link href={ROUTES.HOME} className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[0.95rem] font-bold tracking-wide">
              {COMPANY_NAME}
            </span>
            <span className="text-[0.68rem] font-semibold tracking-[0.12em] opacity-90">
              AI SALES AGENT
            </span>
          </div>
        </Link>

        <div className="hidden h-7 w-px shrink-0 bg-white/35 sm:block" />

        <nav
          className="flex flex-1 items-center gap-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              !item.disabled &&
              (pathname === item.href ||
                (item.href !== ROUTES.HOME && pathname.startsWith(item.href)));

            const Icon = item.icon;

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white/50"
                  aria-disabled="true"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring-teal",
                  isActive
                    ? "bg-black/15 text-white"
                    : "text-white/95 hover:bg-black/10",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-white/90 sm:inline">
            {APP_NAME}
          </span>
          <span className="text-xs text-white/80">v{APP_VERSION}</span>
        </div>
      </div>
    </header>
  );
}
