import { FilterOption } from '../models/filter-option';

export const WORKORDER_STATUS_OPTIONS: FilterOption<string>[] = [
  { label: 'WORKORDERS.STATUSES.OPEN', value: 'OPEN' },
  { label: 'WORKORDERS.STATUSES.ASSIGNED', value: 'ASSIGNED' },
  { label: 'WORKORDERS.STATUSES.IN_PROGRESS', value: 'IN_PROGRESS' },
  { label: 'WORKORDERS.STATUSES.ON_HOLD', value: 'ON_HOLD' },
  { label: 'WORKORDERS.STATUSES.CLOSED', value: 'CLOSED' }
];

export const WORKORDER_PRIORITY_OPTIONS: FilterOption<number>[] = [
  { label: 'Urgente', value: 1 },
  { label: 'Alta', value: 2 },
  { label: 'Media', value: 3 },
  { label: 'Baja', value: 4 }
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

export const INVENTORY_UNIT_OPTIONS: FilterOption<string>[] = [
  { label: 'Unidades', value: 'ud' },
  { label: 'Kilogramos', value: 'kg' },
  { label: 'Gramos', value: 'g' },
  { label: 'Litros', value: 'l' },
  { label: 'Metros', value: 'm' },
  { label: 'Cajas', value: 'caja' },
  { label: 'Pares', value: 'par' }
];

export const INVENTORY_CATEGORY_OPTIONS: FilterOption<string>[] = [
  { label: 'Mecánica', value: 'MECHANICAL' },
  { label: 'Eléctrica', value: 'ELECTRICAL' },
  { label: 'Hidráulica', value: 'HYDRAULIC' },
  { label: 'Filtros', value: 'FILTERS' },
  { label: 'Lubricantes', value: 'LUBRICANTS' },
  { label: 'Herramientas', value: 'TOOLS' },
  { label: 'Seguridad', value: 'SAFETY' },
  { label: 'Otros', value: 'OTHER' }
];
