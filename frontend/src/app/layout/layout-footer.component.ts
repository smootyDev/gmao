import { Component } from '@angular/core';

@Component({
  selector: 'app-layout-footer',
  standalone: true,
  templateUrl: './layout-footer.component.html'
})
export class LayoutFooterComponent {
  readonly year = new Date().getFullYear();
}
