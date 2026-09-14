import { GoogleAuthProvider, OAuthProvider, signInWithPopup, linkWithPopup, type User } from 'firebase/auth';
import { auth } from './firebase';
export type SocialProvider = 'google' | 'apple';
export function socialProvider(name: SocialProvider) {
  if(name === 'google') { const provider = new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'}); return provider; }
  const provider = new OAuthProvider('apple.com'); provider.addScope('email'); provider.addScope('name'); return provider;
}
/** Invoke directly from a user gesture; no pre-popup asynchronous work. */
export function socialSignIn(name: SocialProvider) { return signInWithPopup(auth,socialProvider(name)); }
export function linkSocialAccount(user: User, name: SocialProvider) { return linkWithPopup(user,socialProvider(name)); }
export function socialAuthError(error: unknown): string {
  const code = (error as {code?:string})?.code;
  switch(code) {
    case 'auth/account-exists-with-different-credential': return 'Sign in using your existing method first. Then open Profile settings to link Google or Apple to the same pet records.';
    case 'auth/credential-already-in-use': case 'auth/email-already-in-use': return 'That login belongs to another account. Sign in to that account; linking cannot merge separate pet records.';
    case 'auth/provider-already-linked': return 'This sign-in method is already linked to your account.';
    case 'auth/popup-blocked': return 'Allow sign-in popups for this site, then tap the button again. On a phone, open this page directly in Safari or Chrome.';
    case 'auth/popup-closed-by-user': case 'auth/cancelled-popup-request': return 'Sign-in was cancelled. You can try again when ready.';
    case 'auth/operation-not-allowed': case 'auth/invalid-oauth-client-id': case 'auth/missing-or-invalid-nonce': return 'This sign-in provider is not ready. Use another method while the clinic completes its provider setup.';
    case 'auth/unauthorized-domain': return 'This site address is not authorized for sign-in. Use the hospital’s main app address or contact the clinic.';
    case 'auth/network-request-failed': return 'Sign-in could not connect. Check your connection and try again.';
    case 'auth/requires-recent-login': return 'Sign in again before linking another login method.';
    case 'auth/user-disabled': return 'This account is disabled. Contact the clinic.';
    case 'auth/web-storage-unsupported': return 'This browser cannot keep a sign-in session. Open the app directly in Safari or Chrome with site storage enabled.';
    default: return 'Sign-in could not finish. Try again or use another sign-in method.';
  }
}
