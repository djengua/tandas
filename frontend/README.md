# Tandas Frontend

Aplicacion web desarrollada con Next.js para gestionar tanda (grupos de ahorro colaborativo).

## Tecnologias

- **Next.js 14** - Framework React con App Router
- **React 18** - Libreria de UI
- **TypeScript** - Tipado estatico
- **Axios** - Cliente HTTP
- **Zustand** - Gestion de estado
- **React Hook Form** - Formularios
- **Zod** - Validacion de esquemas
- **TanStack Query** - Fetching de datos
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

## Estructura de Proyecto

```
src/
├── api/
│   ├── client.ts      # Cliente Axios con interceptores
│   ├── auth.ts       # Endpoints de autenticacion
│   ├── tandas.ts     # Endpoints de tandas
│   └── users.ts     # Endpoints de usuarios
├── components/
│   ├── Layout.tsx  # Layout principal
│   └── ui/         # Componentes UI
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Modal.tsx
│       └── EmptyState.tsx
├── stores/
│   └── authStore.ts # Estado de autenticacion
├── types/
│   └── index.ts    # Tipos TypeScript
├── utils/
│   └── date.ts    # Utilidades de fecha
└── app/           # Páginas Next.js
    ├── page.tsx           # Home
    ├── login/             # Login
    ├── dashboard/        # Dashboard
    └── tandas/[id]/      # Detalle tanda

```

## Tipos de Datos

### User
```typescript
interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  is_active: boolean;
  created_at: string;
}
```

### Tanda
```typescript
interface Tanda {
  id: string;
  nombre: string;
  descripcion: string | null;
  monto_periodo: number;
  tipo_periodo: 'semanal' | 'quincenal' | 'mensual';
  numero_participantes: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: 'pendiente' | 'activa' | 'completada' | 'cancelada';
  orden_sorteado: boolean;
  creador_id: string;
  created_at: string;
  participantes_count: number | null;
  rondas_count: number | null;
  advertencia: string | null;
}
```

### Participant
```typescript
interface Participant {
  id: string;
  tanda_id: string;
  usuario_id: string | null;
  nombre_invitado: string | null;
  email_invitado: string | null;
  es_invitado: boolean;
  orden: number | null;
  fecha_ingreso: string;
  nombre_display: string | null;
  email_display: string | null;
}
```

### Round
```typescript
interface Round {
  id: string;
  tanda_id: string;
  numero: number;
  fecha_limite: string;
  cobrador_id: string | null;
  estado: 'pendiente' | 'cobrada' | 'saltada';
  pagada: boolean;
  cobrador_nombre: string | null;
}
```

### Payment
```typescript
interface Payment {
  id: string;
  ronda_id: string;
  participante_id: string;
  monto: number;
  fecha_pago: string | null;
  estado: 'pendiente' | 'pagado' | 'atrasado';
  participante_nombre: string | null;
}
```

### TandaReport
```typescript
interface TandaReport {
  tanda_id: string;
  tanda_nombre: string;
  estado: string;
  monto_periodo: number;
  total_participantes: number;
  total_rondas: number;
  rondas_cobradas: number;
  total_pagos: number;
  pagos_completados: number;
  pagos_pendientes: number;
  monto_esperado: number;
  total_recaudado: number;
  porcentaje_completado: number;
  detalle_participantes: ParticipantReport[];
}
```

## API Client

El cliente `client.ts` configura Axios con:
- Base URL `/api`
- Interceptor de requests para agregar token JWT
- Interceptor de responses para manejar 401 (logout automatico)

## Funcionalidades

### TandasApi
- `list()` - Listar tanda
- `get(id)` - Obtener tanda
- `create(data)` - Crear tanda
- `update(id, data)` - Actualizar tanda
- `cancel(id)` - Cancelar tanda
- `getParticipants(id)` - Obtener participantes
- `addParticipant(id, data)` - Agregar participante
- `removeParticipant(id, participantId)` - Eliminar participante
- `sortear(id)` - Sortear orden
- `iniciar(id)` - Iniciar tanda
- `getRounds(id)` - Obtener rondas
- `getRound(tandaId, roundId)` - Obtener ronda con pagos
- `registerPayment(tandaId, roundId, participantId)` - Registrar pago
- `cobrarRonda(tandaId, roundId)` - Cobrar ronda
- `pagarRonda(tandaId, roundId)` - Pagar al cobrador
- `getReport(tandaId)` - Obtener reporte
- `updateParticipant(id, participantId, data)` - Actualizar participante

## Ejecutar Proyecto

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000`

### 4. Build de produccion
```bash
npm run build
npm start
```