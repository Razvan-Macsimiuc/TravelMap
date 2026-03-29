import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';

// Inline splash guard to avoid import issues
const splashGuard: CanActivateFn = (): boolean => {
  const router = inject(Router);
  const hasSeenSplash = sessionStorage.getItem('hopahopa_splash_shown') === 'true';

  if (!hasSeenSplash) {
    router.navigate(['/splash'], { replaceUrl: true });
    return false;
  }

  return true;
};

export const routes: Routes = [
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash.page').then(m => m.SplashPage),
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage),
  },
  {
    path: '',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [splashGuard],
    children: [
      {
        path: 'map',
        loadComponent: () => import('./map/map.page').then(m => m.MapPage)
      },
      {
        path: 'stats',
        loadComponent: () => import('./stats/stats.page').then(m => m.StatsPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: 'country/:code',
        loadComponent: () => import('./country-detail/country-detail.page').then(m => m.CountryDetailPage)
      },
      {
        path: '',
        redirectTo: 'map',
        pathMatch: 'full'
      }
    ]
  },
];
