"use client";

export default function Loading() {
  return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 4rem)", /* Adjust height to fill screen below navbar */
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div style={{
          border: "4px solid rgba(0, 0, 0, 0.1)",
          borderTop: "4px solid var(--color-accent-primary)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 1s linear infinite"
        }}></div>
        <p>Loading...</p>

      </div>
  )
}