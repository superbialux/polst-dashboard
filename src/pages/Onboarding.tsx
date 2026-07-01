import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field, FieldHelper, Select, TextInput } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { MultiPoll } from "@/components/MultiPoll";
import { PolstWordmark } from "@/components/PolstLogo";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useToast } from "@/components/Toast";
import { INTEREST_STEPS } from "@/lib/data";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "First, tell us the basics",
    subtitle: "Add your username and gender. You can change these later.",
  },
  {
    title: "Set your location",
    subtitle: "Add your city and state to personalize prompts.",
  },
  {
    title: "Select your interests",
    subtitle: "Pick 5 favorites so we can personalize your feed.",
  },
];

/** Post-signup setup: basics → location → interests. The interests step
 *  runs the product's actual multi-step poll UI, so finishing onboarding
 *  doubles as learning how Polst works. */
export function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);

  // Step 1
  const [username, setUsername] = useState("max.polst");
  const [gender, setGender] = useState("male");
  // Step 3 — answered count reported by the MultiPoll
  const [picked, setPicked] = useState(0);

  const usernameState =
    username.trim() === ""
      ? null
      : username.trim().length < 3
        ? ("short" as const)
        : username.trim().toLowerCase() === "taken"
          ? ("taken" as const)
          : ("available" as const);

  const canContinue =
    step === 0
      ? usernameState === "available"
      : step === 1
        ? true
        : picked === INTEREST_STEPS.length;

  const finish = () => {
    toast("You're all set — welcome to Polst");
    navigate("/");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-page-feed">
      {/* Minimal chrome: wordmark + tagline, nothing to wander off to. */}
      <header className="flex h-16 w-full shrink-0 items-center justify-center gap-4 border-b border-border-default bg-surface-raised">
        <Link to="/" aria-label="Polst home" className="inline-flex">
          <PolstWordmark className="h-[30px] w-auto dark:invert" />
        </Link>
        <span aria-hidden className="h-6 w-px bg-border-default" />
        <p className="font-display text-sm font-medium leading-5 text-text-primary">
          Ask the world.
        </p>
      </header>

      <main className="flex w-full flex-1 flex-col items-center px-4 pb-12 pt-10 lg:pt-16">
        <h1 className="text-center font-display text-xl font-bold leading-7 text-text-primary lg:text-2xl lg:leading-8">
          {STEPS[step].title}
        </h1>
        <p className="mt-1.5 text-center font-sans text-sm leading-5 text-text-secondary lg:text-base lg:leading-6">
          {STEPS[step].subtitle}
        </p>

        {/* Step progress — three segments, filled through the current step. */}
        <div
          className="mt-5 flex items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        >
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 w-16 rounded-pill transition-colors",
                i <= step ? "bg-accent-default" : "bg-border-strong",
              )}
            />
          ))}
        </div>

        <div className="mt-8 flex w-full max-w-lg flex-col overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm">
          <div className="flex flex-col gap-4 px-5 py-5 lg:px-6 lg:py-6">
            {step === 0 && (
              <>
                <Field
                  label="Username"
                  helper={
                    usernameState === "available" ? (
                      <FieldHelper tone="success">
                        Username is available
                      </FieldHelper>
                    ) : usernameState === "taken" ? (
                      <FieldHelper tone="danger">
                        That username is taken — try another
                      </FieldHelper>
                    ) : usernameState === "short" ? (
                      <FieldHelper tone="neutral">
                        At least 3 characters
                      </FieldHelper>
                    ) : undefined
                  }
                >
                  {(id) => (
                    <TextInput
                      id={id}
                      icon="alternate_email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your.username"
                      autoComplete="username"
                    />
                  )}
                </Field>

                <Field label="Date of Birth">
                  {(id) => (
                    <TextInput
                      id={id}
                      icon="calendar_today"
                      defaultValue="5/20/1986"
                      placeholder="MM/DD/YYYY"
                    />
                  )}
                </Field>

                <Field label="Gender">
                  {() => (
                    <SegmentedControl
                      label="Gender"
                      value={gender}
                      onChange={setGender}
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "na", label: "Prefer not to say" },
                      ]}
                    />
                  )}
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="City">
                  {(id) => (
                    <TextInput id={id} placeholder="Enter your city" />
                  )}
                </Field>
                <Field label="State">
                  {(id) => (
                    <Select id={id} defaultValue="">
                      <option value="" disabled>
                        Select your state
                      </option>
                      {["Illinois", "California", "New York", "Texas"].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </Select>
                  )}
                </Field>
                <Field label="Country">
                  {(id) => (
                    <Select id={id} defaultValue="">
                      <option value="" disabled>
                        Select your country
                      </option>
                      {["United States", "Canada", "United Kingdom"].map(
                        (c) => (
                          <option key={c}>{c}</option>
                        ),
                      )}
                    </Select>
                  )}
                </Field>
              </>
            )}

            {step === 2 && (
              // The real multi-step poll component, just in a tighter
              // container — each pick counts up the community's shares,
              // teaching the product's core mechanic.
              <MultiPoll
                steps={INTEREST_STEPS}
                onProgress={setPicked}
                bleed="-mx-5 lg:-mx-6"
                pad="px-5 lg:px-6"
                counterLabel={(answered, total) =>
                  answered === total
                    ? "All 5 picked — you're set"
                    : `${answered} of ${total} picked`
                }
                finalSlide={() => (
                  // Shaped like a question slide (title slot + the option
                  // pair's aspect tile) so the card height holds steady.
                  <div className="flex flex-col">
                    <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
                      Great picks!
                    </h2>
                    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-md bg-option-bg px-6 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-pill bg-accent-soft">
                        <Icon
                          name="check_circle"
                          size={26}
                          filled
                          className="text-text-accent"
                        />
                      </span>
                      <p className="max-w-72 font-sans text-sm leading-5 text-text-secondary">
                        Your feed is ready — that's exactly how voting works
                        out there. Finish up to start.
                      </p>
                    </div>
                  </div>
                )}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border-default px-5 py-3.5 lg:px-6">
            <button
              onClick={finish}
              className="font-display text-sm font-bold leading-5 text-text-primary hover:underline"
            >
              Set up later
            </button>
            <button
              onClick={() =>
                step < STEPS.length - 1 ? setStep(step + 1) : finish()
              }
              disabled={!canContinue}
              className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step < STEPS.length - 1 ? "Continue" : "Finish"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

