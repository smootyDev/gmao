import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';

interface ModuleCard {
  icon: string;
  title: string;
  description: string;
  accent: string;
}

interface RoleCard {
  name: string;
  icon: string;
  color: string;
  capabilities: string[];
}

interface TechItem {
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-landscape',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './landscape.component.html',
  styleUrl: './landscape.component.scss'
})
export class LandscapeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loggedIn = computed(() => this.auth.currentUser() !== null);

  goToEntry(): void {
    this.router.navigate([this.loggedIn() ? '/dashboard' : '/login']);
  }

  modules: ModuleCard[] = [
    {
      icon: 'pi pi-wrench',
      title: 'Órdenes de trabajo',
      description: 'Gestiona el ciclo completo: apertura, asignación a técnicos, estados, prioridades, horas estimadas y reales, y artículos asociados.',
      accent: 'amber'
    },
    {
      icon: 'pi pi-box',
      title: 'Activos y equipos',
      description: 'Catálogo de activos con tipo, criticidad, estado, ubicación, número de serie y horas de uso para una flota siempre controlada.',
      accent: 'blue'
    },
    {
      icon: 'pi pi-tags',
      title: 'Tipos de activo',
      description: 'Clasifica equipos con código, icono y descripción, manteniendo una taxonomía consistente en toda la organización.',
      accent: 'purple'
    },
    {
      icon: 'pi pi-sitemap',
      title: 'Localizaciones',
      description: 'Estructura jerárquica de la planta (empresa, áreas, ubicaciones) con reordenación por arrastre y protección de la raíz.',
      accent: 'cyan'
    },
    {
      icon: 'pi pi-shopping-cart',
      title: 'Inventario',
      description: 'Piezas y repuestos con categoría, unidad, stock actual y mínimo, y vínculo directo con las órdenes de trabajo.',
      accent: 'green'
    },
    {
      icon: 'pi pi-calendar-clock',
      title: 'Preventivo',
      description: 'Planes de mantenimiento programados que generan órdenes de trabajo automáticamente según su frecuencia.',
      accent: 'orange'
    },
    {
      icon: 'pi pi-chart-line',
      title: 'Dashboard y KPIs',
      description: 'Indicadores en tiempo real: pendientes, cumplimiento, disponibilidad de flota, tendencias mensuales y alertas.',
      accent: 'indigo'
    },
    {
      icon: 'pi pi-android',
      title: 'Asistente IA',
      description: 'Chat con contexto real del sistema para sugerir órdenes, priorizar el trabajo y resumir la actividad del mantenimiento.',
      accent: 'rose'
    },
    {
      icon: 'pi pi-users',
      title: 'Usuarios y roles',
      description: 'Perfiles ADMIN, MANAGER y TECH con permisos diferenciados para operar con seguridad y trazabilidad.',
      accent: 'slate'
    },
    {
      icon: 'pi pi-history',
      title: 'Auditoría',
      description: 'Registro completo de cada operación con filtros, cuerpo de petición, retención de 90 días y trazabilidad por usuario.',
      accent: 'teal'
    }
  ];

  roles: RoleCard[] = [
    {
      name: 'ADMIN',
      icon: 'pi pi-shield',
      color: '#6366f1',
      capabilities: [
        'Gestiona usuarios, roles y configuración del sistema',
        'Acceso a auditoría y configuración de IA',
        'Control total sobre todos los módulos'
      ]
    },
    {
      name: 'MANAGER',
      icon: 'pi pi-user-gear',
      color: '#0d9488',
      capabilities: [
        'Planifica y gestiona órdenes de trabajo',
        'Crea y edita activos, preventivos e inventario',
        'Asigna técnicos y cambia prioridades'
      ]
    },
    {
      name: 'TECH',
      icon: 'pi pi-user',
      color: '#f59e0b',
      capabilities: [
        'Ejecuta sus órdenes asignadas',
        'Actualiza estados y registra horas reales',
        'Consulta activos, localizaciones y tipos'
      ]
    }
  ];

  tech: TechItem[] = [
    { name: 'Angular 21', description: 'Frontend moderno con signals y zoneless', icon: 'pi pi-globe' },
    { name: 'PrimeNG', description: 'Biblioteca de componentes de UI', icon: 'pi pi-th-large' },
    { name: 'Spring Boot 4', description: 'API REST con Java 21', icon: 'pi pi-server' },
    { name: 'PostgreSQL', description: 'Base de datos relacional', icon: 'pi pi-database' },
    { name: 'JWT', description: 'Autenticación segura y stateless', icon: 'pi pi-lock' },
    { name: 'PWA', description: 'Instalable con sincronización offline', icon: 'pi pi-mobile' }
  ];

  accentColor(accent: string): string {
    const palette: Record<string, string> = {
      amber: '#f59e0b',
      blue: '#3b82f6',
      purple: '#8b5cf6',
      cyan: '#06b6d4',
      green: '#10b981',
      orange: '#f97316',
      indigo: '#6366f1',
      rose: '#f43f5e',
      slate: '#64748b',
      teal: '#0d9488'
    };
    return palette[accent] ?? '#64748b';
  }
}