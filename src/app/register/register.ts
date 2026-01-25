import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { supabase } from '../supabase.client'; // ✅ Import Supabase client

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  form: FormGroup;
  sending = false;
  success = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      university: ['', Validators.required],
      faculty: ['', Validators.required],
      teamName: ['', Validators.required],
      membersCount: [null, [Validators.required, Validators.min(1)]],
      members: this.fb.array([])
    });
  }

  get members() {
    return this.form.get('members') as FormArray;
  }

  ngOnInit() {
    const savedData = history.state;
    if (savedData && Object.keys(savedData).length > 0 && savedData.university) {
      this.form.patchValue(savedData);
      this.members.clear();
      savedData.members?.forEach((m: any) => {
        this.members.push(this.fb.group({
          fullNameEn: [m.fullNameEn],
          fullNameAr: [m.fullNameAr],
          email: [m.email],
          phone: [m.phone],
          department: [m.department],
          graduationYear: [m.graduationYear],
          gender: [m.gender],
          governorate: [m.governorate],
          nationalId: [m.nationalId]
        }));
      });
    }
      if (!savedData || Object.keys(savedData).length === 0) {
    // Reset form if no data
    this.form.reset();
    this.members.clear();
    return;
  }
  }
markAllAsTouched(control: AbstractControl): void {
  if (control instanceof FormControl) {
    control.markAsTouched();
  } else if (control instanceof FormGroup) {
    Object.values(control.controls).forEach(c => this.markAllAsTouched(c));
  } else if (control instanceof FormArray) {
    control.controls.forEach(c => this.markAllAsTouched(c));
  }
}


  createMember(): FormGroup {
    return this.fb.group({
      fullNameEn: ['', Validators.required],
      fullNameAr: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      department: ['', Validators.required],
      graduationYear: ['', Validators.required],
      gender: ['', Validators.required],
      governorate: ['', Validators.required],
      nationalId: ['', [Validators.required, Validators.pattern('^[23][0-9]{13}$')]]
    });
  }

  addMember() {
    this.members.push(this.createMember());
  }

  removeMember(i: number) {
    this.members.removeAt(i);
  }

  goToReview() {
    this.markAllAsTouched(this.form);
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill all required fields.', confirmButtonText: 'OK' });
      return;
    }
    const requiredMembers = parseInt(this.form.get('membersCount')?.value || '0', 10);
    const addedMembers = this.members.length;
    if (requiredMembers !== addedMembers) {
      Swal.fire({ icon: 'error', title: 'Members Missing', text: `You selected ${requiredMembers}, but added ${addedMembers}.`, confirmButtonText: 'OK' });
      return;
    }
    this.router.navigate(['/review'], { state: this.form.value });
  }

  async submit() {
    if (this.form.invalid) return;
    this.sending = true;

    try {
      // ⭐ Supabase Insert
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          university: this.form.value.university,
          faculty: this.form.value.faculty,
          teamName: this.form.value.teamName,
          membersCount: this.form.value.membersCount,
          members: this.form.value.members // stored as JSON array
        }]);

      if (error) throw error;

      this.success = 'Registered successfully!';
      this.form.reset();
      this.members.clear();

    } catch (e: any) {
      console.error(e);
      this.error = 'Error saving data!';
    }

    this.sending = false;
  }
}
