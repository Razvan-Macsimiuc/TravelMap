import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Guard to redirect to welcome page on first launch.
 * If user hasn't seen the welcome screen, redirect them there.
 */
export const welcomeGuard: CanActivateFn = () => {
  const router = inject(Router);
  const hasSeenWelcome = localStorage.getItem('hopahopa_welcome_seen') === 'true';

  if (!hasSeenWelcome) {
    router.navigate(['/welcome'], { replaceUrl: true });
    return false;
  }

  return true;
};

/**
 * Guard to prevent accessing welcome page if already seen.
 * Redirects to map if user has already completed onboarding.
 */
export const welcomeSeenGuard: CanActivateFn = () => {
  const router = inject(Router);
  const hasSeenWelcome = localStorage.getItem('hopahopa_welcome_seen') === 'true';

  if (hasSeenWelcome) {
    router.navigate(['/map'], { replaceUrl: true });
    return false;
  }

  return true;
};



