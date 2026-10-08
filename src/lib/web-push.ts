/**
 * Web Push from the Worker with WebCrypto only: payload encryption (RFC 8291, aes128gcm)
 * and VAPID authentication (RFC 8292). Used by src/lib/server-api.ts to alert staff devices.
 */

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string; // base64url, uncompressed P-256 point (65 bytes)
  auth: string; // base64url, 16 bytes
}

export interface VapidKeys {
  publicKey: string; // base64url, uncompressed P-256 point
  privateJwk: JsonWebKey; // the same key pair as a JWK with "d"
  subject: string; // https URL or mailto: of the sender
}

const enc = new TextEncoder();

export function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(text: string): Uint8Array {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(info) }, key, length * 8));
}

/** Encrypts a payload for one subscription (single aes128gcm record). */
export async function encryptPayload(sub: PushSubscriptionRecord, payload: Uint8Array): Promise<Uint8Array> {
  const uaPublic = b64urlDecode(sub.p256dh);
  const authSecret = b64urlDecode(sub.auth);
  const local = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const asPublic = new Uint8Array((await crypto.subtle.exportKey("raw", local.publicKey)) as ArrayBuffer);
  const uaKey = await crypto.subtle.importKey("raw", buf(uaPublic), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));

  const ikm = await hkdf(authSecret, ecdhSecret, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", buf(cek), "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(nonce) }, aesKey, buf(concat(payload, new Uint8Array([2])))));

  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  return concat(header, asPublic, ciphertext);
}

/** "vapid t=<JWT>, k=<public key>" for the push service that owns the endpoint. */
export async function vapidAuthorization(endpoint: string, keys: VapidKeys): Promise<string> {
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlEncode(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: keys.subject })));
  const key = await crypto.subtle.importKey("jwk", keys.privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64urlEncode(signature)}, k=${keys.publicKey}`;
}

/**
 * Sends one notification. Returns "gone" when the push service says the subscription no longer
 * exists (the caller deletes it), "ok" on success, "failed" otherwise.
 */
export async function sendPush(sub: PushSubscriptionRecord, message: unknown, keys: VapidKeys): Promise<"ok" | "gone" | "failed"> {
  const first = await sendOnce(sub, message, keys);
  if (first !== "failed") return first;
  // push services sometimes refuse the first message right after a device subscribes: retry once
  await new Promise((r) => setTimeout(r, 1_000));
  return sendOnce(sub, message, keys);
}

async function sendOnce(sub: PushSubscriptionRecord, message: unknown, keys: VapidKeys): Promise<"ok" | "gone" | "failed"> {
  try {
    const body = await encryptPayload(sub, enc.encode(JSON.stringify(message)));
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        authorization: await vapidAuthorization(sub.endpoint, keys),
        "content-encoding": "aes128gcm",
        "content-type": "application/octet-stream",
        ttl: String(24 * 3600),
        urgency: "high",
      },
      body: buf(body),
      signal: AbortSignal.timeout(5_000),
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "ok" : "failed";
  } catch {
    return "failed";
  }
}
