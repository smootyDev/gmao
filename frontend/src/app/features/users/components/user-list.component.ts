import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DropdownColumnFilterComponent } from '../../../core/components/dropdown-column-filter/dropdown-column-filter.component';
import { TextColumnFilterComponent } from '../../../core/components/text-column-filter/text-column-filter.component';
import { USER_ROLE_OPTIONS } from '../../../core/constants/select-options';
import { User, UserService } from '../services/user.service';
import { SyncService } from '../../../core/services/sync.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TableModule, TagModule, InputTextModule, TranslatePipe, DropdownColumnFilterComponent, TextColumnFilterComponent],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit, OnDestroy {
  users = signal<User[]>([]); loading = signal(true);
  roleOptions = USER_ROLE_OPTIONS;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly userService: UserService,
    private readonly syncService: SyncService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscriptions.push(
      this.syncService.syncCompleted.subscribe(() => this.loadData())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  loadData(): void { this.loading.set(true); this.userService.list().subscribe({ next: (users) => { this.users.set(users); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  delete(id: number): void { if (confirm('¿Eliminar este usuario?')) this.userService.delete(id).subscribe({ next: () => this.loadData(), error: () => alert('No se puede eliminar el usuario') }); }
  roleLabel(role: string): string {
    return `USERS.ROLE_${role}`;
  }
}
