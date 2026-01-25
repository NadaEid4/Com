import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { supabase } from '../supabase.client';

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
      // Insert into Supabase 'teams'
      const { error } = await supabase
        .from('teams')
        .insert([{
          university: this.data.university,
          faculty: this.data.faculty,
          teamName: this.data.teamName,
          membersCount: this.data.membersCount,
          projectEn: this.data.projectEn || null,
          projectAr: this.data.projectAr || null,
          supervisorName: this.data.supervisorName || null,
          supervisorEmail: this.data.supervisorEmail || null,
          supervisorPhone: this.data.supervisorPhone || null,
          benefits: this.data.benefits || null,
          members: this.data.members || []
        }]);

      if (error) throw error;

      // ✅ Success popup
      await Swal.fire({
        icon: 'success',
        title: 'Thank you!',
        text: 'Your registration has been submitted successfully.',
        confirmButtonText: 'OK'
      });

      // Clear data
      this.data = null;

      // Navigate back to Register page
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
