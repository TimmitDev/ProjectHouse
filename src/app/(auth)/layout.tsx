import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ "--accent": "#52796F" } as React.CSSProperties}
    >
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <aside className="relative hidden overflow-hidden bg-[#edf2ee] p-10 lg:flex lg:flex-col xl:p-14">
          <div className="absolute -left-28 -top-24 size-96 rounded-full bg-[#dce8df]" />
          <div className="absolute -bottom-40 -right-28 size-[520px] rounded-full border-[90px] border-white/35" />
          <div className="relative z-10">
            <Logo href="/login" />
          </div>

          <div className="relative z-10 my-auto max-w-xl py-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-medium text-[#45675f] backdrop-blur">
              <Sparkles className="size-3.5" />
              One calm place for home life
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-0.055em] text-slate-950 xl:text-[58px]">
              Run your household,
              <br />
              together.
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-7 text-slate-600">
              Shared finances, meaningful goals and the modules your home
              actually needs — without the clutter.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/80 bg-white/55 p-4 backdrop-blur">
                <HeartHandshake className="size-5 text-[var(--accent)]" />
                <p className="mt-3 text-sm font-medium text-slate-800">
                  Built for everyone
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Invite the people you share life with.
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/55 p-4 backdrop-blur">
                <ShieldCheck className="size-5 text-[var(--accent)]" />
                <p className="mt-3 text-sm font-medium text-slate-800">
                  Private by design
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Household data stays inside your circle.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-500">
            © 2026 Nestly. Your home, in sync.
          </p>
        </aside>
        <main className="flex min-h-screen items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
