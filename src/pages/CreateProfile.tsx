import '../styles/onboarding.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function CreateProfile() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    userName: '',
    petName: '',
    petWeight: '',
    medicalHistory: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please sign in again before creating a profile.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const existingProfile = await getDoc(doc(db, 'users', auth.currentUser.uid));
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || formData.userName.trim() || 'Pet Parent',
        parentName: formData.userName.trim(),
        petName: formData.petName.trim(),
        weight: formData.petWeight.trim(),
        medicalHistory: formData.medicalHistory.trim(),
        ...(!existingProfile.exists() ? { pawPoints: 500, currentPlan: 'free', createdAt: serverTimestamp() } : {}),
      }, { merge: true });
      navigate('/profiles');
    } catch (err) {
      console.error('Failed to create profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return <main className="onboarding-shell"><div className="onboarding-wrap">
    <header className="onboarding-brand"><button aria-label="Go back" className="onboarding-back" onClick={() => navigate(-1)}><ArrowLeft size={20}/></button><Logo size="sm" /></header>
    <div className="onboarding-intro"><h1>A place for your companion.</h1><p>Add the details your care team should know.</p></div>
    <form onSubmit={handleSubmit} className="onboarding-card onboarding-form">
      {error && <p className="onboarding-error" role="alert">{error}</p>}
      <fieldset className="onboarding-fields" disabled={isSaving}><legend className="sr-only">Profile details</legend>
        <label className="onboarding-field"><span>Your name</span><input required pattern=".*\S.*" autoComplete="name" value={formData.userName} onChange={e => setFormData({...formData,userName:e.target.value})} placeholder="Your preferred name" /></label>
        <label className="onboarding-field"><span>Pet’s name</span><input required pattern=".*\S.*" value={formData.petName} onChange={e => setFormData({...formData,petName:e.target.value})} placeholder="What do you call them?" /></label>
        <label className="onboarding-field"><span>Pet’s weight</span><input required pattern=".*\S.*" value={formData.petWeight} onChange={e => setFormData({...formData,petWeight:e.target.value})} placeholder="e.g. 12 kg" /></label>
        <label className="onboarding-field"><span>Care notes<small>Optional</small></span><textarea rows={4} value={formData.medicalHistory} onChange={e => setFormData({...formData,medicalHistory:e.target.value})} placeholder="Allergies, past surgeries or anything the team should know." /></label>
      </fieldset>
      <button type="submit" disabled={isSaving} className="onboarding-primary">{isSaving ? 'Saving profile…' : 'Save profile'}</button>
    </form>
  </div></main>;
}
