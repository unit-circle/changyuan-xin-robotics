"use client";

import { useState } from "react";

export function AccessForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/private/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(result.error ?? "Access could not be verified");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <form className="private-form" onSubmit={submit}>
      <div>
        <label htmlFor="access-code">Authorization code</label>
        <input
          autoComplete="one-time-code"
          id="access-code"
          name="access-code"
          onChange={(event) => setCode(event.target.value)}
          placeholder="XCY-XXXX-XXXX-XXXX"
          required
          value={code}
        />
        {status && <small className="private-error">{status}</small>}
      </div>
      <button disabled={busy} type="submit">
        {busy ? "Verifying…" : "Continue securely"}
      </button>
    </form>
  );
}
