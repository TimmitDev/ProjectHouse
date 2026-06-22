"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-white"
    >
      <span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.13em] text-slate-400">
          Uitnodigingscode
        </span>
        <span className="mt-1 block font-mono text-sm font-semibold tracking-[0.14em] text-slate-800">
          {code}
        </span>
      </span>
      {copied ? (
        <Check className="size-4 text-emerald-600" />
      ) : (
        <Copy className="size-4 text-slate-400" />
      )}
    </button>
  );
}
