export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background pr-[calc(env(safe-area-inset-right)+var(--layout-margin))] pl-[calc(env(safe-area-inset-left)+var(--layout-margin))] pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+3rem)]">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">{children}</div>
    </main>
  );
}
