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

  draftLink: string | null = null; // <-- for temporary draft link

constructor() {
  // unwrap the data
  this.data = history.state?.data;

  if (!this.data || Object.keys(this.data).length === 0) {
    this.router.navigate(['/register']);
  }

  console.log('Review data:', this.data); // debug
}


  async confirmSubmit() {
    if (!this.agreementChecked) return;

    this.sending = true;

    try {
      // Insert data into Supabase
      const { error } = await supabase
        .from('teams')
        .insert([{
          university: this.data.university,
          faculty: this.data.faculty,
          teamName: this.data.teamName,
          membersCount: this.data.membersCount,
          members: this.data.members || [],
          projectTitle: this.data.projectTitle,
          projectDescription: this.data.projectDescription,
          supervisorName: this.data.supervisorName,
          supervisorEmail: this.data.supervisorEmail,
          Governorate: this.data.Governorate,
          submitted: true // mark as submitted
        }]);

      if (error) throw error;

      // Remove draft if exists
      if (this.data.draftToken) {
        await supabase
          .from('drafts')
          .delete()
          .eq('token', this.data.draftToken);
      }

      // Success message
      await Swal.fire({
        icon: 'success',
        title: 'Thank you!',
        text: 'Your registration has been submitted successfully.',
        confirmButtonText: 'OK'
      });

      this.data = null;
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
  // Pass the form data back so Register can patch it
  this.router.navigate(['/register'], { state: { draftData: this.data } });
}


  async saveAsDraft() {
    // Generate token
    const token = crypto.randomUUID(); // modern way without uuid library
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 3); // 3 days expiry

    try {
      // Save draft to Supabase
      const { error } = await supabase
        .from('drafts')
        .upsert([{
          token,
          data: this.data,
          expiresAt: expireDate.toISOString()
        }]);

      if (error) throw error;

      // Show temporary link
      const baseUrl = window.location.origin;
      this.draftLink = `${baseUrl}/register?draft=${token}`;

      Swal.fire({
        icon: 'info',
        title: 'Draft Saved!',
        html: `You can continue later using this link:<br><a href="${this.draftLink}" target="_blank">${this.draftLink}</a><br>This link expires in 3 days.`,
        confirmButtonText: 'OK'
      });

    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save draft.'
      });
    }
  }
}
