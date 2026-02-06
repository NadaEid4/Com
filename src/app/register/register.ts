import { Component, ViewChildren, QueryList, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { supabase } from '../supabase.client';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register implements AfterViewInit, OnInit {
  @ViewChildren('memberCard') memberCards!: QueryList<ElementRef>;

  form: FormGroup;
  sending = false;
  success = '';
  error = '';
  draftToken: string | null = null;

  governorates: string[] = [
    'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum',
    'Gharbia', 'Ismailia', 'Menofia', 'Minya', 'Qalyubia', 'New Valley',
    'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said', 'Damietta',
    'Sharkia', 'South Sinai', 'Kafr El Sheikh', 'Matrouh', 'Luxor',
    'Qena', 'North Sinai', 'Sohag'
  ];
graduationYears: number[] = [2025, 2026, 2027];
genders: string[] = ['Male', 'Female'];

 
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      university: ['', Validators.required],
      faculty: ['', Validators.required],
      teamName: ['', Validators.required],
      membersCount: [null, [Validators.required, Validators.min(1)]],
      projectTitle: ['', Validators.required],
      projectDescription: ['', Validators.required],
      supervisorName: ['', Validators.required],
      supervisorEmail: ['', [Validators.required, Validators.email]],
     governorate: ['', Validators.required],
      members: this.fb.array([])
    },
    {
      validators: this.membersValidator.bind(this) // <-- Add the custom validator here
    });
  }


ngOnInit(): void {
  const draftToken = this.route.snapshot.queryParamMap.get('draft');
  const stateData = history.state?.draftData;

  if (draftToken) {
    this.loadDraft(draftToken);
  } else if (stateData) {
    console.log('Loading data from review:', stateData);
    this.form.patchValue(stateData);
    this.members.clear();
    stateData.members?.forEach((m: any) => this.members.push(this.createMember(m)));
  }
}


  ngAfterViewInit(): void {}

  /** FormArray getter */
  get members(): FormArray {
    return this.form.get('members') as FormArray;
  }
addMemberIfNeeded() {
  const membersCount = this.form.get('membersCount')?.value || 0;
  while (this.members.length < membersCount) {
    this.addMember();
  }
}

  /** Create a single member FormGroup */
  createMember(data: any = null): FormGroup {
    return this.fb.group({
      fullNameEn: [data?.fullNameEn || '', Validators.required],
      fullNameAr: [data?.fullNameAr || '', Validators.required],
      email: [data?.email || '', [Validators.required, Validators.email]],
      phone: [data?.phone || '', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      department: [data?.department || '', Validators.required],
      graduationYear: [data?.graduationYear || '', Validators.required],
      gender: [data?.gender || '', Validators.required],
      governorate: [data?.governorate || '', Validators.required],
      nationalId: [data?.nationalId || '', [Validators.required, Validators.pattern('^[23][0-9]{13}$')]]
    });
  }

  /** Add new member */
  addMember(): void {
    this.members.push(this.createMember());
    setTimeout(() => {
      const last = this.memberCards.last;
      last?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /** Remove member by index */
  removeMember(i: number): void {
    this.members.removeAt(i);
  }

  /** Mark all controls as touched recursively */
  markAllAsTouched(control: AbstractControl): void {
    if (control instanceof FormControl) control.markAsTouched();
    else if (control instanceof FormGroup)
      Object.values(control.controls).forEach(c => this.markAllAsTouched(c));
    else if (control instanceof FormArray)
      control.controls.forEach(c => this.markAllAsTouched(c));
  }

  /** Save form as draft */
  async saveDraft(): Promise<void> {
    this.markAllAsTouched(this.form);

    if (this.form.invalid) {
      await Swal.fire('Incomplete', 'Please fill all required fields before saving.', 'warning');
      return;
    }

    try {
      const token = this.draftToken || uuidv4();
      const { error } = await supabase
        .from('drafts')
        .upsert([{ token, data: this.form.value, created_at: new Date(), submitted: false }]);

      if (error) throw error;
      this.draftToken = token;

      await Swal.fire({
        icon: 'success',
        title: 'Draft Saved',
        html: `You can continue editing using this link:<br>
               <a href="${window.location.origin}/edit/${token}" target="_blank">${window.location.origin}/edit/${token}</a>
               <br>Link expires in 3 days.`,
        confirmButtonText: 'OK'
      });

    } catch (e: any) {
      console.error(e);
      await Swal.fire('Error', 'Failed to save draft.', 'error');
    }
  }



  /** Submit the registration */
  async submitDraft(): Promise<void> {
    this.markAllAsTouched(this.form);

    if (this.form.invalid) {
      await Swal.fire('Incomplete', 'Fill all required fields.', 'warning');
      return;
    }

    try {
      this.sending = true;

      const { error } = await supabase
        .from('teams')
        .insert([this.form.value]);

      if (error) throw error;

      // Mark draft as submitted
      if (this.draftToken) {
        await supabase
          .from('drafts')
          .update({ submitted: true })
          .eq('token', this.draftToken);
      }

      await Swal.fire('Submitted', 'Your registration is complete!', 'success');

      this.form.reset();
      this.members.clear();
      this.draftToken = null;

    } catch (e: any) {
      console.error(e);
      await Swal.fire('Error', 'Failed to submit.', 'error');
    } finally {
      this.sending = false;
    }
  }

/** Custom validator for members */
membersValidator(form: FormGroup) {
  const membersCount = form.get('membersCount')?.value;
  const members = form.get('members') as FormArray;

  // Check if number of members matches count
  if (membersCount > 0 && members.length < membersCount) {
    return { membersMissing: true };
  }

  // Check if any member FormGroup is invalid
  for (let i = 0; i < members.length; i++) {
    if (members.at(i).invalid) {
      return { memberInvalid: true }; // <-- new error key
    }
  }

  return null; // valid
}

goToReview() {
  this.markAllAsTouched(this.form);
  this.addMemberIfNeeded();

  if (this.form.invalid) {
    let msg = 'Please fill all required fields.';
    
    if (this.form.errors?.['membersMissing']) {
      msg = `You have ${this.form.get('membersCount')?.value} team member(s), but added only ${this.members.length}.`;
    } else if (this.form.errors?.['memberInvalid']) {
      msg = 'Some team member fields are incomplete or invalid.';
    }

    Swal.fire('Incomplete', msg, 'warning');
    return;
  }

  // Navigate to review component with form data
  this.router.navigate(['/review'], { state: { data: this.form.value } });
}

async loadDraft(token: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) throw new Error('Draft not found');

    this.draftToken = token;

    // Patch basic form fields
    const { members, ...rest } = data.data;
    this.form.patchValue(rest);

    // Clear existing members and populate new ones
    this.members.clear();
    members?.forEach((m: any) => this.members.push(this.createMember(m)));

  // ✅ Print form data to console
  console.log('Form Data Before Review:', this.form.value);
    await Swal.fire('Draft Loaded', 'You can continue editing your draft.', 'success');
  }catch (e: any) {
    console.error(e);
    await Swal.fire('Error', e.message || 'Failed to load draft', 'error');
    this.router.navigate(['/register']);
  }
}





}
