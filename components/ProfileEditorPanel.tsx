"use client";

import { useState } from "react";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";
import ProfileForm from "@/app/(advocate)/advocate/profile/ProfileForm";

type ProfileEditorPanelProps = {
  roleLabel: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  officeAddress: string;
};

export default function ProfileEditorPanel({
  roleLabel,
  fullName,
  email,
  phone,
  avatarUrl,
  officeAddress,
}: ProfileEditorPanelProps) {
  const [draft, setDraft] = useState({
    fullName,
    phone,
    avatarUrl,
    officeAddress,
  });

  return (
    <>
      <ProfileSummaryCard
        fullName={draft.fullName || roleLabel}
        email={email}
        phone={draft.phone}
        avatarUrl={draft.avatarUrl}
        officeAddress={draft.officeAddress}
      />
      <div className="card p-5 sm:p-7">
        <div className="mb-5 border-b border-gray-100 pb-5">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
          <p className="text-sm text-gray-900">{email}</p>
        </div>
        <ProfileForm
          fullName={fullName}
          phone={phone}
          avatarUrl={avatarUrl}
          officeAddress={officeAddress}
          onDraftChange={setDraft}
        />
      </div>
    </>
  );
}
