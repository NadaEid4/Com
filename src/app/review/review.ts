import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './review.html',
  styleUrl: './review.css'
})
export class ReviewComponent {

  data: any;
  sending = false;
  success = '';
  error = '';

  constructor(private firestore: Firestore, private router: Router) {
    this.data = history.state; // GET DATA SENT FROM REGISTER FORM
    if (!this.data || Object.keys(this.data).length === 0) {
      this.router.navigate(['/register']);
    }
  }
  agreementChecked = false;


  async confirmSubmit() {
    this.sending = true;
    this.error = '';
    try {
      await addDoc(collection(this.firestore, 'registrations'), this.data);
      this.success = 'Registration Submitted Successfully!';
    } catch (err) {
      this.error = 'Error submitting data.';
    }
    this.sending = false;
  }

  backToForm() {
    this.router.navigate(['/register'], { state: this.data });
  }
}
