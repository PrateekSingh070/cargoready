import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui";

export class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="page-heading inner-page">
        <h1>Page unavailable</h1>
        <p>Reload CargoReady to try opening this page again.</p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </section>
    );
  }
}
