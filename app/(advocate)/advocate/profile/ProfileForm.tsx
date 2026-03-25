"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "profile-avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "U";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getFileExtension(file: File) {
  const extFromName = file.name.split(".").pop()?.trim().toLowerCase();
  if (extFromName) return extFromName.replace(/[^a-z0-9]/g, "") || "jpg";

  const extFromType = file.type.split("/").pop()?.trim().toLowerCase();
  return extFromType?.replace(/[^a-z0-9]/g, "") || "jpg";
}

function getManagedAvatarPath(url: string, userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !baseUrl) return null;

  const prefix = `${baseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;

  const path = decodeURIComponent(url.slice(prefix.length).split("?")[0] ?? "");
  return path.startsWith(`${userId}/`) ? path : null;
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
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [address, setAddress] = useState(officeAddress);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedAvatar = avatarPreview.trim();
  const initials = getInitials(name);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Profile picture must be 5MB or smaller.");
      return;
    }

    setError(null);
    setSuccess(false);
    setRemoveAvatar(false);
    setAvatarLoadFailed(false);
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatar("");
    setAvatarPreview("");
    setAvatarFile(null);
    setRemoveAvatar(true);
    setAvatarLoadFailed(false);
    setSuccess(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in to update your profile.");
      setLoading(false);
      return;
    }

    const previousManagedAvatarPath = getManagedAvatarPath(avatarUrl, user.id);
    let uploadedAvatarPath: string | null = null;
    let nextAvatarUrl = removeAvatar ? null : avatar.trim() || null;

    try {
      if (avatarFile) {
        const ext = getFileExtension(avatarFile);
        const storagePath = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(storagePath, avatarFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: avatarFile.type,
          });

        if (uploadError) throw uploadError;

        uploadedAvatarPath = storagePath;
        const { data: publicUrlData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(storagePath);

        nextAvatarUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone: ph.trim() || null,
          avatar_url: nextAvatarUrl,
          office_address: address.trim() || null,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      if (previousManagedAvatarPath && (uploadedAvatarPath || removeAvatar)) {
        await supabase.storage.from(AVATAR_BUCKET).remove([previousManagedAvatarPath]);
      }

      setAvatar(nextAvatarUrl ?? "");
      setAvatarPreview(nextAvatarUrl ?? "");
      setAvatarFile(null);
      setRemoveAvatar(false);
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      if (uploadedAvatarPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([uploadedAvatarPath]);
      }
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          Profile Picture Preview
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
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
            <p>Upload a profile picture from your device.</p>
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
        <label className="label">Profile picture</label>
        <input
          type="file"
          accept="image/*"
          className="input file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-100"
          onChange={handleAvatarSelect}
        />
        <div className="mt-2 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center">
          <span>JPG, PNG, WEBP, GIF up to 5MB</span>
          {(avatarPreview || avatarFile) && (
            <button
              type="button"
              className="font-medium text-red-600 hover:underline"
              onClick={handleRemoveAvatar}
            >
              Remove picture
            </button>
          )}
        </div>
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

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
