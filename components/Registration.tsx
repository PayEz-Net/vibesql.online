'use client';

import { useState } from 'react';

const EVENT_CODE = 'vibesql-hackathon-2026';
const API_BASE = process.env.NEXT_PUBLIC_EVENT_API_URL || 'https://api.vibesql.online';

type Step = 'register' | 'verify' | 'done';
type ParticipationType = 'solo' | 'have-team' | 'looking';

interface FormData {
  fullName: string;
  email: string;
  participationType: ParticipationType;
  trackPreference: string;
}

export default function Registration() {
  const [step, setStep] = useState<Step>('register');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    participationType: 'solo',
    trackPreference: '',
  });
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/events/${EVENT_CODE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          participationType: formData.participationType || undefined,
          trackPreference: formData.trackPreference || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Registration failed. Please try again.');
      }

      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/events/${EVENT_CODE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: verifyCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Verification failed. Check your code and try again.');
      }

      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="register" className="section-container">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Claim Your <span className="text-vibe-accent">Spot</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          100% remote. Free to enter. Open worldwide.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="gradient-border p-8">
          {/* Step indicators */}
          {step !== 'done' && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <StepIndicator num={1} label="Register" active={step === 'register'} done={step === 'verify'} />
              <div className={`h-px w-12 ${step === 'verify' ? 'bg-vibe-accent' : 'bg-slate-700'} transition-colors`} />
              <StepIndicator num={2} label="Verify Email" active={step === 'verify'} done={false} />
            </div>
          )}

          {/* Step 1: Registration form */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Jane Doe"
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="form-label">How are you participating?</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['solo', 'Solo'],
                    ['have-team', 'Have a Team'],
                    ['looking', 'Need a Team'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, participationType: value }))}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        formData.participationType === value
                          ? 'bg-vibe-accent/20 border-vibe-accent text-white'
                          : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Preferred Track <span className="text-slate-500">(optional)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['build', 'Build Apps'],
                    ['bugs', 'Find Bugs'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, trackPreference: p.trackPreference === value ? '' : value }))}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        formData.trackPreference === value
                          ? 'bg-vibe-accent/20 border-vibe-accent text-white'
                          : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <ErrorMessage message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    Register
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                By registering you agree to our{' '}
                <a href="#rules" className="text-vibe-light hover:underline">Code of Conduct</a>.
              </p>
            </form>
          )}

          {/* Step 2: Email verification */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-vibe-accent/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-vibe-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-300">
                  We sent a 6-digit code to
                </p>
                <p className="text-white font-mono font-semibold mt-1">{formData.email}</p>
              </div>

              <div>
                <label htmlFor="code" className="form-label">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  className="form-input text-center text-2xl font-mono tracking-[0.5em]"
                  placeholder="------"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              {error && <ErrorMessage message={error} />}

              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : 'Verify & Confirm'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('register'); setError(''); setVerifyCode(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Wrong email? Go back
              </button>
            </form>
          )}

          {/* Step 3: Confirmed */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">You&apos;re In!</h3>
              <p className="text-slate-400 mb-6">
                Welcome to the VibeSQL Hackathon, <span className="text-white font-medium">{formData.fullName}</span>.
                <br />
                We&apos;ll send event details to <span className="font-mono text-vibe-light">{formData.email}</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://github.com/PayEz-Net/vibesql-skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Grab the Starter Kit
                </a>
                <a
                  href="https://vibesql.online/docs.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  Read the Docs
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StepIndicator({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
        done ? 'bg-vibe-accent text-white' :
        active ? 'bg-vibe-accent/20 border-2 border-vibe-accent text-vibe-accent' :
        'bg-slate-800 border-2 border-slate-600 text-slate-500'
      }`}>
        {done ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : num}
      </div>
      <span className={`text-sm font-medium hidden sm:inline ${active || done ? 'text-white' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
      <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-red-300">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
