"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/private/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <button
      className="private-logout"
      disabled={busy}
      onClick={() => void logout()}
      type="button"
    >
      {busy ? "Ending…" : "End session"}
    </button>
  );
}
