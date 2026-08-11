"use client";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6 font-sans text-slate-900">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold">Application error</h1>
          <p className="mt-2 text-sm text-slate-600">
            The application encountered a critical error.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
