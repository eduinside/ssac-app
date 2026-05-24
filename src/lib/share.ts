/**
 * 공유 링크 생성.
 *
 * 현재는 학습 결과를 base64url로 URL hash에 인코딩합니다.
 * TODO: vives-share 스킬 연동 시 makeShareUrl()을 단축 URL API 호출로 교체.
 *       encodeShare / decodeShare는 그대로 유지해 payload 직렬화에 계속 사용.
 */

export type SharePayload = {
  v: 1;
  name: string;
  grade: number;
  vocab: {
    done: number;
    star: number;
    total: number;
    perGrade: Record<string, { d: number; s: number; t: number }>;
  };
  badges: string[];
  ts: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShare(p: SharePayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(p)));
}
export function decodeShare(s: string): SharePayload | null {
  try {
    const obj = JSON.parse(new TextDecoder().decode(fromBase64Url(s)));
    if (obj?.v !== 1) return null;
    return obj as SharePayload;
  } catch {
    return null;
  }
}

export async function makeShareUrl(p: SharePayload): Promise<string> {
  const code = encodeShare(p);
  const longUrl = `${location.origin}/share#${code}`;

  try {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: longUrl }),
    });
    if (res.ok) {
      const data = (await res.json()) as { shortURL?: string };
      if (data.shortURL) return data.shortURL;
    }
  } catch {
    // fall through to long URL
  }
  return longUrl;
}
