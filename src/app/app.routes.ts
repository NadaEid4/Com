import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Register } from './register/register';
import { ReviewComponent } from './review/review';


export const routes: Routes = [
  { path: '', component: Landing, title: 'Home | Egypt Semiconductors Challenge' },
  { path: 'register', component: Register, title: 'Register | Egypt Semiconductors Challenge' },
  { path: 'review', component: ReviewComponent, title: 'Review | Egypt Semiconductors Challenge' },
  { path: '**', redirectTo: '' }
];

