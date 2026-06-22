import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#f7f8f6]"
      style={{ "--accent": "#0A0A0A" } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black" />
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex justify-center">
            <Logo href="/login" />
          </div>
          <div className="px-1 sm:px-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
