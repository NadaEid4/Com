import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Register } from './register/register';
import { ReviewComponent } from './review/review';

export const routes: Routes = [
   { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: Landing },
  { path: 'register', component: Register },
   { path: 'review', component: ReviewComponent },
];
