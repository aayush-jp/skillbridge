"use client";

import { Toaster } from "react-hot-toast";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#fff",
          color: "#0b1530",
          border: "1px solid #e6ecf5",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 500,
          boxShadow: "0 4px 16px rgba(11,21,48,0.08)",
          padding: "12px 16px",
        },
        success: {
          iconTheme: { primary: "#1f8a5b", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#d23f3f", secondary: "#fff" },
          duration: 5000,
        },
      }}
    />
  );
}
