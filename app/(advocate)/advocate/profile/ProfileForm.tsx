"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "U";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

type ProfileFormProps = {
  fullName: string;
  phone: string;
  avatarUrl: string;
  officeAddress: string;
};

export default function ProfileForm({
  fullName,
  phone,
  avatarUrl,
  officeAddress,
}: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(fullName);
  const [ph, setPh] = useState(phone);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [address, setAddress] = useState(officeAddress);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedAvatar = avatar.trim();
  const initials = getInitials(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        phone: ph.trim() || null,
        avatar_url: trimmedAvatar || null,
        office_address: address.trim() || null,
      })
      .eq("id", user!.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          Profile Picture Preview
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white bg-navy-100 text-xl font-semibold text-navy-700 shadow-sm">
            {trimmedAvatar && !avatarLoadFailed ? (
              <img
                src={trimmedAvatar}
                alt={name || "Profile picture"}
                className="h-full w-full object-cover"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <p>Paste an image URL to show a profile picture.</p>
            <p className="mt-1">If no image is set, your initials appear instead.</p>
          </div>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">Profile updated successfully.</div>}

      <div>
        <label className="label">Full name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">Phone</label>
        <input
          type="tel"
          className="input"
          placeholder="+92 300 0000000"
          value={ph}
          onChange={(e) => setPh(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Profile picture URL</label>
        <input
          type="url"
          className="input"
          placeholder="https://example.com/avatar.jpg"
          value={avatar}
          onChange={(e) => {
            setAvatar(e.target.value);
            setAvatarLoadFailed(false);
          }}
        />
      </div>

      <div>
        <label className="label">Office address</label>
        <textarea
          className="input min-h-[110px] resize-y"
          placeholder="Add your office address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
