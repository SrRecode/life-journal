const CHALLENGE = new TextEncoder().encode('life-journal-unlock');

export async function hasPlatformAuthenticator() {
  try {
    return !!(window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()));
  } catch {
    return false;
  }
}

function randId() {
  return crypto.randomUUID();
}

export async function registerFingerprint() {
  const userId = new TextEncoder().encode(randId());
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: CHALLENGE,
      rp: { name: 'Life Journal' },
      user: { id: userId, name: 'journal', displayName: 'Journal' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 30000,
    },
  });
  return btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
}

export async function verifyFingerprint(credIdB64) {
  const id = Uint8Array.from(atob(credIdB64), (c) => c.charCodeAt(0));
  await navigator.credentials.get({
    publicKey: {
      challenge: CHALLENGE,
      allowCredentials: [{ type: 'public-key', id }],
      userVerification: 'required',
      timeout: 30000,
    },
  });
  return true;
}
