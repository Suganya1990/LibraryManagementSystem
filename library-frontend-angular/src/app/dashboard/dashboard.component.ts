import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserService, LoanRecord, User } from '../user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  showAccountForm = false;
  accountForm: FormGroup;
  loanHistory: LoanRecord[] = [];

  displayedColumns = ['title', 'borrowed', 'returned'];

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.accountForm = this.fb.group({
      name: '',
      email: ''
    });
  }

  ngOnInit(): void {
    this.userService.user$.subscribe(user => this.accountForm.setValue(user));
    this.loanHistory = this.userService.getLoanHistory();
  }

  toggleAccountForm(): void {
    this.showAccountForm = !this.showAccountForm;
  }

  save(): void {
    const user: User = this.accountForm.value;
    this.userService.updateUser(user);
    this.showAccountForm = false;
  }
}
