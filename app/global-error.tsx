"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", background: "#f3f5f9" }}>
        <div style={{ maxWidth: 480, margin: "4rem auto", background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: "#1a31cc", color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.875rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
