"use client";

import { useState } from "react";

export function Avatar({
  userId,
  name,
  version,
  size = 36,
}: {
  userId: string;
  name: string;
  version?: string | number | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(!version);
  const initial = (name.trim().slice(0, 1) || "?").toUpperCase();

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-line text-xs font-semibold text-ink"
      style={{ width: size, height: size, borderRadius: 9999 }}
      aria-hidden
    >
      {failed || !version ? (
        initial
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/avatar/${userId}?v=${version}`}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
