import { COMPANY_NAME } from "@/constants/app";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border/50 bg-white px-4 py-3 md:px-5">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <span>
          &copy; {year} {COMPANY_NAME}. All rights reserved.
        </span>
        <span>Pro-Vigil AI Sales Agent Demo</span>
      </div>
    </footer>
  );
}
