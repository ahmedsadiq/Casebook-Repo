import Image from "next/image";
import AuthForm from "./AuthForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign In" };

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/app-icon.jpg" alt="Casebook" width={56} height={56} className="rounded-2xl shadow-card-md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your Casebook account</p>
        </div>
        <div className="card p-8">
          <AuthForm />
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">
          Don&apos;t have an account? Ask your advocate to create one for you.
        </p>
      </div>
    </main>
  );
}
