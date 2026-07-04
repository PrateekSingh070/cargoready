import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Link, type To } from "react-router-dom";
import { Icon } from "@/components/Icon";

type Variant = "primary" | "secondary" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & { variant?: Variant }
>(function Button(
  { variant = "primary", type = "button", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`button button--${variant} ${className}`}
      {...props}
    />
  );
});

export function ButtonLink({
  to,
  children,
  variant = "primary",
}: {
  to: To;
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <Link className={`button button--${variant}`} to={to}>
      {children}
    </Link>
  );
}

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`card ${className}`} {...props} />;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <progress
      className="progress-bar"
      value={value}
      max={max}
      aria-label={label}
    />
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div className={message ? "toast" : "sr-only"} role="status">
      {message}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);

  return (
    <dialog
      className="modal"
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="secondary"
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
