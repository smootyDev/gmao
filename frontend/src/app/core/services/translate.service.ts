import { Injectable, signal } from '@angular/core';

const translations: Record<string, any> = {
  es: {
    LOGIN: {
      SUBTITLE: 'Sistema de Gestión de Mantenimiento',
      USERNAME: 'Usuario',
      PASSWORD: 'Contraseña',
      SUBMIT: 'Iniciar sesión',
      ERRORS: {
        REQUIRED: 'Usuario y contraseña son obligatorios',
        INVALID: 'Usuario o contraseña incorrectos'
      }
    },
    MENU: {
      DASHBOARD: 'Panel',
      WORKORDERS: 'Órdenes de trabajo',
      ASSETS: 'Activos',
      LOGOUT: 'Cerrar sesión'
    },
    DASHBOARD: {
      TITLE: 'Panel de control',
      OPEN: 'Abiertas',
      IN_PROGRESS: 'En curso',
      CLOSED: 'Cerradas',
      URGENT: 'Urgentes'
    },
    WORKORDERS: {
      TITLE: 'Órdenes de trabajo',
      NEW: 'Nueva orden',
      EDIT: 'Editar orden',
      ID: 'ID',
      TITLE_LABEL: 'Título',
      DESCRIPTION: 'Descripción',
      STATUS: 'Estado',
      PRIORITY: 'Prioridad',
      ASSET: 'Activo',
      ASSIGNED: 'Asignado a',
      ESTIMATED_HOURS: 'Horas estimadas',
      STATUSES: {
        OPEN: 'Abierta',
        ASSIGNED: 'Asignada',
        IN_PROGRESS: 'En progreso',
        ON_HOLD: 'En espera',
        CLOSED: 'Cerrada'
      }
    },
    ASSETS: {
      TITLE: 'Activos',
      NEW: 'Nuevo activo',
      EDIT: 'Editar activo',
      ID: 'ID',
      NAME: 'Nombre',
      TYPE: 'Tipo',
      CRITICALITY: 'Criticidad',
      STATUS: 'Estado',
      LOCATION: 'Ubicación',
      SERIAL_NUMBER: 'Número de serie',
      HOURS_OF_USE: 'Horas de uso',
      PURCHASE_DATE: 'Fecha de compra'
    },
    COMMON: {
      SAVE: 'Guardar',
      CANCEL: 'Cancelar',
      NO_DATA: 'No hay datos disponibles'
    },
    THEME: {
      TOGGLE: 'Cambiar tema'
    }
  },
  en: {
    LOGIN: {
      SUBTITLE: 'Maintenance Management System',
      USERNAME: 'Username',
      PASSWORD: 'Password',
      SUBMIT: 'Sign in',
      ERRORS: {
        REQUIRED: 'Username and password are required',
        INVALID: 'Invalid username or password'
      }
    },
    MENU: {
      DASHBOARD: 'Dashboard',
      WORKORDERS: 'Work Orders',
      ASSETS: 'Assets',
      LOGOUT: 'Logout'
    },
    DASHBOARD: {
      TITLE: 'Dashboard',
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      CLOSED: 'Closed',
      URGENT: 'Urgent'
    },
    WORKORDERS: {
      TITLE: 'Work Orders',
      NEW: 'New Work Order',
      EDIT: 'Edit Work Order',
      ID: 'ID',
      TITLE_LABEL: 'Title',
      DESCRIPTION: 'Description',
      STATUS: 'Status',
      PRIORITY: 'Priority',
      ASSET: 'Asset',
      ASSIGNED: 'Assigned to',
      ESTIMATED_HOURS: 'Estimated hours',
      STATUSES: {
        OPEN: 'Open',
        ASSIGNED: 'Assigned',
        IN_PROGRESS: 'In Progress',
        ON_HOLD: 'On Hold',
        CLOSED: 'Closed'
      }
    },
    ASSETS: {
      TITLE: 'Assets',
      NEW: 'New Asset',
      EDIT: 'Edit Asset',
      ID: 'ID',
      NAME: 'Name',
      TYPE: 'Type',
      CRITICALITY: 'Criticality',
      STATUS: 'Status',
      LOCATION: 'Location',
      SERIAL_NUMBER: 'Serial Number',
      HOURS_OF_USE: 'Hours of Use',
      PURCHASE_DATE: 'Purchase Date'
    },
    COMMON: {
      SAVE: 'Save',
      CANCEL: 'Cancel',
      NO_DATA: 'No data available'
    },
    THEME: {
      TOGGLE: 'Toggle theme'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private currentLang = signal<string>(this.loadLanguage());

  use(lang: string): void {
    this.currentLang.set(lang);
    localStorage.setItem('gmao_language', lang);
  }

  getCurrentLang(): string {
    return this.currentLang();
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLang()];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  private loadLanguage(): string {
    return localStorage.getItem('gmao_language') || 'es';
  }
}
