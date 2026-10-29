"use client";

import Image from "next/image";
import { useState } from "react";

function Face({ username, size }: { username: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const valid = /^[A-Za-z0-9_]{3,16}$/.test(username);
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#a9cf9f]/15 font-bold text-[#b9dfaf]"
    >
      {!failed && valid ? (
        <Image
          unoptimized
          src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size * 2}`}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          style={{ imageRendering: "pixelated" }}
          onError={() => setFailed(true)}
        />
      ) : (
        (username[0] ?? "?").toUpperCase()
      )}
    </span>
  );
}
export default function MinecraftAvatar({
  username,
  size = 28,
}: {
  username: string;
  size?: number;
}) {
  return <Face key={username + ":" + size} username={username} size={size} />;
}
