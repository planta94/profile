import { Routes } from '@angular/router';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { CvComponent } from './cv/cv.component';

export const routes: Routes = [
  { path: '', component: PortfolioComponent },
  { path: 'cv', component: CvComponent },
  { path: '**', redirectTo: '' },
];
