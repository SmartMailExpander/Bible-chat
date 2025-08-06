"use client";
import { useState } from "react";
import AuthModal from "./auth/AuthModal";

export default function FloatingAuthButton() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  return (
    <>
      <button
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          borderRadius: "50%",
          background: "#cfc2b5",
          color: "#fff",
          width: 56,
          height: 56,
          fontSize: 18,
          border: "none",
          boxShadow: "0 4px 16px 0 rgba(158,145,136,0.15)",
          zIndex: 100,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setIsAuthOpen(true)}
      >
        Sign In
      </button>
      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
} 