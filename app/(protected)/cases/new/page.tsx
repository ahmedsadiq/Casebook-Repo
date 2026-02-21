import CaseForm from "@/components/CaseForm";

export default function NewCasePage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Case</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new case file</p>
      </div>
      <div className="card p-6">
        <CaseForm mode="create" />
      </div>
    </div>
  );
}
