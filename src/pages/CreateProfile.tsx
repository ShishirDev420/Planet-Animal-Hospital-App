import '../styles/onboarding.css';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PawPrint } from 'lucide-react';
import Logo from '../components/Logo';
import { useCare } from '../lib/care/client';

export default function CreateProfile() {
  const navigate = useNavigate();
  const care = useCare();
  const [petName, setPetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = petName.trim();
    if (!name || isSaving) return;
    if (!care.state) { setError('Your care account is unavailable. Please try again when it reconnects.'); return; }
    setIsSaving(true);
    setError('');
    try {
      const petId = crypto.randomUUID();
      await care.command({ type: 'addPet', petId, name });
      care.setPetId(petId);
      navigate('/');
    } catch (cause) {
      setError((cause as Error).message || 'Your pet could not be added. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return <main className="onboarding-shell"><div className="onboarding-wrap">
    <header className="onboarding-brand"><button type="button" aria-label="Go back" className="onboarding-back" onClick={() => navigate('/profiles')}><ArrowLeft size={20}/></button><Logo size="sm" /></header>
    <div className="onboarding-intro"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fec708]/15 text-[#fec708]"><PawPrint size={24}/></span><h1>Make room for another companion.</h1><p>Add a separate care space for your pet. Their clinical history and next steps begin only when recorded or reviewed by the hospital.</p></div>
    <form onSubmit={handleSubmit} className="onboarding-card onboarding-form">
      {error && <p className="onboarding-error" role="alert">{error}</p>}
      <label className="onboarding-field"><span>Pet’s name</span><input required maxLength={100} value={petName} onChange={event => setPetName(event.target.value)} placeholder="What do you call them?" autoComplete="off" /></label>
      <p className="text-sm leading-6 text-white/70">After adding your pet, you can share their history and prescriptions in their care space.</p>
      <button type="submit" disabled={isSaving || !care.state || !petName.trim()} className="onboarding-primary">{isSaving ? 'Adding pet…' : 'Add pet'}</button>
      {!care.state && <button type="button" className="onboarding-back" onClick={() => void care.refresh()}>Retry care connection</button>}
    </form>
  </div></main>;
}
