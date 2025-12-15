import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  form: FormGroup;
  sending = false;
  success = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private router: Router   // ✅ FIXED
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
    this.form.patchValue({
      university: savedData.university,
      faculty: savedData.faculty,
      teamName: savedData.teamName,
      membersCount: savedData.membersCount,
      projectEn: savedData.projectEn,
      projectAr: savedData.projectAr,
      supervisorName: savedData.supervisorName,
      supervisorEmail: savedData.supervisorEmail,
      supervisorPhone: savedData.supervisorPhone,
      benefits: savedData.benefits
    });

    // ⭐ Rebuild member forms
    this.members.clear();
    savedData.members?.forEach((m: any) => {
      this.members.push(
        this.fb.group({
          fullNameEn: [m.fullNameEn],
          fullNameAr: [m.fullNameAr],
          email: [m.email],
          phone: [m.phone],
          department: [m.department],
          graduationYear: [m.graduationYear],
          gender: [m.gender],
          governorate: [m.governorate],
          nationalId: [m.nationalId]
        })
      );
    });
  }
}

markAllAsTouched(formGroup: FormGroup | FormArray) {
  if (formGroup instanceof FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (!control) return;

      if (control instanceof FormControl) {
        control.markAsTouched();
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.markAllAsTouched(control);
      }
    });
  } else if (formGroup instanceof FormArray) {
    formGroup.controls.forEach(control => {
      if (control instanceof FormControl) {
        control.markAsTouched();
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.markAllAsTouched(control);
      }
    });
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

  // Invalid form
  if (this.form.invalid) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Information',
      text: 'Please fill in all required fields before reviewing your data.',
      confirmButtonText: 'OK'
    });
    return;
  }

  // SAFE conversion (no NaN)
  const requiredMembers = parseInt(this.form.get('membersCount')?.value || '0', 10);
  const addedMembers = this.members.length;

  if (requiredMembers !== addedMembers) {
    Swal.fire({
      icon: 'error',
      title: 'Members Missing',
      text: `You selected ${requiredMembers} member(s), but only added ${addedMembers}.`,
      confirmButtonText: 'OK'
    });
    return;
  }

  this.router.navigate(['/review'], { state: this.form.value });
}



  async submit() {
    if (this.form.invalid) return;

    this.sending = true;

    try {
      await addDoc(collection(this.firestore, 'registrations'), this.form.value);

      this.success = 'Registered successfully!';
      this.form.reset();
      this.members.clear();

    } catch (e) {
      this.error = 'Error saving data!';
    }

    this.sending = false;
  }
}
