"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
          padding: "14px 16px",
        },
        success: {
          iconTheme: {
            primary: "#16a34a",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #16a34a",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #dc2626",
          },
        },
        loading: {
          iconTheme: {
            primary: "#4f46e5",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #4f46e5",
          },
        },
      }}
    />
  );
}
