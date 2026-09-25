import { socialSignIn, socialAuthError, type SocialProvider } from '../lib/socialAuth';
import { useState, useEffect } from 'react';
import OnboardingForm from '../components/OnboardingForm';
import '../styles/onboarding.css';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, type User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

const getAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This app domain needs Firebase authorization. Contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/invalid-credential':
      return "That email and password didn't match. Check them or create an account.";
    case 'auth/email-already-in-use':
      return "That email already has an account. Sign in with your password or use Google.";
    case 'auth/weak-password':
      return 'Use at least 6 characters for your password.';
    case 'auth/popup-blocked':
    case 'auth/cancelled-popup-request':
    case 'auth/popup-closed-by-user':
      return 'Please allow popups for this site and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Create one first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Try again or reset it.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.';
    default:
      return error?.message || `Authentication failed (${code || 'unknown'})`;
  }
};

export default function Welcome({ initialOnboarding = false, onComplete }: { initialOnboarding?: boolean, onComplete?: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [socialChoice, setSocialChoice] = useState<SocialProvider>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [parentName, setParentName] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!initialOnboarding || !auth.currentUser) return;
    if (auth.currentUser.displayName && !parentName) {
      setParentName(auth.currentUser.displayName.split(' ')[0]);
    }
    setNeedsOnboarding(true);
  }, [initialOnboarding, parentName]);

  const continueToClinic = (hasCompletedProfile: boolean) => {
    if (!hasCompletedProfile) {
      setNeedsOnboarding(true);
      return;
    }
    if (onComplete) onComplete();
    navigate('/');
  };

  const ensureUserDocument = async (user: User) => {
    const docRef = doc(db, 'users', user.uid);
    const existingProfile = await getDoc(docRef);

    if (!existingProfile.exists()) {
      await setDoc(docRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Pet Parent',
        petName: 'Pending',
        pawPoints: 500,
        currentPlan: 'free',
        createdAt: serverTimestamp(),
      });
      return { hasCompletedProfile: false };
    }

    const data = existingProfile.data();
    // Existing zero balances must never re-trigger the registration bonus.
    const hasCompletedProfile = Boolean(data?.petName && data.petName !== 'Pending');
    return { hasCompletedProfile };
  };

  const onSubmit = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setAuthError('Enter your email and password to continue.');
      return;
    }
    if (isSignUp && password.length < 6) {
      setAuthError('Use at least 6 characters for your password.');
      return;
    }

    setIsEmailLoading(true);
    setAuthError('');
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          phone: phone.trim() || '',
          displayName: userCredential.user.displayName || 'Pet Parent',
          petName: 'Pending',
          pawPoints: 500,
          currentPlan: 'free',
          createdAt: serverTimestamp()
        });
        setNeedsOnboarding(true);
      } else {
        if (initialOnboarding && auth.currentUser) {
          setNeedsOnboarding(true);
          return;
        }
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const { hasCompletedProfile } = await ensureUserDocument(userCredential.user);
        continueToClinic(hasCompletedProfile);
      }
    } catch (e: any) {
      console.error('Auth failed', e);
      const message = getAuthErrorMessage(e);
      if (e.code === 'auth/email-already-in-use') {
        setIsSignUp(false);
      }
      setAuthError(message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSocialAuth = async (name: SocialProvider) => {
    setIsGoogleLoading(true); setSocialChoice(name);
    try {
      setAuthError('');

      const result = await socialSignIn(name);
      const { hasCompletedProfile } = await ensureUserDocument(result.user);
      continueToClinic(hasCompletedProfile);
    } catch (e: any) {
      setAuthError(socialAuthError(e));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteProfile = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!parentName.trim() || !petName.trim() || !breed.trim() || !age.trim() || !weight.trim()) {
      setAuthError('Add your name, your pet’s name, breed, age and weight to continue.');
      return;
    }
    if (!auth.currentUser) { setAuthError('Please sign in again to save your profile.'); return; }
    if (isProfileSaving) return;
    setIsProfileSaving(true);
    try {
      setAuthError('');
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || 'Pet Parent',
          parentName: parentName.trim(),
          petName: petName.trim(),
          petType,
          breed: breed.trim(),
          age: age.trim(),
          gender,
          weight: weight.trim(),
          additionalDetails: additionalDetails.trim(),
          phone: phone.trim() || '',
        }, { merge: true });

        if (onComplete) {
          onComplete();
        } else {
          setNeedsOnboarding(false);
        }
        navigate('/');
      }
    } catch (e: any) {
      console.error('Onboarding failed', e);
      setAuthError('Failed to save profile. Please try again.');
    } finally { setIsProfileSaving(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email to reset password.');
      return;
    }
    try {
      setAuthError('');
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent! Please check your inbox.');
    } catch (e: any) {
      console.error('Password reset failed', e);
      setAuthError(getAuthErrorMessage(e));
    }
  };

  const busy = isEmailLoading || isGoogleLoading;
  const setters = { parentName: setParentName, petName: setPetName, petType: setPetType, breed: setBreed, age: setAge, gender: setGender, weight: setWeight, phone: setPhone, additionalDetails: setAdditionalDetails };
  return <main className="onboarding-shell"><div className="onboarding-wrap">
    <header className="onboarding-brand"><span className="onboarding-brand-mark"><Logo size="sm" /></span><p><strong>Planet Animal</strong>Hospital &amp; Wellness</p></header>
    <div className="onboarding-intro"><h1>{needsOnboarding ? 'Their care starts with you.' : 'A familiar place. A little more care.'}</h1><p>{needsOnboarding ? 'Create your pet’s profile in two short steps.' : 'Your pet’s records, care journey and next visit, together.'}</p></div>
    <section className="onboarding-card" aria-label={needsOnboarding ? 'Create your pet profile' : 'Sign in to Planet Animal'}>
      {needsOnboarding ? <OnboardingForm values={{ parentName, petName, petType, breed, age, gender, weight, phone, additionalDetails }} onChange={(key, value) => { setters[key](value); setAuthError(''); }} onSubmit={() => void handleCompleteProfile()} saving={isProfileSaving} error={authError} /> : <>
        <button type="button" className="onboarding-social" disabled={busy} onClick={() => void handleSocialAuth('google')}>{isGoogleLoading && socialChoice === 'google' ? <><Loader2 size={18} className="animate-spin" />Opening Google…</> : 'Continue with Google'}</button>
        <button type="button" className="onboarding-social" disabled={busy} onClick={() => void handleSocialAuth('apple')}>{isGoogleLoading && socialChoice === 'apple' ? <><Loader2 size={18} className="animate-spin" />Opening Apple…</> : 'Sign in with Apple'}</button>
        <div className="onboarding-divider">or continue with email</div>
        <div className="onboarding-tabs" aria-label="Account options"><button type="button" aria-pressed={!isSignUp} disabled={busy} onClick={() => { setIsSignUp(false); setAuthError(''); }}>Sign in</button><button type="button" aria-pressed={isSignUp} disabled={busy} onClick={() => { setIsSignUp(true); setAuthError(''); }}>Create account</button></div>
        <form onSubmit={onSubmit} className="onboarding-form">
          {authError && <p role="alert" className="onboarding-error">{authError}</p>}
          <fieldset disabled={busy} className="onboarding-fields"><legend className="sr-only">Account details</legend>
            <label className="onboarding-field"><span>Email</span><input type="email" required value={email} onChange={e => { setEmail(e.target.value); setAuthError(''); }} autoComplete="email" placeholder="you@example.com" /></label>
            <label className="onboarding-field"><span>Password</span><input type="password" required minLength={isSignUp ? 6 : undefined} value={password} onChange={e => { setPassword(e.target.value); setAuthError(''); }} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder={isSignUp ? 'At least 6 characters' : 'Your password'} /></label>
            {isSignUp && <label className="onboarding-field"><span>Mobile number<small>Optional</small></span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="Your contact number" /></label>}
          </fieldset>
          <button className="onboarding-primary" type="submit" disabled={busy}>{isEmailLoading && <Loader2 size={18} className="animate-spin" />}{isEmailLoading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</button>
          <p className="onboarding-note">{isSignUp ? 'Next, introduce us to your pet.' : 'Welcome back to your pet’s care.'}</p>
        </form>
        {!isSignUp && <button type="button" disabled={busy} className="onboarding-text-button" onClick={handleForgotPassword}>Forgot password?</button>}
      </>}
    </section>
  </div></main>;
}
