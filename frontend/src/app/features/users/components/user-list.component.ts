import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DropdownColumnFilterComponent } from '../../../core/components/dropdown-column-filter/dropdown-column-filter.component';
import { USER_ROLE_OPTIONS } from '../../../core/constants/select-options';
import { User, UserService } from '../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TableModule, TagModule, InputTextModule, TranslatePipe, DropdownColumnFilterComponent],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users = signal<User[]>([]); loading = signal(true);
  roleOptions = USER_ROLE_OPTIONS;
  constructor(private readonly userService: UserService) {}
  ngOnInit(): void { this.loadData(); }
  loadData(): void { this.loading.set(true); this.userService.list().subscribe({ next: (users) => { this.users.set(users); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  delete(id: number): void { if (confirm('¿Eliminar este usuario?')) this.userService.delete(id).subscribe({ next: () => this.loadData(), error: () => alert('No se puede eliminar el usuario') }); }
}
