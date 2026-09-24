import { ArrowLeft, ArrowRight, BadgeCheck, HeartPulse, PawPrint } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ClinicWallet from '../components/ClinicWallet';
import './rewards.css';

export default function Rewards() {
  const navigate = useNavigate();
  const location = useLocation();
  return <main className="care-wallet-page mx-auto max-w-6xl px-4 pb-32 pt-5 text-white sm:px-6 lg:pt-10">
    <header className="wallet-page-heading">
      <button type="button" className="wallet-back" onClick={() => navigate({ pathname: '/', search: location.search })} aria-label="Back to overview"><ArrowLeft size={19}/></button>
      <div className="min-w-0"><p className="wallet-eyebrow">Planet Animal · Paw Points</p><h1>Care <em>Wallet</em></h1><p>Your verified points and their next chapter, all in one place.</p></div>
      <div className="wallet-heading-mark" aria-hidden="true"><PawPrint size={36}/></div>
    </header>

    <ClinicWallet />

    <section className="wallet-how" aria-labelledby="wallet-how-title">
      <div className="wallet-how-intro"><span className="wallet-eyebrow">A little care goes a long way</span><h2 id="wallet-how-title">How points grow</h2><p>Your care journey follows the clinic’s recorded and approved rules.</p></div>
      <div className="wallet-how-steps">
        <div><span><HeartPulse size={22}/></span><strong>Care happens</strong><p>Complete an eligible service or an approved care milestone.</p></div>
        <div><span><BadgeCheck size={22}/></span><strong>The clinic verifies it</strong><p>Staff and veterinarian approvals protect your care record and points.</p></div>
        <div><span><PawPrint size={22}/></span><strong>Points appear here</strong><p>Available points count toward clinic approved discounts.</p></div>
      </div>
      <p className="wallet-how-note">A booking request alone does not earn points. Pet specific checkups stay separate from this shared wallet.</p>
      <button className="wallet-book-link" onClick={() => navigate({ pathname: '/', search: `${location.search ? location.search + '&' : '?'}openBooking=true` })}>Plan a visit <ArrowRight size={18}/></button>
    </section>
  </main>;
}
