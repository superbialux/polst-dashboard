import { useNavigate } from "react-router-dom";
import { useSession } from "@/lib/session";
import { type AuthMode } from "@/lib/ui";
import { Modal } from "./Modal";
import { PolstSymbol } from "./PolstLogo";

const COPY: Record<AuthMode, { title: string; switch: string; action: string }> =
  {
    login: {
      title: "Sign in to create, follow, and save",
      switch: "New to Polst?",
      action: "Sign up",
    },
    signup: {
      title: "Join Polst and ask the world",
      switch: "Already have an account?",
      action: "Sign in",
    },
  };

/** Social sign-in dialog shared by Log In and Sign Up — same providers,
 *  different framing. Sign-up continues into onboarding; sign-in lands
 *  back where the user was. */
export function AuthModal({
  mode,
  onClose,
  onSwitch,
}: {
  mode: AuthMode | null;
  onClose: () => void;
  /** Jump between the Sign in / Sign up framings without closing. */
  onSwitch: (mode: AuthMode) => void;
}) {
  const active = mode ?? "login";
  const copy = COPY[active];
  const { signIn } = useSession();
  const navigate = useNavigate();

  const continueWith = () => {
    signIn();
    if (active === "signup") {
      navigate("/onboarding");
    } else {
      onClose();
    }
  };

  return (
    <Modal open={mode !== null} onClose={onClose} label={copy.title}>
      <div className="flex flex-col items-center px-6 pb-6 lg:px-8 lg:pb-8">
        <span className="grid h-16 w-16 place-items-center rounded-pill bg-accent-soft">
          <PolstSymbol className="h-8 dark:invert" />
        </span>

        <h2 className="mt-4 text-center font-display text-xl font-bold leading-7 text-text-primary">
          {copy.title}
        </h2>
        <p className="mt-1.5 max-w-80 text-center font-sans text-sm leading-5 text-text-secondary">
          Create polls, follow topics and creators, save favorites, and
          publish your own questions.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2.5">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.name}
              onClick={continueWith}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-btn-secondary-border bg-btn-secondary-bg font-display text-sm font-bold leading-5 text-btn-secondary-fg transition-colors hover:bg-btn-secondary-bg-hover"
            >
              <span aria-hidden className="grid w-5 place-items-center">
                {provider.glyph}
              </span>
              Continue with {provider.name}
            </button>
          ))}
        </div>

        <p className="mt-5 font-sans text-sm leading-5 text-text-secondary">
          {copy.switch}{" "}
          <button
            onClick={() => onSwitch(active === "login" ? "signup" : "login")}
            className="font-semibold text-text-accent hover:underline"
          >
            {copy.action}
          </button>
        </p>

        <p className="mt-4 text-center font-sans text-xs leading-4 text-text-secondary">
          By continuing you agree to our{" "}
          <a href="#" className="text-text-accent hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-text-accent hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </Modal>
  );
}

/* Brand marks inlined so the buttons don't depend on icon-font glyphs. */
const PROVIDERS = [
  {
    name: "Google",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3a7.17 7.17 0 0 1-10.8-3.77H1.27v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.26 14.32a7.22 7.22 0 0 1 0-4.63v-3.1H1.27a12.01 12.01 0 0 0 0 10.83l3.99-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.97 11.97 0 0 0 1.27 6.59l3.99 3.1A7.16 7.16 0 0 1 12 4.77Z"
        />
      </svg>
    ),
  },
  {
    name: "Apple",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-text-primary">
        <path d="M16.7 12.96c.03 3.2 2.81 4.27 2.84 4.28-.02.08-.44 1.52-1.46 3-.88 1.28-1.8 2.55-3.24 2.58-1.42.02-1.87-.84-3.49-.84-1.62 0-2.13.81-3.47.86-1.39.06-2.45-1.38-3.34-2.65-1.81-2.62-3.2-7.4-1.34-10.62a5.18 5.18 0 0 1 4.38-2.66c1.37-.03 2.65.92 3.49.92.84 0 2.4-1.14 4.05-.97.69.03 2.62.28 3.86 2.1-.1.06-2.31 1.35-2.28 4Zm-2.66-7.83c.74-.89 1.23-2.13 1.1-3.36-1.06.04-2.34.7-3.1 1.6-.68.78-1.28 2.04-1.12 3.25 1.18.09 2.39-.6 3.12-1.49Z" />
      </svg>
    ),
  },
  {
    name: "Microsoft",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]">
        <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
        <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
        <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
        <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
      </svg>
    ),
  },
  {
    name: "X/Twitter",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-text-primary">
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
      </svg>
    ),
  },
];
