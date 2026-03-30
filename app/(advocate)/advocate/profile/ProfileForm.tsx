"use client";

import { useEffect, useRef, useState } from "react";
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
  onDraftChange?: (draft: {
    fullName: string;
    phone: string;
    avatarUrl: string;
    officeAddress: string;
  }) => void;
};

export default function ProfileForm({
  fullName,
  phone,
  avatarUrl,
  officeAddress,
  onDraftChange,
}: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    onDraftChange?.({
      fullName: name,
      phone: ph,
      avatarUrl: avatarPreview,
      officeAddress: address,
    });
  }, [address, avatarPreview, name, onDraftChange, ph]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Profile picture must be 5MB or smaller.");
      e.target.value = "";
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

    e.target.value = "";
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openFilePicker}
              className="group relative h-24 w-24 overflow-hidden rounded-3xl border border-white bg-navy-100 shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:ring-offset-2"
              aria-label={trimmedAvatar ? "Change profile picture" : "Upload profile picture"}
            >
              {trimmedAvatar && !avatarLoadFailed ? (
                <img
                  src={trimmedAvatar}
                  alt={name || "Profile picture"}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-navy-700">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <span className="text-xs font-medium text-white">
                  {trimmedAvatar ? "Change photo" : "Add photo"}
                </span>
              </div>
            </button>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-gray-900">Profile photo</p>
              <p className="max-w-sm text-sm leading-relaxed text-gray-500">
                Click the photo to upload a new image. Click it again anytime to change it.
              </p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP, GIF up to 5MB</p>
            </div>
          </div>

          {(avatarPreview || avatarFile) && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="inline-flex w-fit items-center rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Remove photo
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />
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
