import { lazy, Suspense, useEffect, useRef } from "react";
import { MotionConfig } from "framer-motion";
import {
  Link,
  NavLink,
  Route,
  Routes,
  matchPath,
  useLocation,
} from "react-router-dom";
import { Icon } from "@/components/Icon";
import { RouteErrorBoundary } from "@/app/RouteErrorBoundary";
import { ButtonLink } from "@/components/ui";
import HomePage from "@/features/course/HomePage";
import { LevelUpCelebration } from "@/features/gamification/LevelUpCelebration";
import { useSettings } from "@/store/settings";

const CoursePage = lazy(() => import("@/features/course/CoursePage"));
const LessonPage = lazy(() => import("@/features/lesson-player/LessonPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const TrainerPage = lazy(
  () => import("@/features/trainer-dashboard/TrainerPage"),
);
const lessonRoute = "/course/:moduleId/lessons/:lessonId";

export function App() {
  const preferences = useSettings((state) => state.preferences);
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.textSize = preferences.textSize;
    root.dataset.reduceMotion = String(preferences.reducedMotion);
  }, [preferences]);

  useEffect(() => {
    const title = {
      "/": "CargoReady",
      "/course": "Course · CargoReady",
      "/settings": "Settings · CargoReady",
      "/trainer": "Trainer · CargoReady",
    };
    document.title =
      title[pathname as keyof typeof title] ??
      (matchPath(lessonRoute, pathname)
        ? "Lesson · CargoReady"
        : "Page not found · CargoReady");
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0);
      main.current?.focus();
      previousPath.current = pathname;
    }
  }, [pathname]);

  return (
    <MotionConfig reducedMotion={preferences.reducedMotion ? "always" : "user"}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="frame header-content">
          <Link className="brand" to="/" aria-label="CargoReady home">
            <span className="brand-mark">
              <Icon name="plane" />
            </span>
            <span>
              Cargo<span className="brand-accent">Ready</span>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/course">
              <Icon name="route" /> Course
            </NavLink>
            <NavLink to="/trainer">Trainer</NavLink>
            <NavLink to="/settings">
              <Icon name="settings" /> Settings
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="frame main-content" id="main" ref={main} tabIndex={-1}>
        <RouteErrorBoundary key={pathname}>
          <Suspense fallback={<p role="status">Loading page…</p>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/course" element={<CoursePage />} />
              <Route path={lessonRoute} element={<LessonPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/trainer" element={<TrainerPage />} />
              <Route
                path="*"
                element={
                  <section className="page-heading">
                    <h1>Page not found</h1>
                    <p>Head back to the CargoReady home page.</p>
                    <ButtonLink to="/">
                      Back to home <Icon name="arrow" />
                    </ButtonLink>
                  </section>
                }
              />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <footer className="site-footer">
        <div className="frame footer-content">
          <span className="footer-brand">CargoReady</span>
          <span>
            <Icon name="info" /> Educational demo only. No training
            certification is provided.
          </span>
        </div>
      </footer>
      <LevelUpCelebration />
    </MotionConfig>
  );
}
