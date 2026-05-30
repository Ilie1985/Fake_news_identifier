import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-xl font-bold text-slate-950">
          FakeNews AI
        </Link>

        <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-slate-950">
            Home
          </Link>

          <Link href="/analyse" className="hover:text-slate-950">
            Analyse
          </Link>

          <Link href="/dashboard" className="hover:text-slate-950">
            Dashboard
          </Link>

          <Link href="/history" className="hover:text-slate-950">
            History
          </Link>

          <Link href="/ml-insights" className="hover:text-slate-950">
            ML Insights
          </Link>
        </div>
      </nav>
    </header>
  );
}