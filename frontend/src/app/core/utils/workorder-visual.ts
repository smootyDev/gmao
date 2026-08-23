export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export function workOrderStatusSeverity(status: string | undefined): TagSeverity {
  switch (status) {
    case 'OPEN': return 'info';
    case 'ASSIGNED': return 'secondary';
    case 'IN_PROGRESS': return 'warn';
    case 'ON_HOLD': return 'danger';
    case 'CLOSED': return 'success';
    default: return 'info';
  }
}

export function priorityIcon(priority?: number | null): string {
  switch (priority) {
    case 1: return 'pi pi-exclamation-triangle';
    case 2: return 'pi pi-arrow-up';
    case 3: return 'pi pi-arrow-right';
    case 4: return 'pi pi-arrow-down';
    default: return 'pi pi-minus';
  }
}

export function priorityColor(priority?: number | null): string {
  switch (priority) {
    case 1: return '#ef4444';
    case 2: return '#f59e0b';
    case 3: return '#3b82f6';
    case 4: return '#64748b';
    default: return '#64748b';
  }
}

export function prioritySeverity(priority?: number | null): TagSeverity {
  switch (priority) {
    case 1: return 'danger';
    case 2: return 'warn';
    case 3: return 'info';
    case 4: return 'secondary';
    default: return 'secondary';
  }
}