import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Settings2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  trackIdeaGenerated,
  trackSpeedrunCompleted,
  trackSpeedrunStarted,
  trackUserReturnedIfNeeded,
} from "@/lib/analytics";

type Phase = "idle" | "spinning" | "challenge" | "submit" | "result";
type Difficulty = "easy" | "normal" | "hard" | "insane";

type Idea = {
  text: string;
  category: string;
  difficulty: Difficulty[];
};

type Settings = {
  minutes: number;
  sound: boolean;
  difficulty: Difficulty;
};

type Submission = {
  idea: string;
  minutes: number;
  projectName: string;
  projectUrl: string;
  description: string;
  screenshot?: string;
};

const INSTAGRAM_URL = "https://www.instagram.com/foundedbymd/?hl=en";
const SETTINGS_KEY = "startup-speedrun-settings";
const SUBMISSION_KEY = "startup-speedrun-last-submission";
const AUDIO_PATH = "/manus-storage/roulette-wheel-spin_20444ae5.mp3";
const AUDIO_START_SECONDS = 3;
const SPIN_DURATION_MS = 2320;

const IDEAS: Idea[] = [
  { text: "Build a marketplace where students trade unused textbooks.", category: "marketplace", difficulty: ["easy", "normal"] },
  { text: "Build a tool that turns messy screenshots into organized tasks.", category: "productivity", difficulty: ["easy", "normal"] },
  { text: "Build a social network for people building side projects.", category: "social", difficulty: ["normal", "hard"] },
  { text: "Build a platform where restaurants sell unsold food at closing time.", category: "local business", difficulty: ["normal", "hard"] },
  { text: "Build a tool that turns GitHub activity into a public portfolio.", category: "developer tools", difficulty: ["easy", "normal"] },
  { text: "Build an app that helps people find accountability partners.", category: "consumer", difficulty: ["easy", "normal"] },
  { text: "Build a website that generates startup names based on a target audience.", category: "creator tools", difficulty: ["easy"] },
  { text: "Build a lightweight CRM for independent music teachers.", category: "saas", difficulty: ["normal", "hard"] },
  { text: "Build an AI copilot that rewrites confusing customer support replies.", category: "ai", difficulty: ["normal", "hard"] },
  { text: "Build a daily five-minute game that teaches one useful browser shortcut.", category: "education", difficulty: ["easy", "normal"] },
  { text: "Build a price tracker for the ingredients in one favorite recipe.", category: "fintech", difficulty: ["easy", "normal"] },
  { text: "Build a digital lost-and-found for apartment buildings.", category: "local business", difficulty: ["easy", "normal"] },
  { text: "Build a tool that turns a podcast transcript into short video scripts.", category: "creator tools", difficulty: ["normal", "hard"] },
  { text: "Build a private inbox for people who hate group chats.", category: "social", difficulty: ["hard", "insane"] },
  { text: "Build a browser extension that hides all but the next important tab.", category: "productivity", difficulty: ["easy", "normal"] },
  { text: "Build a community board for sharing tools with neighbors.", category: "consumer", difficulty: ["easy", "normal"] },
  { text: "Build an AI reviewer that finds unclear copy on landing pages.", category: "ai", difficulty: ["normal", "hard"] },
  { text: "Build a marketplace for renting unused camera gear by the hour.", category: "marketplace", difficulty: ["normal", "hard"] },
  { text: "Build a one-page operating system for running a pop-up shop.", category: "saas", difficulty: ["normal", "hard"] },
  { text: "Build a tool that makes a playable quiz from any PDF.", category: "education", difficulty: ["easy", "normal"] },
  { text: "Build a public changelog for the tiny apps people ship on weekends.", category: "developer tools", difficulty: ["easy", "normal"] },
  { text: "Build a game where players negotiate the price of imaginary objects.", category: "gaming", difficulty: ["normal", "hard"] },
  { text: "Build a service that matches local venues with empty weekday events.", category: "local business", difficulty: ["hard", "insane"] },
  { text: "Build a tool that turns voice notes into a prioritized morning plan.", category: "productivity", difficulty: ["easy", "normal"] },
  { text: "Build a membership club for exchanging one-hour skills.", category: "marketplace", difficulty: ["normal", "hard"] },
  { text: "Build a feed of the most interesting questions people ask in public.", category: "social", difficulty: ["hard", "insane"] },
  { text: "Build a tiny invoicing app for people who only send three invoices a month.", category: "fintech", difficulty: ["easy", "normal"] },
  { text: "Build a no-code status page for a single freelance project.", category: "saas", difficulty: ["easy"] },
  { text: "Build a tool that turns a recipe into a grocery route through one store.", category: "consumer", difficulty: ["normal", "hard"] },
  { text: "Build a game that teaches one person how to read a balance sheet.", category: "education", difficulty: ["normal", "hard"] },
  { text: "Build a simple API that gives every side project a launch date.", category: "developer tools", difficulty: ["normal", "hard"] },
  { text: "Build a directory of the best independent services in one city block.", category: "local business", difficulty: ["easy", "normal"] },
  { text: "Build a browser game about making a good decision with incomplete data.", category: "gaming", difficulty: ["hard", "insane"] },
  { text: "Build a tool that converts a messy calendar into a weekly energy budget.", category: "productivity", difficulty: ["hard", "insane"] },
  { text: "Build an AI that gives your landing page a brutally honest first impression.", category: "ai", difficulty: ["normal", "hard"] },
  { text: "Build a marketplace where creators swap unused sponsorship slots.", category: "creator tools", difficulty: ["hard", "insane"] },
  { text: "Build a social app where every post expires after one thoughtful reply.", category: "social", difficulty: ["hard", "insane"] },
  { text: "Build a wallet that shows what subscriptions cost per useful day.", category: "fintech", difficulty: ["normal", "hard"] },
  { text: "Build a tool that helps a small team choose what not to build.", category: "saas", difficulty: ["hard", "insane"] },
  { text: "Build an app that turns a walk into a guided audio scavenger hunt.", category: "consumer", difficulty: ["normal", "hard"] },
  { text: "Build a collaborative whiteboard where every sticky note has an owner.", category: "productivity", difficulty: ["easy", "normal"] },
  { text: "Build a multiplayer game that rewards players for explaining their strategy.", category: "gaming", difficulty: ["hard", "insane"] },
  { text: "Build a directory that ranks coworking spaces by how easy it is to meet people.", category: "local business", difficulty: ["normal", "hard"] },
  { text: "Build a tool that creates a test dataset from a product description.", category: "developer tools", difficulty: ["hard", "insane"] },
  { text: "Build a marketplace for borrowing one oddly specific household item.", category: "marketplace", difficulty: ["easy", "normal"] },
  { text: "Build a micro-course that teaches a skill in seven browser-sized lessons.", category: "education", difficulty: ["easy", "normal"] },
  { text: "Build a tool that turns a creator's archive into a searchable idea bank.", category: "creator tools", difficulty: ["normal", "hard"] },
  { text: "Build a service that lets a neighborhood vote on one shared improvement.", category: "local business", difficulty: ["hard", "insane"] },
  { text: "Build a habit tracker where you can only keep three habits at once.", category: "consumer", difficulty: ["easy", "normal"] },
  { text: "Build an AI naming partner that refuses to suggest names already taken.", category: "ai", difficulty: ["normal", "hard"] },
  { text: "Build a two-player game played entirely through calendar invites.", category: "weird", difficulty: ["insane"] },
  { text: "Build a tiny storefront for selling one beautiful digital object.", category: "creator tools", difficulty: ["easy", "normal"] },
  { text: "Build a product brief generator that only asks five very good questions.", category: "saas", difficulty: ["easy", "normal"] },
  { text: "Build a social feed where people post only things they made today.", category: "social", difficulty: ["normal", "hard"] },
  { text: "Build a browser-based rehearsal room for remote bands.", category: "creator tools", difficulty: ["hard", "insane"] },
  { text: "Build a simple dashboard for tracking the promises you make to yourself.", category: "productivity", difficulty: ["easy", "normal"] },
  { text: "Build a tool that shows which parts of an app users never discover.", category: "saas", difficulty: ["hard", "insane"] },
  { text: "Build a game where every level is designed by the player before you.", category: "gaming", difficulty: ["insane"] },
  { text: "Build a financial planner for people paid irregularly and in small amounts.", category: "fintech", difficulty: ["hard", "insane"] },
];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
  insane: "Insane",
};

