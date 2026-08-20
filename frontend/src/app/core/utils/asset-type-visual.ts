import { AssetType } from '../../features/asset-types/services/asset-type.service';

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface AssetTypeVisual {
  icon: string;
  color: string;
  severity: TagSeverity;
}

export const ASSET_TYPE_ICONS: string[] = [
  'pi pi-cog',
  'pi pi-sitemap',
  'pi pi-bolt',
  'pi pi-building',
  'pi pi-truck',
  'pi pi-wrench',
  'pi pi-home',
  'pi pi-box',
  'pi pi-desktop',
  'pi pi-microchip',
  'pi pi-car',
  'pi pi-database',
  'pi pi-warehouse',
  'pi pi-hammer'
];

const ICON_COLORS: Record<string, string> = {
  'pi pi-cog': '#3b82f6',
  'pi pi-sitemap': '#8b5cf6',
  'pi i-bolt': '#eab308',
  'pi pi-building': '#ec4899',
  'pi pi-truck': '#f97316',
  'pi pi-wrench': '#22c55e',
  'pi pi-home': '#f43f5e',
  'pi pi-box': '#64748b',
  'pi pi-desktop': '#6366f1',
  'pi pi-microchip': '#06b6d4',
  'pi pi-car': '#14b8a6',
  'pi pi-database': '#0ea5e9',
  'pi pi-warehouse': '#84cc16',
  'pi pi-hammer': '#a16207'
};

const ICON_SEVERITIES: Record<string, TagSeverity> = {
  'pi pi-cog': 'info',
  'pi pi-sitemap': 'secondary',
  'pi pi-bolt': 'warn',
  'pi pi-building': 'warn',
  'pi pi-truck': 'danger',
  'pi pi-wrench': 'success',
  'pi pi-home': 'danger',
  'pi pi-box': 'secondary',
  'pi pi-desktop': 'secondary',
  'pi pi-microchip': 'contrast',
  'pi pi-car': 'info',
  'pi pi-database': 'info',
  'pi pi-warehouse': 'success',
  'pi pi-hammer': 'warn'
};

const DEFAULT_ICON = 'pi pi-box';

export function assetTypeVisual(types: AssetType[], typeId?: number | null): AssetTypeVisual {
  const type = types.find((candidate) => candidate.id === typeId);
  const icon = type?.icon && ASSET_TYPE_ICONS.includes(type.icon) ? type.icon : fallbackIcon(types, typeId);
  return {
    icon,
    color: ICON_COLORS[icon] ?? '#64748b',
    severity: ICON_SEVERITIES[icon] ?? 'secondary'
  };
}

export function assetTypeIconColor(icon: string | undefined): string {
  return (icon && ICON_COLORS[icon]) || '#64748b';
}

function fallbackIcon(types: AssetType[], typeId?: number | null): string {
  const index = types.findIndex((type) => type.id === typeId);
  return ASSET_TYPE_ICONS[(index < 0 ? 0 : index) % ASSET_TYPE_ICONS.length] ?? DEFAULT_ICON;
}