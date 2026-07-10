export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">{children}</div>
    </div>
  );
}
