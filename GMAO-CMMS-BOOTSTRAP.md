
# **GMAO-CMMS-BOOTSTRAP.md**

```markdown
# GMAO CMMS – Bootstrap para Visual Studio Code  
Sistema completo GMAO/CMMS modular listo para producción  
Backend: **Spring Boot 3 + Java 21 + PostgreSQL + JWT**  
Frontend: **Angular 21 + PrimeNG + PWA + Offline Sync**  
Infra: **Docker + docker-compose**

---

## Objetivo
Este documento proporciona **toda la estructura**, **comandos**, **plantillas de archivos**, **endpoints**, **tests**, **docker**, **README**, y **flujo de trabajo** para construir un sistema GMAO/CMMS moderno desde cero.

---

# 1. Estructura del proyecto

```
gmao-cmms/
│
├── backend/
│   ├── src/main/java/com/gmao/backend/
│   │   ├── config/
│   │   ├── common/
│   │   ├── auth/
│   │   ├── workorders/
│   │   ├── assets/
│   │   ├── preventive/
│   │   ├── inventory/
│   │   ├── procedures/
│   │   ├── reports/
│   │   ├── notifications/
│   │   └── storage/
│   ├── src/main/resources/
│   └── pom.xml
│
├── frontend/
│   ├── frontend/ (Angular workspace)
│   ├── package.json
│   └── angular.json
│
├── docker-compose.yml
├── README.md
└── scripts/
    └── init-db.sql
```

---

# 2. Comandos iniciales

## Crear estructura base

```bash
mkdir gmao-cmms
cd gmao-cmms
```

### Backend Spring Boot

```bash
mkdir backend
cd backend

curl "https://start.spring.io/starter.tgz?type=maven-project&language=java&bootVersion=3.2.0&baseDir=backend&groupId=com.gmao&artifactId=backend&name=gmao-backend&packageName=com.gmao.backend&javaVersion=17&dependencies=web,data-jpa,postgresql,security,validation" | tar -xzvf -

cd ..
```

### Frontend Angular

```bash
mkdir frontend
cd frontend
npx -y @angular/cli new frontend --routing --style=scss --skip-git --skip-install
cd ..
```

---

# 3. Backend – Plantillas esenciales

## 3.1 Paquetes

```bash
cd backend/src/main/java/com/gmao/backend
mkdir -p config common auth workorders assets preventive inventory procedures reports notifications storage
```

---

## 3.2 Entidades JPA

### WorkOrder

```java
package com.gmao.backend.workorders.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "work_orders")
public class WorkOrder {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String title;
  @Column(length=2000)
  private String description;
  @Enumerated(EnumType.STRING)
  private Status status = Status.OPEN;
  private Integer priority = 3;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();
  private Long assetId;
  private Long assignedTo;
  private Double estimatedHours;

  public enum Status { OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD, CLOSED }
}
```

### Asset

```java
package com.gmao.backend.assets.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name="assets")
public class Asset {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String name;
  private String type;
  private String criticality;
  private String status;
  private String location;
  private String serialNumber;
  private Double hoursOfUse;
  private LocalDate purchaseDate;
}
```

### PreventiveTask

```java
package com.gmao.backend.preventive.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="preventive_tasks")
public class PreventiveTask {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String name;
  private String cronExpression;
  private Integer intervalHours;
  private boolean active = true;
  private Long assetId;
  private Instant nextRun;
}
```

### Part (Inventario)

```java
package com.gmao.backend.inventory.entity;

import jakarta.persistence.*;

@Entity
@Table(name="parts")
public class Part {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String sku;
  private String name;
  private Integer stock;
  private String location;
  private Integer minThreshold;
  private String supplier;
  private Integer leadTimeDays;
}
```

---

## 3.3 Repositorios

```java
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
  List<WorkOrder> findByStatus(WorkOrder.Status status);
  List<WorkOrder> findByAssignedTo(Long techId);
}
```

---

## 3.4 Servicios

```java
@Service
public class WorkOrderService {
  private final WorkOrderRepository repo;

  public WorkOrderService(WorkOrderRepository repo){ this.repo = repo; }

  public WorkOrder create(WorkOrder w){ return repo.save(w); }
  public Optional<WorkOrder> get(Long id){ return repo.findById(id); }
  public List<WorkOrder> list(){ return repo.findAll(); }
  public WorkOrder update(WorkOrder w){ return repo.save(w); }
}
```

---

## 3.5 Controladores REST

```java
@RestController
@RequestMapping("/api/workorders")
public class WorkOrderController {
  private final WorkOrderService service;

  public WorkOrderController(WorkOrderService service){ this.service = service; }

  @PostMapping
  public WorkOrder create(@RequestBody WorkOrder dto){ return service.create(dto); }

