import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { supabase } from '../supabase.client';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review.html',
  styleUrls: ['./review.css']
})
export class ReviewComponent {

  private router = inject(Router);

  data: any;
  sending = false;
  success = '';
  error = '';
  agreementChecked = false;

  constructor() {
    this.data = history.state;

    if (!this.data || Object.keys(this.data).length === 0) {
      this.router.navigate(['/register']);
    }
  }

 async confirmSubmit() {
  if (!this.agreementChecked) return;

  this.sending = true;

  try {
    // 1️⃣ Insert data into Supabase
    const { error } = await supabase
      .from('teams')
      .insert([{
        university: this.data.university,
        faculty: this.data.faculty,
        teamName: this.data.teamName,
        membersCount: this.data.membersCount,
        members: this.data.members || []
      }]);

    if (error) throw error;

    // 2️⃣ Show success popup **here** AFTER successful insert
    await Swal.fire({
      icon: 'success',
      title: 'Thank you!',
      text: 'Your registration has been submitted successfully.',
      confirmButtonText: 'OK'
    });

    // 3️⃣ Clear form data
    this.data = null;

    // 4️⃣ Navigate back to Register page
    this.router.navigate(['/register'], { state: {} });

  } catch (e: any) {
    console.error(e);
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to submit registration.'
    });
  } finally {
    this.sending = false;
  }
}


  backToForm() {
    this.router.navigate(['/register'], { state: this.data });
  }
}
