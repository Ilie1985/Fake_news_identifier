import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          AI and Machine Learning Project
        </p>

        <h1 className="mb-4 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Mobile-friendly fake news detection web app
        </h1>

        <p className="mb-8 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
          Paste a news headline or article and receive a machine-learning
          prediction, confidence score, risk level, and explanation. This
          project uses Python, scikit-learn, FastAPI, Next.js, and Tailwind CSS.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/analyse"
            className="rounded-xl bg-slate-950 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800"
          >
            Analyse News
          </Link>

          <Link
            href="/ml-insights"
            className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            View ML Insights
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="mb-2 font-bold text-slate-950">ML Prediction</h2>
            <p className="text-sm leading-6 text-slate-600">
              Uses TF-IDF vectorisation and Logistic Regression to classify
              submitted news as real or fake.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="mb-2 font-bold text-slate-950">Confidence Score</h2>
            <p className="text-sm leading-6 text-slate-600">
              Displays how confident the trained model is about the prediction.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="mb-2 font-bold text-slate-950">Responsible Use</h2>
            <p className="text-sm leading-6 text-slate-600">
              The app provides a risk estimate, not final proof that an article
              is true or false.
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Important: this application is an educational AI/ML tool. Always
          verify important information using trusted sources.
        </p>
      </section>
    </main>
  );
}