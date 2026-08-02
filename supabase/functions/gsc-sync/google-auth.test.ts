/**
 * Doesn't match vitest.config.ts's `supabase/functions/**\/index.test.ts`
 * include pattern (only index.test.ts files are auto-included). Run with an
 * explicit path:
 *   npx vitest run supabase/functions/gsc-sync/google-auth.test.ts
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { base64UrlEncode, buildAndSignJwt, getGoogleAccessToken } from './google-auth.ts';

// Fixture RSA-2048 test keypair (PKCS8 private / SPKI public), generated
// solely for this test — not used anywhere else.
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDvXa2pfQsJe++8
WGMn4N0mV22PgKLuCzZolLqGc7YfKkbRJh2HM15DlH+3seynOr2uuGfDlImZEvVF
1RGsZ8qt5vdYvUjk/gxwqWVDd4diJWjSASCxnR/VJGDrY2FQskSTVGJ1eQ1QZIxX
fqDHMiTHTfUGi8FsxCJj7h5KkP8R9J1/prLzD4mT3chZS+VQboiCFp+G2YvRVxoy
kIxkLFszSzpEL7TB0ojY0/Tx90NVxXgxVIwAd+suuFQVVP5Oz5UV9UEmdy7Cwcjt
Hv5iBMv/h6gkurYrse5SqpHouwsqLAYcn6KJfWsSKhp9iITB6ZP+piIIEYyjb9Vc
mgTaWI+hAgMBAAECggEAJfWMKbmru2hNH2hA6T0OtRreRAiZTfi3OySC4/mLoyuY
KWjK+/rYcw0kp+PubKKzG/cgdXKj04OfI+DjOZ0IFkXvacIywiXLoT4r0eQtsxHN
qqgFIEWTm8B2Ij4TW7G5kEesiYaV5u7bFrD9HDnGfVjOh6g4F2CPN5u2cArIeHcs
0g3KVcPlNQbwz1+/zbUbqKf0NvYh1IoM/idQ7nynjfYSRJiC9qGWl0lRXa/6odYU
4ncqsZU7YLZkKskKwnyfJp0wFH3d8nQCI0e2km/mfViYUCVME9YgwTU/5mhTDros
yi63WWpRmXn4uoLQE1uMaFI++BnV0sMBzrYGW05JdQKBgQD6k/t2p3vQ2ZcIMTaY
1flbZBuwjFCPztQUqia//zqvQtwHCvIpqHY+87FIMba1YNbkGdf64BPbrLYsjanp
BLUo4VaimquuU6MhcRqZ43NaWt9mYBL0D6wEq20nHimAZMD/Sf57gxFx0BTRyrJt
F5aCtoDIgCv2qO1acuMhf3d60wKBgQD0i5bUp6VI7NFI5838Hh1asSptV7vhEg64
k9wKE92lE4tMrTaPCWKpsR1vz7ZpHKVOJetuc21SutcNK13/DvPVVDbNmdxwC8Fo
XsheO/Og9IMSL4SzksTLvea1wTo8JQib9ePXu0cftrOQXZ757iuQSZVFLSICiqKv
SZYNUdkbOwKBgGs+hKRu4CYtyl8+OODGy5dazCMOmrhBzDEf9b+8q9Aw7FyzSZuc
tycQQ3LjnBAa5z3u9aow1y7wx3NgGjVZx3M8pkinrAzLTQlWEA2G9Grac7ysJ9B/
GJ9TAz93wElsVdGtSJZyLTgp149GkoDwVIGTPKETgj1qZVON0joXBPrzAoGAAezn
bx0yy/QxYaWRlZ6XFJO4hcvfCtKdkw52+Q1W/Wm9+wiSGWY1hKiEVtEH2qQDGS5r
QB9giPo3nz7sKonvmYpkNBI2DhvJlgzI/xTxwh6quYXuQYuySPhhzKSM1NRl0PSK
qrQqxzElEMnr6oPZi/VIW5cTYXm99itaJxix4OkCgYBV9HBXJKX3YCHqdGmdLMZv
V5ZvuxCgS6oxkCEqtGXgFfwTi7FUR4pceKw1NEZTj4Pk/ZBZKzfgXdWEHhoI+3Gb
6ZIkzKIhasDtpT+LoUp/uw0pQGmsD/xPStEfbaBZzX+Y8JggxlC1r2EDNiiGfMSn
+HZAWomSeVRTW8idsn5Z0A==
-----END PRIVATE KEY-----`;

const TEST_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA712tqX0LCXvvvFhjJ+Dd
Jldtj4Ci7gs2aJS6hnO2HypG0SYdhzNeQ5R/t7Hspzq9rrhnw5SJmRL1RdURrGfK
reb3WL1I5P4McKllQ3eHYiVo0gEgsZ0f1SRg62NhULJEk1RidXkNUGSMV36gxzIk
x031BovBbMQiY+4eSpD/EfSdf6ay8w+Jk93IWUvlUG6IghafhtmL0VcaMpCMZCxb
M0s6RC+0wdKI2NP08fdDVcV4MVSMAHfrLrhUFVT+Ts+VFfVBJncuwsHI7R7+YgTL
/4eoJLq2K7HuUqqR6LsLKiwGHJ+iiX1rEioafYiEwemT/qYiCBGMo2/VXJoE2liP
oQIDAQAB
-----END PUBLIC KEY-----`;

function base64UrlDecodeToString(segment: string): string {
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(segment.length + ((4 - (segment.length % 4)) % 4), '=');
    return atob(b64);
}

function pemPublicKeyToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s+/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

describe('buildAndSignJwt', () => {
    it('produces a header and claims with the exact expected shape', async () => {
        const jwt = await buildAndSignJwt('test-sa@project.iam.gserviceaccount.com', TEST_PRIVATE_KEY);
        const [headerSeg, claimsSeg] = jwt.split('.');

        const header = JSON.parse(base64UrlDecodeToString(headerSeg));
        expect(header).toEqual({ alg: 'RS256', typ: 'JWT' });

        const claims = JSON.parse(base64UrlDecodeToString(claimsSeg));
        expect(claims.iss).toBe('test-sa@project.iam.gserviceaccount.com');
        expect(claims.scope).toBe('https://www.googleapis.com/auth/webmasters.readonly');
        expect(claims.aud).toBe('https://oauth2.googleapis.com/token');
        expect(claims.exp - claims.iat).toBe(3600);
    });

    it('produces a signature that verifies against the matching public key', async () => {
        const jwt = await buildAndSignJwt('test-sa@project.iam.gserviceaccount.com', TEST_PRIVATE_KEY);
        const [headerSeg, claimsSeg, signatureSeg] = jwt.split('.');
        const signingInput = `${headerSeg}.${claimsSeg}`;

        const publicKey = await crypto.subtle.importKey(
            'spki',
            pemPublicKeyToArrayBuffer(TEST_PUBLIC_KEY),
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['verify'],
        );

        const signatureBytes = Uint8Array.from(base64UrlDecodeToString(signatureSeg), (c) => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            publicKey,
            signatureBytes,
            new TextEncoder().encode(signingInput),
        );

        expect(isValid).toBe(true);
    });
});

describe('base64UrlEncode', () => {
    it('produces URL-safe output with no padding', () => {
        // 'sure.' base64-encodes to 'c3VyZS4=' (has padding and no url-unsafe
        // chars in this particular input) — pick a byte sequence known to
        // produce '+' and '/' in standard base64 to prove the substitution.
        const bytes = new Uint8Array([0xfb, 0xff, 0xbf]); // base64: "+/+/" family
        const encoded = base64UrlEncode(bytes.buffer);
        expect(encoded).not.toMatch(/[+/=]/);
    });
});

describe('getGoogleAccessToken', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('POSTs a form-encoded jwt-bearer assertion to the token endpoint and returns the access token', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ access_token: 'fake-access-token', expires_in: 3600, token_type: 'Bearer' }),
        });
        globalThis.fetch = fetchSpy as unknown as typeof fetch;

        const token = await getGoogleAccessToken({
            client_email: 'test-sa@project.iam.gserviceaccount.com',
            private_key: TEST_PRIVATE_KEY,
        });

        expect(token).toBe('fake-access-token');
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        const [url, init] = fetchSpy.mock.calls[0];
        expect(url).toBe('https://oauth2.googleapis.com/token');
        expect(init.method).toBe('POST');
        expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

        const params = new URLSearchParams(init.body as string);
        expect(params.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
        expect(params.get('assertion')).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    it('throws a descriptive error when the token endpoint returns a non-ok response', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => '{"error":"invalid_grant"}',
        }) as unknown as typeof fetch;

        await expect(
            getGoogleAccessToken({ client_email: 'x@y.iam.gserviceaccount.com', private_key: TEST_PRIVATE_KEY }),
        ).rejects.toThrow(/Failed to obtain Google OAuth access token: HTTP 401/);
    });

    it('throws a descriptive error when the token response is missing access_token', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ expires_in: 3600 }),
        }) as unknown as typeof fetch;

        await expect(
            getGoogleAccessToken({ client_email: 'x@y.iam.gserviceaccount.com', private_key: TEST_PRIVATE_KEY }),
        ).rejects.toThrow('Google OAuth token response did not include an access_token');
    });
});
