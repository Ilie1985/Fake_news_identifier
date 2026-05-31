"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FeatureWord,
  getModelMetrics,
  getTopFakeWords,
  getTopRealWords,
  ModelMetrics,
} from "@/lib/api";

type MetricChartItem = {
  name: string;
  score: number;
};

export default function MLInsightsPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [topFakeWords, setTopFakeWords] = useState<FeatureWord[]>([]);
  const [topRealWords, setTopRealWords] = useState<FeatureWord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMLInsights() {
      try {
        setIsLoading(true);
        setError("");

        const [metricsData, fakeWordsData, realWordsData] = await Promise.all([
          getModelMetrics(),
          getTopFakeWords(),
          getTopRealWords(),
        ]);

        setMetrics(metricsData);
        setTopFakeWords(fakeWordsData.slice(0, 10));
        setTopRealWords(realWordsData.slice(0, 10));
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Could not load ML insights.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadMLInsights();
  }, []);

  const metricsChartData: MetricChartItem[] = useMemo(() => {
    if (!metrics) {
      return [];
    }

    return [
      { name: "Accuracy", score: metrics.accuracy },
      { name: "Precision", score: metrics.precision },
      { name: "Recall", score: metrics.recall },
      { name: "F1-score", score: metrics.f1_score },
    ];
  }, [metrics]);

  const fakeWordsChartData = topFakeWords.map((item) => ({
    word: item.word,
    importance: Math.abs(item.coefficient),
  }));

  const realWordsChartData = topRealWords.map((item) => ({
    word: item.word,
    importance: Math.abs(item.coefficient),
  }));

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-slate-700">Loading ML insights...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
          ML Insights
        </p>

        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
          Machine learning model insights
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          This page explains the machine-learning side of the project,
          including the dataset, TF-IDF vectorisation, Logistic Regression
          classification, evaluation metrics, confusion matrix, and feature
          importance.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
          {error}
        </p>
      )}

      {metrics && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Accuracy
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {(metrics.accuracy * 100).toFixed(2)}%
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Precision
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {(metrics.precision * 100).toFixed(2)}%
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Recall
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {(metrics.recall * 100).toFixed(2)}%
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                F1-score
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {(metrics.f1_score * 100).toFixed(2)}%
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Rows after cleaning
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {metrics.dataset_rows_after_cleaning.toLocaleString()}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Training rows
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {metrics.training_rows.toLocaleString()}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Testing rows
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {metrics.testing_rows.toLocaleString()}
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-slate-950">
              Model performance chart
            </h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="score" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              These metrics evaluate how well the trained model performed on the
              test set. Accuracy shows overall correctness, precision measures
              how reliable positive predictions are, recall measures how many
              true cases were found, and F1-score balances precision and recall.
            </p>
          </section>

          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-slate-950">
              Confusion matrix
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="border border-slate-200 p-3">
                      Actual \ Predicted
                    </th>
                    {metrics.labels.map((label) => (
                      <th
                        key={label}
                        className="border border-slate-200 p-3 capitalize"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {metrics.labels.map((actualLabel, rowIndex) => (
                    <tr key={actualLabel}>
                      <th className="border border-slate-200 p-3 capitalize">
                        {actualLabel}
                      </th>

                      {metrics.confusion_matrix[rowIndex].map(
                        (value, columnIndex) => (
                          <td
                            key={columnIndex}
                            className="border border-slate-200 p-3 text-center text-lg font-bold"
                          >
                            {value}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              The confusion matrix shows correct and incorrect predictions. The
              diagonal values show correct classifications, while the other
              values show mistakes made by the model.
            </p>
          </section>

          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
  <h2 className="mb-4 text-xl font-bold text-slate-950">
    Actual vs predicted results
  </h2>

  <div className="h-96">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={[
          {
            category: "Fake → Fake",
            count: metrics.confusion_matrix[0][0],
          },
          {
            category: "Fake → Real",
            count: metrics.confusion_matrix[0][1],
          },
          {
            category: "Real → Fake",
            count: metrics.confusion_matrix[1][0],
          },
          {
            category: "Real → Real",
            count: metrics.confusion_matrix[1][1],
          },
        ]}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" />
      </BarChart>
    </ResponsiveContainer>
  </div>

  <p className="mt-3 text-sm leading-6 text-slate-600">
    This chart visualises the model’s predictions on the test dataset. Correct
    predictions are shown by Fake → Fake and Real → Real. Incorrect predictions
    are shown by Fake → Real and Real → Fake.
  </p>
</section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-950">
                Top words linked to fake predictions
              </h2>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fakeWordsChartData}
                    layout="vertical"
                    margin={{ left: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="word" type="category" width={90} />
                    <Tooltip />
                    <Bar dataKey="importance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                These words had strong influence towards fake predictions in the
                Logistic Regression model. They should be interpreted carefully,
                because they show dataset patterns rather than absolute proof.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-950">
                Top words linked to real predictions
              </h2>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={realWordsChartData}
                    layout="vertical"
                    margin={{ left: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="word" type="category" width={90} />
                    <Tooltip />
                    <Bar dataKey="importance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                These words had strong influence towards real predictions. This
                helps explain what patterns the model learned from the training
                dataset.
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-3 text-xl font-bold text-slate-950">
                How the ML model works
              </h2>

              <div className="space-y-4 leading-7 text-slate-700">
                <p>
                  The model was trained using labelled news articles from
                  fake-news and true-news CSV datasets. Each article was cleaned
                  by converting text to lowercase, removing URLs, removing
                  non-letter characters, and removing duplicates or very short
                  records.
                </p>

                <p>
                  The cleaned text was converted into numerical features using
                  TF-IDF vectorisation. TF-IDF gives higher importance to words
                  that are meaningful in a document but not too common across
                  all documents.
                </p>

                <p>
                  A Logistic Regression classifier was then trained to predict
                  whether the article is fake or real based on these TF-IDF
                  features.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-3 text-xl font-bold text-slate-950">
                Limitations and ethics
              </h2>

              <div className="space-y-4 leading-7 text-slate-700">
                <p>
                  The model does not prove whether a news article is true or
                  false. It learns patterns from the training dataset and
                  produces a risk estimate based on those patterns.
                </p>

                <p>
                  The high accuracy should be interpreted carefully because the
                  dataset may contain source-specific writing patterns. This
                  means the model may learn writing style differences rather
                  than factual truth.
                </p>

                <p>
                  Users should verify important claims using trusted sources,
                  official websites, and multiple reputable news organisations.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}