const TIME_OPTIONS = [5, 10, 15, 30, 60];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(totalSeconds % 60, 0).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function readSettings(): Settings {
  const fallback: Settings = { minutes: 10, sound: true, difficulty: "normal" };
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
}

function chooseIdea(difficulty: Difficulty, current?: string) {
  const matching = IDEAS.filter((idea) => idea.difficulty.includes(difficulty));
  const pool = matching.length ? matching : IDEAS;
  const withoutCurrent = current ? pool.filter((idea) => idea.text !== current) : pool;
  return (withoutCurrent.length ? withoutCurrent : pool)[Math.floor(Math.random() * (withoutCurrent.length ? withoutCurrent.length : pool.length))];
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [abandonConfirmOpen, setAbandonConfirmOpen] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea>(() => chooseIdea("normal"));
  const [seconds, setSeconds] = useState(600);
  const [timerStarted, setTimerStarted] = useState(false);
  const [spinTick, setSpinTick] = useState(0);
  const [form, setForm] = useState({ projectName: "", projectUrl: "", description: "", screenshot: "" });
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const spinInterval = useRef<number | null>(null);
  const spinTimeout = useRef<number | null>(null);

  const persistSettings = useCallback((next: Settings) => {
    setSettings(next);
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  const playSpinSound = useCallback(() => {
    if (!settings.sound) return;
    let fallbackStarted = false;
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const context = new AudioContextClass();
        const begin = () => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "triangle";
          oscillator.frequency.setValueAtTime(110, context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(760, context.currentTime + 0.32);
          oscillator.frequency.exponentialRampToValueAtTime(180, context.currentTime + 1.9);
          gain.gain.setValueAtTime(0.001, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2.05);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 2.1);
        };
        void context.resume().then(begin).catch(begin);
        window.setTimeout(() => void context.close(), 2300);
      } catch {
        // Sound is a progressive enhancement; the interaction remains complete without it.
      }
    };
    const playLandingBeat = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const context = new AudioContextClass();
        const begin = () => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(145, context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(88, context.currentTime + 0.24);
          gain.gain.setValueAtTime(0.001, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.28);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.3);
        };
        void context.resume().then(begin).catch(begin);
        window.setTimeout(() => void context.close(), 500);
      } catch {
        // The landing beat is optional enhancement.
      }
    };
    // Always start the Web Audio layer inside the same user gesture. This keeps
    // the spin audible even when a browser delays remote media metadata/seek.
    fallback();
    try {
      const audio = new Audio(AUDIO_PATH);
      audio.volume = 0.7;
      audio.onerror = fallback;
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      if (audio.readyState >= 1) audio.currentTime = AUDIO_START_SECONDS;
      else audio.addEventListener("loadedmetadata", () => {
        audio.currentTime = AUDIO_START_SECONDS;
      }, { once: true });
      void audio.play().catch(fallback);
      window.setTimeout(() => {
        audio.pause();
        audio.currentTime = AUDIO_START_SECONDS;
      }, SPIN_DURATION_MS);
      window.setTimeout(playLandingBeat, 2250);
    } catch {
      // The authorized local asset is optional; visual feedback remains complete without it.
    }
  }, [settings.sound]);

  const spin = useCallback(() => {
    if (phase === "spinning") return;
    setSettingsOpen(false);
    setError("");
    setPhase("spinning");
    setSpinTick(0);
    playSpinSound();

    if (spinInterval.current) window.clearInterval(spinInterval.current);
    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);

    spinInterval.current = window.setInterval(() => {
      setSpinTick((tick) => tick + 1);
      setCurrentIdea((idea) => chooseIdea(settings.difficulty, idea.text));
    }, 92);

    spinTimeout.current = window.setTimeout(() => {
      if (spinInterval.current) window.clearInterval(spinInterval.current);
      const finalIdea = chooseIdea(settings.difficulty, currentIdea.text);
      setCurrentIdea(finalIdea);
      setSeconds(settings.minutes * 60);
      setTimerStarted(false);
      setPhase("challenge");
      trackIdeaGenerated({
        idea: finalIdea.text,
        category: finalIdea.category,
        difficulty: settings.difficulty,
      });
    }, 2320);
  }, [currentIdea.text, phase, playSpinSound, settings.difficulty, settings.minutes]);

  useEffect(() => {
    return () => {
      if (spinInterval.current) window.clearInterval(spinInterval.current);
      if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    };
  }, []);

  useEffect(() => {
    trackUserReturnedIfNeeded();
  }, []);

  useEffect(() => {
    if (phase !== "challenge" || !timerStarted) return;
    if (seconds <= 0) {
      setPhase("submit");
      return;
    }
    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, seconds, timerStarted]);

  const startTimer = useCallback(() => {
    if (timerStarted || phase !== "challenge") return;
    setTimerStarted(true);
    trackSpeedrunStarted({
      minutes: settings.minutes,
      difficulty: settings.difficulty,
      idea: currentIdea.text,
      category: currentIdea.category,
    });
  }, [currentIdea.category, currentIdea.text, phase, settings.difficulty, settings.minutes, timerStarted]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && settingsOpen) setSettingsOpen(false);
      if (event.code === "Space" && phase === "idle" && !settingsOpen && document.activeElement?.tagName !== "BUTTON") {
        event.preventDefault();
        spin();
      }
      if (event.code === "Space" && phase === "challenge" && !settingsOpen && !timerStarted && document.activeElement?.tagName !== "BUTTON") {
        event.preventDefault();
        startTimer();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, settingsOpen, spin, startTimer, timerStarted]);

  const handleNewSpin = () => {
    if (phase === "challenge" && seconds > 0) {
      setAbandonConfirmOpen(true);
      return;
    }
    spin();
  };

  const confirmAbandon = () => {
    setAbandonConfirmOpen(false);
    spin();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((value) => ({ ...value, screenshot: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.projectName.trim() || !form.projectUrl.trim()) {
      setError("Add a project name and URL before submitting.");
      return;
    }
    const next: Submission = {
      idea: currentIdea.text,
      minutes: settings.minutes,
      projectName: form.projectName.trim(),
      projectUrl: form.projectUrl.trim(),
      description: form.description.trim(),
      screenshot: form.screenshot || undefined,
    };
    window.localStorage.setItem(SUBMISSION_KEY, JSON.stringify(next));
    setSubmission(next);
    setError("");
    setPhase("result");
    trackSpeedrunCompleted({
      idea: next.idea,
      minutes: next.minutes,
      projectName: next.projectName,
      hasScreenshot: Boolean(next.screenshot),
      difficulty: settings.difficulty,
    });
  };

  const displayIdea = useMemo(() => currentIdea.text, [currentIdea.text]);
  const timerUrgent = seconds <= 60;
  const headerStatus = phase === "challenge" ? "LIVE RUN" : phase === "spinning" ? "GENERATING" : phase === "submit" ? "RUN COMPLETE" : phase === "result" ? "ARCHIVED" : "READY";

  return (
    <main className={`app-shell phase-${phase}`}>
      <header className="topbar">
        <div className="wordmark-group">
          <button className="wordmark" onClick={() => phase === "idle" ? undefined : setPhase("idle")} aria-label="Return to Startup Speedrun home">
            <span className="wordmark-mark">S/</span>
            <span>STARTUP SPEEDRUN</span>
          </button>
          <span className="header-attribution">Built by <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">foundedbymd <ExternalLink size={10} /></a></span>
        </div>
        <div className="topbar-meta">
          <span className={`status-dot ${phase === "challenge" ? "is-live" : ""}`} />
          <span>{headerStatus}</span>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings" title="Settings">
            <Settings2 size={16} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {phase === "idle" && (
        <section className="hero-section" aria-labelledby="main-heading">
          <div className="hero-index">01 <span>/</span> 01</div>
          <div className="hero-content">
            <p className="eyebrow">A timed startup challenge</p>
            <h1 id="main-heading" className="hero-title">STARTUP<br /><span>SPEEDRUN</span></h1>
            <p className="hero-subtitle">Get an idea. Build it. Beat the clock.</p>
            <div className="hero-actions">
              <button className="question-button" onClick={spin} aria-label="Spin for a startup challenge">?</button>
              <button className="settings-link" onClick={() => setSettingsOpen(true)}>
                <Settings2 size={14} strokeWidth={1.8} />
                Configure run
              </button>
            </div>
          </div>
          <p className="keyboard-hint"><kbd>SPACE</kbd> to spin</p>
        </section>
      )}

      {(phase === "spinning" || phase === "challenge") && (
        <section className={`run-section ${phase === "spinning" ? "is-spinning" : ""}`} aria-live="polite">
          <div className="run-header">
            <div className="run-context">
              <span className="eyebrow">{phase === "spinning" ? "Searching the database" : "Current challenge"}</span>
              <span className="run-difficulty">{DIFFICULTY_LABELS[settings.difficulty]} / {currentIdea.category}</span>
            </div>
            <button className={`run-timer ${timerUrgent && phase === "challenge" ? "is-urgent" : ""} ${!timerStarted ? "is-paused" : ""}`} onClick={() => startTimer()} aria-label={timerStarted ? "Timer running" : "Start timer"}>
              <span className="timer-caption">{timerStarted ? "TIME REMAINING" : "CLICK TO START"}</span>
              <span className="timer-numbers">{phase === "spinning" ? formatTime(settings.minutes * 60) : formatTime(seconds)}</span>
            </button>
          </div>

          <div className="challenge-frame">
            <div className="challenge-topline">
              <span className="challenge-label">{phase === "spinning" ? "CHOOSE YOUR FATE" : "YOUR CHALLENGE"}</span>
              <span className="challenge-counter">{phase === "spinning" ? String(spinTick % 99).padStart(2, "0") : "01"}</span>
            </div>
            <div className={`challenge-idea ${phase === "spinning" ? "is-cycling" : "is-revealed"}`} key={`${displayIdea}-${spinTick}`}>
              {displayIdea}
            </div>
            <div className="challenge-footer">
              <span>{phase === "spinning" ? "Loading a new direction" : "Your build starts now"}</span>
              {phase === "challenge" && (
                <button className="text-button" onClick={handleNewSpin}>New spin <ArrowUpRight size={15} /></button>
              )}
            </div>
          </div>

          {phase === "challenge" && !timerStarted && <p className="start-hint"><kbd>SPACE</kbd> or click the timer to begin</p>}
        </section>
      )}

      {phase === "submit" && (
        <section className="form-section" aria-labelledby="submit-heading">
          <div className="form-intro">
            <span className="eyebrow accent-eyebrow">TIME&apos;S UP</span>
            <h1 id="submit-heading">WHAT DID<br /><span>YOU BUILD?</span></h1>
            <p>{currentIdea.text}</p>
          </div>
          <form className="submission-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="project-name">Project name <span>*</span></label>
              <input id="project-name" value={form.projectName} onChange={(event) => setForm({ ...form, projectName: event.target.value })} placeholder="Name your build" autoComplete="off" />
            </div>
            <div className="form-field">
              <label htmlFor="project-url">Project URL <span>*</span></label>
              <input id="project-url" value={form.projectUrl} onChange={(event) => setForm({ ...form, projectUrl: event.target.value })} placeholder="https://your-build.com" inputMode="url" autoComplete="url" />
            </div>
            <div className="form-field form-field-wide">
              <label htmlFor="project-description">Short description</label>
              <textarea id="project-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What does it do?" rows={3} />
            </div>
            <div className="form-field form-field-wide file-field">
              <label htmlFor="project-screenshot">Screenshot <span className="optional">optional</span></label>
              <label className="file-drop" htmlFor="project-screenshot">
                <ExternalLink size={16} />
                <span>{form.screenshot ? "Screenshot attached" : "Attach an image"}</span>
                {form.screenshot && <Check size={16} className="file-check" />}
              </label>
              <input id="project-screenshot" type="file" accept="image/*" onChange={handleFile} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="button" className="back-button" onClick={() => setPhase("challenge")}><ChevronLeft size={16} /> Back to run</button>
              <button type="submit" className="submit-button">SUBMIT BUILD <ArrowUpRight size={19} /></button>
            </div>
          </form>
        </section>
      )}

      {phase === "result" && submission && (
        <section className="result-section" aria-labelledby="result-heading">
          <div className="result-heading-row">
            <div>
              <span className="eyebrow accent-eyebrow">SPEEDRUN COMPLETE</span>
              <h1 id="result-heading">NICE<br /><span>WORK.</span></h1>
            </div>
            <div className="result-check"><Check size={30} strokeWidth={1.5} /></div>
          </div>
          <div className="result-grid">
            <div className="result-card result-card-wide">
              <span className="card-label">THE CHALLENGE</span>
              <p>{submission.idea}</p>
            </div>
            <div className="result-card">
              <span className="card-label">TIME LIMIT</span>
              <p className="result-value">{formatTime(submission.minutes * 60)}</p>
            </div>
            <div className="result-card">
              <span className="card-label">PROJECT</span>
              <p className="result-value">{submission.projectName}</p>
              <a href={submission.projectUrl} target="_blank" rel="noreferrer" className="result-link">Open build <ExternalLink size={13} /></a>
            </div>
            <div className="result-card result-card-wide">
              <span className="card-label">DESCRIPTION</span>
              <p>{submission.description || "No description added."}</p>
            </div>
            {submission.screenshot && <div className="result-screenshot"><img src={submission.screenshot} alt={`Screenshot of ${submission.projectName}`} /></div>}
          </div>
          <button className="run-again-button" onClick={() => { setPhase("idle"); setSubmission(null); setForm({ projectName: "", projectUrl: "", description: "", screenshot: "" }); }}>RUN IT AGAIN <ArrowUpRight size={20} /></button>
        </section>
      )}

      <footer className="site-footer"><span>Local-first / v1</span></footer>

      {settingsOpen && (
        <div className="settings-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
          <div className="settings-panel">
            <div className="settings-header">
              <div><span className="eyebrow">Run configuration</span><h2 id="settings-heading">SETTINGS</h2></div>
              <button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={17} /></button>
            </div>
            <div className="settings-group">
              <div className="settings-label-row"><span>Challenge time</span><span className="settings-value">{settings.minutes} min</span></div>
              <div className="option-row time-options">
                {TIME_OPTIONS.map((minutes) => <button key={minutes} className={`option-button ${settings.minutes === minutes ? "is-selected" : ""}`} onClick={() => persistSettings({ ...settings, minutes })}>{minutes} min</button>)}
              </div>
            </div>
            <div className="settings-group">
              <div className="settings-label-row"><span>Sound</span><span className="settings-value">{settings.sound ? "On" : "Off"}</span></div>
              <div className="option-row two-options">
                <button className={`option-button ${settings.sound ? "is-selected" : ""}`} onClick={() => persistSettings({ ...settings, sound: true })}><Volume2 size={14} /> On</button>
                <button className={`option-button ${!settings.sound ? "is-selected" : ""}`} onClick={() => persistSettings({ ...settings, sound: false })}><VolumeX size={14} /> Off</button>
              </div>
            </div>
            <div className="settings-group">
              <div className="settings-label-row"><span>Difficulty</span><span className="settings-value">{DIFFICULTY_LABELS[settings.difficulty]}</span></div>
              <div className="option-row difficulty-options">
                {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((difficulty) => <button key={difficulty} className={`option-button ${settings.difficulty === difficulty ? "is-selected" : ""}`} onClick={() => persistSettings({ ...settings, difficulty })}>{DIFFICULTY_LABELS[difficulty]}</button>)}
              </div>
            </div>
            <div className="settings-note"><span className="status-dot" /> Preferences are saved on this device.</div>
          </div>
        </div>
      )}

      {abandonConfirmOpen && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="abandon-heading">
          <div className="confirm-panel">
            <span className="eyebrow">Active run</span>
            <h2 id="abandon-heading">ABANDON THIS<br /><span>CHALLENGE?</span></h2>
            <p>Your current timer and idea will be replaced by a new spin.</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setAbandonConfirmOpen(false)}>KEEP RUNNING</button>
              <button className="confirm-abandon" onClick={confirmAbandon}>SPIN AGAIN <ArrowUpRight size={17} /></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
