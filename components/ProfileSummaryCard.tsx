type ProfileSummaryCardProps = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  officeAddress: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "U";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function ProfileSummaryCard({
  fullName,
  email,
  phone,
  avatarUrl,
  officeAddress,
}: ProfileSummaryCardProps) {
  const initials = getInitials(fullName);

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-navy-50/40 p-4 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white bg-navy-100 text-xl font-semibold text-navy-700 shadow-sm">
          {avatarUrl ? (
            // Native img allows external profile image URLs without extra Next config.
            <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
          <p className="mt-1 text-sm text-gray-500">{email}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Phone</p>
              <p className="mt-2 text-sm text-gray-800">{phone || "Not added yet"}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Office Address</p>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
                {officeAddress || "Not added yet"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
