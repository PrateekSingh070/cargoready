import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button, ButtonLink, Modal } from "@/components/ui";
import { useProfile } from "@/store/profile";

const tour = [
  {
    title: "Follow the journey",
    description:
      "Complete a module to unlock the next stop. Your place is saved on this device.",
  },
  {
    title: "Learn by doing",
    description:
      "Read a field guide, make choices in a scenario, sort cargo, or check what you know in a quiz.",
  },
  {
    title: "Build your rewards",
    description:
      "Earn XP and badges as you train. Find your level and streak below the journey map.",
  },
];

export function StartTraining() {
  const name = useProfile((state) => state.name);
  const setName = useProfile((state) => state.setName);
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const [displayName, setDisplayName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const tourHeading = useRef<HTMLHeadingElement>(null);
  const page = tour[step - 1];

  useEffect(() => {
    if (step === 0) input.current?.focus();
    if (step > 0) tourHeading.current?.focus();
  }, [step]);

  function start() {
    setName(displayName);
    setStep(-1);
    navigate("/course");
  }

  if (name && step < 0)
    return (
      <ButtonLink to="/course">
        Start training <Icon name="arrow" />
      </ButtonLink>
    );

  return (
    <>
      <Button onClick={() => setStep(0)}>
        Start training <Icon name="arrow" />
      </Button>
      {createPortal(
        <Modal
          open={step >= 0}
          title={step === 0 ? "Welcome to CargoReady" : "Quick tour"}
          onClose={() => setStep(-1)}
        >
          {step === 0 && (
            <form
              className="training-onboarding"
              onSubmit={(event) => {
                event.preventDefault();
                setStep(1);
              }}
            >
              <label>
                Display name <span>(optional)</span>
                <input
                  ref={input}
                  value={displayName}
                  maxLength={48}
                  autoComplete="nickname"
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
              <p>
                Your name stays on this device and appears in the trainer
                dashboard.
              </p>
              <div className="modal-actions">
                <Button variant="secondary" onClick={start}>
                  Skip tour
                </Button>
                <Button type="submit">See quick tour</Button>
              </div>
            </form>
          )}
          {page && (
            <div className="training-onboarding">
              <p>
                Step {step} of {tour.length}
              </p>
              <h3 ref={tourHeading} tabIndex={-1}>
                {page.title}
              </h3>
              <p>{page.description}</p>
              <div className="modal-actions">
                {step > 1 && (
                  <Button variant="secondary" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button variant="secondary" onClick={start}>
                  Skip tour
                </Button>
                {step < tour.length ? (
                  <Button onClick={() => setStep(step + 1)}>Next</Button>
                ) : (
                  <Button onClick={start}>Open course</Button>
                )}
              </div>
            </div>
          )}
        </Modal>,
        document.body,
      )}
    </>
  );
}
