import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl bg-slate-950 px-6 py-16 text-white shadow-sm md:px-12 md:py-24">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-300">
          AI and machine learning project
        </p>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Fake news detection powered by machine learning.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Analyse a headline or article and receive a prediction, confidence
          score, risk level, and AI-generated explanation.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/analyse"
            className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-slate-950 hover:bg-slate-200"
          >
            Analyse News
          </Link>

          <Link
            href="/ml-insights"
            className="rounded-xl border border-white/30 px-6 py-3 text-center font-semibold text-white hover:bg-white/10"
          >
            View ML Insights
          </Link>
        </div>
      </section>
    </main>
  );
}