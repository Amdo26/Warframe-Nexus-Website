import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl tracking-[0.12em] text-fg">Signal lost</h1>
      <p className="mt-2 text-muted">That channel does not exist in this sector.</p>
      <a href="/" className="mt-6 inline-block font-display text-sm uppercase tracking-[0.16em] text-accent">
        Return to Command
      </a>
    </div>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  });
}
