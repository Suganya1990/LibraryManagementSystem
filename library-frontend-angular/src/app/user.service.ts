import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  name: string;
  email: string;
}

export interface LoanRecord {
  title: string;
  borrowed: Date;
  returned: Date | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private userSubject = new BehaviorSubject<User>({ name: 'Jane Doe', email: 'jane@example.com' });
  user$ = this.userSubject.asObservable();

  private loans: LoanRecord[] = [
    { title: 'Moby Dick', borrowed: new Date('2024-01-10'), returned: new Date('2024-02-10') },
    { title: '1984', borrowed: new Date('2024-03-05'), returned: null }
  ];

  getLoanHistory(): LoanRecord[] {
    return this.loans;
  }

  updateUser(user: User): void {
    this.userSubject.next(user);
  }
}
