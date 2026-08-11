import { FilterOption } from '../models/filter-option';

export const WORKORDER_STATUS_OPTIONS: FilterOption<string>[] = [
  { label: 'WORKORDERS.STATUSES.OPEN', value: 'OPEN' },
  { label: 'WORKORDERS.STATUSES.ASSIGNED', value: 'ASSIGNED' },
  { label: 'WORKORDERS.STATUSES.IN_PROGRESS', value: 'IN_PROGRESS' },
  { label: 'WORKORDERS.STATUSES.ON_HOLD', value: 'ON_HOLD' },
  { label: 'WORKORDERS.STATUSES.CLOSED', value: 'CLOSED' }
];

export const WORKORDER_PRIORITY_OPTIONS: FilterOption<number>[] = [
  { label: '1 - Urgente', value: 1 },
  { label: '2 - Alta', value: 2 },
  { label: '3 - Media', value: 3 },
  { label: '4 - Baja', value: 4 }
];

export const ASSET_CRITICALITY_OPTIONS: FilterOption<string>[] = [
  { label: 'Baja', value: 'LOW' },
  { label: 'Media', value: 'MEDIUM' },
  { label: 'Alta', value: 'HIGH' },
  { label: 'Crítica', value: 'CRITICAL' }
];

export const ASSET_STATUS_OPTIONS: FilterOption<string>[] = [
  { label: 'Operativo', value: 'OPERATIVE' },
  { label: 'Mantenimiento', value: 'MAINTENANCE' },
  { label: 'Fuera de servicio', value: 'OUT_OF_SERVICE' }
];

export const USER_ROLE_OPTIONS: FilterOption<string>[] = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Responsable', value: 'MANAGER' },
  { label: 'Técnico', value: 'TECH' }
];