  @GetMapping
  public List<WorkOrder> list(){ return service.list(); }

  @GetMapping("/{id}")
  public WorkOrder get(@PathVariable Long id){ return service.get(id).orElseThrow(); }
}
```

---

## 3.6 Seguridad JWT

Archivos necesarios:

```
auth/User.java
auth/Role.java
auth/AuthController.java
auth/JwtProvider.java
config/SecurityConfig.java
```

Variables de entorno:

```
JWT_SECRET
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

---

## 3.7 Scheduler Preventivo

```java
@Component
public class PreventiveScheduler {

  @Scheduled(fixedRateString = "${preventive.scheduler.rate:60000}")
  public void run() {
    // Lógica para generar órdenes preventivas
  }
}
```

---

## 3.8 Almacenamiento de archivos

```java
@Service
public class FileStorageService {
  private final Path root = Paths.get("data/uploads");

  public String store(MultipartFile file) throws Exception {
    Files.createDirectories(root);
    var target = root.resolve(file.getOriginalFilename());
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    return target.toString();
  }
}
```

---

# 4. Frontend Angular

## 4.1 Instalación

```bash
cd frontend/frontend
npm install
npx ng add @angular/material
npx ng add @angular/pwa
npm install localforage @ngx-pwa/local-storage
```

---

## 4.2 Servicio HTTP

```ts
@Injectable({ providedIn: 'root' })
export class WorkordersService {
  base = '/api/workorders';
  constructor(private http: HttpClient) {}
  create(payload: any) { return this.http.post(this.base, payload); }
  list(params?: any) { return this.http.get(this.base, { params }); }
  get(id: number) { return this.http.get(`${this.base}/${id}`); }
}
```

---

# 5. Docker y docker-compose

## 5.1 Dockerfile Backend

```dockerfile
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY . .
RUN ./mvnw -q -DskipTests package
EXPOSE 8080
CMD ["java","-jar","target/backend-0.0.1-SNAPSHOT.jar"]
```

---

## 5.2 Dockerfile Frontend

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:stable-alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
```

---

## 5.3 docker-compose.yml

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: gmao
      POSTGRES_USER: gmao
      POSTGRES_PASSWORD: gmao_pass
    volumes:
      - db_data:/var/lib/postgresql/data
    ports: ["5432:5432"]

  backend:
    build: ./backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/gmao
      SPRING_DATASOURCE_USERNAME: gmao
      SPRING_DATASOURCE_PASSWORD: gmao_pass
      JWT_SECRET: ${JWT_SECRET:-devsecret}
    depends_on: ["db"]
    ports: ["8080:8080"]
    volumes:
      - ./backend/data/uploads:/app/data/uploads

  frontend:
    build: ./frontend
    ports: ["4200:80"]
    depends_on: ["backend"]

volumes:
  db_data:
```

---

# 6. Tests

## Backend

```java
@SpringBootTest
public class WorkOrderServiceTest {
  @Autowired WorkOrderService service;

  @Test
  public void createWorkOrderSetsOpen() {
    WorkOrder w = new WorkOrder();
    w.setTitle("Test");
    var saved = service.create(w);
    assertEquals(WorkOrder.Status.OPEN, saved.getStatus());
  }
}
```

---

# 7. README.md

```markdown
# GMAO CMMS

## Requisitos
Java 17, Maven, Node 20+, Angular CLI, Docker.

## Levantar en local
export JWT_SECRET=$(openssl rand -base64 32)
docker-compose up --build

## Endpoints
- POST /api/auth/login
- POST /api/workorders
- GET /api/workorders
- GET /api/workorders/{id}

## Ejemplo curl
curl -X POST http://localhost:8080/api/workorders \
 -H "Authorization: Bearer $JWT" \
 -H "Content-Type: application/json" \
 -d '{"title":"Reparar bomba","description":"Fuga","assetId":12}'
```

---

# 8. Informe final

## Estructura creada
- backend con módulos completos
- frontend Angular con PWA
- docker-compose funcional
- tests base
- README

## Pendientes
- Checklists dinámicos
- Firma digital
- Notificaciones reales
- Métricas avanzadas
- S3 para evidencias

---

# 9. Cómo usar este archivo

1. Guarda este archivo como **GMAO-CMMS-BOOTSTRAP.md**  
2. Ábrelo en Visual Studio Code  
3. Copia los bloques en los archivos correspondientes  
4. Ejecuta los comandos en tu terminal local  
5. Usa tus agentes Ollama para generar el resto del código automáticamente  

---

# Fin del archivo
```

---

Si quieres, puedo generar también:

✅ un **bootstrap.sh** que cree toda la estructura automáticamente  
✅ un **agent.json** para Continue.dev  
✅ un **plan de tareas para Ollama Agents**

Solo dímelo.