"use client";

export default function AdvocateError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#f3f5f9] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 max-w-md w-full">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-1">{error.message || "An unexpected error occurred."}</p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 bg-navy-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-navy-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
