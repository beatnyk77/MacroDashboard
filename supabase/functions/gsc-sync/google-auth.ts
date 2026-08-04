// Manual OAuth2 JWT-bearer flow for Google service-account auth, using Deno's
// native Web Crypto API. The `npm:googleapis` package's `google.auth.JWT`
// relies on Node's native `crypto` internals for RS256 signing, which does
// not work correctly under Deno's npm-compatibility layer — its token fetch
// fails silently, so requests go out with no Authorization header at all.
// This bypasses that package entirely for this one auth flow.

export interface GoogleServiceAccountKey {
    client_email: string;
    private_key: string;
}

export function base64UrlEncode(input: string | ArrayBuffer): string {
    const bytes = typeof input === 'string'
        ? new TextEncoder().encode(input)
        : new Uint8Array(input);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function pemToUint8Array(pem: string): Uint8Array {
    // Some secret-storage paths double-escape newlines in the JSON value.
    const normalized = pem.replace(/\\n/g, '\n');
    const b64 = normalized
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s+/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export async function buildAndSignJwt(clientEmail: string, privateKeyPem: string): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claims = {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        iat,
        exp: iat + 3600,
    };

    const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;

    const key = await crypto.subtle.importKey(
        'pkcs8',
        pemToUint8Array(privateKeyPem),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        new TextEncoder().encode(signingInput),
    );

    return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function getGoogleAccessToken(serviceAccountKey: GoogleServiceAccountKey): Promise<string> {
    const jwt = await buildAndSignJwt(serviceAccountKey.client_email, serviceAccountKey.private_key);

    const body = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
    });

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!resp.ok) {
        const bodyText = await resp.text();
        throw new Error(`Failed to obtain Google OAuth access token: HTTP ${resp.status} - ${bodyText.substring(0, 300)}`);
    }

    const json = await resp.json();
    if (!json.access_token) {
        throw new Error('Google OAuth token response did not include an access_token');
    }

    return json.access_token as string;
}
