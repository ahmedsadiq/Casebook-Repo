export default function EditCaseLoading() {
  return (
    <div className="pg-wrap max-w-2xl">
      <div className="mb-6">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="mt-3 h-8 w-40 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
      </div>

      <div className="card p-7">
        <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 px-4 py-3 text-sm text-navy-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" />
          <span>Please wait while we open the case editor.</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-11 rounded-lg bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-11 rounded-lg bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-11 rounded-lg bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-11 rounded-lg bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-11 rounded-lg bg-gray-100" />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-28 rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
