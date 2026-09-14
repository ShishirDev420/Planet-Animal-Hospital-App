import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import '../styles/onboarding.css';

export type OnboardingValues = { parentName: string; petName: string; petType: string; breed: string; age: string; gender: string; weight: string; phone: string; additionalDetails: string };

export default function OnboardingForm({ values, onChange, onSubmit, saving, error }: {
  values: OnboardingValues;
  onChange: (key: keyof OnboardingValues, value: string) => void;
  onSubmit: () => void;
  saving: boolean;
  error: string;
}) {
  const [step, setStep] = useState(0);
  const field = (key: keyof OnboardingValues, label: string, placeholder: string, required = true) => (
    <label className="onboarding-field" key={key}>
      <span>{label}{!required && <small>Optional</small>}</span>
      <input name={key} value={values[key]} onChange={e => onChange(key, e.target.value)} required={required} pattern={required ? '.*\\S.*' : undefined} placeholder={placeholder} autoComplete={key === 'parentName' ? 'name' : key === 'phone' ? 'tel' : 'off'} type={key === 'phone' ? 'tel' : 'text'} />
    </label>
  );
  return <form className="onboarding-form" onSubmit={e => { e.preventDefault(); if (step === 0) setStep(1); else onSubmit(); }}>
    <ol className="onboarding-steps" aria-label="Profile setup progress">
      {['Meet your pet', 'Care details'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}><span>{step > index ? <Check size={14} /> : index + 1}</span>{label}</li>)}
    </ol>
    <div className="onboarding-section-heading"><h2>{step === 0 ? 'A little introduction.' : 'The details that help us care.'}</h2><p>{step === 0 ? 'Start with you and your companion.' : 'Share what you know. Include units for age and weight.'}</p></div>
    {error && <p className="onboarding-error" role="alert">{error}</p>}
    <fieldset disabled={saving} className="onboarding-fields" key={step}>
      <legend className="sr-only">{step === 0 ? 'Parent and pet' : 'Care details'}</legend>
      {step === 0 ? <>
        {field('parentName', 'Your name', 'Your preferred name')}
        {field('petName', 'Pet’s name', 'What do you call them?')}
        <fieldset className="onboarding-choice"><legend>Pet type</legend><div>{['Dog', 'Cat'].map(type => <label key={type}><input type="radio" name="petType" value={type} checked={values.petType === type} onChange={() => onChange('petType', type)} /><span>{type}<Check size={16} /></span></label>)}</div></fieldset>
        {field('breed', 'Breed', 'e.g. Indie or mixed breed')}
      </> : <>
        <div className="onboarding-pair">{field('age', 'Age', 'e.g. 6 months')}<label className="onboarding-field"><span>Sex</span><select value={values.gender} onChange={e => onChange('gender', e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></label></div>
        {field('weight', 'Weight', 'e.g. 12 kg')}
        {field('phone', 'Mobile number', 'Your contact number', false)}
        <label className="onboarding-field"><span>Anything else?<small>Optional</small></span><textarea value={values.additionalDetails} onChange={e => onChange('additionalDetails', e.target.value)} placeholder="Allergies, past care or anything you’d like the team to know." rows={3} /></label>
      </>}
    </fieldset>
    <div className="onboarding-actions">{step === 1 && <button type="button" className="onboarding-back" onClick={() => setStep(0)} disabled={saving}><ArrowLeft size={18} />Back</button>}<button type="submit" className="onboarding-primary" disabled={saving}>{saving ? <Loader2 size={18} className="animate-spin" /> : null}{saving ? 'Saving profile…' : step === 0 ? 'Continue' : 'Save & enter clinic'}{!saving && <ArrowRight size={18} />}</button></div>
    <p className="onboarding-note">{step === 0 ? 'Next: age, weight and any care notes.' : 'These details help the team get to know your pet.'}</p>
  </form>;
}
