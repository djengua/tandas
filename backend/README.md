# Tandas Backend

API REST desarrollada con FastAPI para gestionar tanda (grupos de ahorro colaborativo).

## Tecnologias

- **FastAPI** - Framework web asyncrono
- **PostgreSQL** - Base de datos (con SQLAlchemy + asyncpg)
- **Alembic** - Migraciones de base de datos
- **Pydantic** - Validacion de datos
- **Python-Jose** - Autenticacion JWT
- **Bcrypt** - Hashing de contrasenas

## Modelos de Datos

### User
- `id` (UUID) - Identificador unico
- `email` (str) - Email unico
- `nombre` (str) - Nombre del usuario
- `telefono` (str, opcional)
- `password_hash` (str)
- `is_active` (bool)
- `created_at` (datetime)

### Tanda
- `id` (UUID) - Identificador unico
- `nombre` (str) - Nombre de la tanda
- `descripcion` (str, opcional)
- `monto_periodo` (float) - Monto a pagar por periodo
- `tipo_periodo` (enum) - semanal, quincenal, mensual
- `numero_participantes` (int) - Cantidad de participantes
- `fecha_inicio` (datetime, opcional)
- `fecha_fin` (datetime, opcional)
- `estado` (enum) - pendiente, activa, completada, cancelada
- `orden_sorteado` (bool) - Si el orden ya fue determinado
- `creador_id` (UUID) - ID del creador
- `created_at` (datetime)

### Participant
- `id` (UUID) - Identificador unico
- `tanda_id` (UUID) - FK a Tanda
- `usuario_id` (UUID, opcional) - FK a User
- `nombre_invitado` (str, opcional) - Nombre si es invitado
- `email_invitado` (str, opcional)
- `es_invitado` (bool) - Si es un invitado sin cuenta
- `orden` (int, opcional) - Posicion en la tanda
- `fecha_ingreso` (datetime)

### Round
- `id` (UUID) - Identificador unico
- `tanda_id` (UUID) - FK a Tanda
- `numero` (int) - Numero de ronda
- `fecha_limite` (datetime) - Fecha limite para pagar
- `cobrador_id` (UUID, opcional) - FK a Participant (quien cobra)
- `estado` (enum) - pendiente, cobrada, saltada
- `pagada` (bool) - Si el cobrador recibio el pago

### Payment
- `id` (UUID) - Identificador unico
- `ronda_id` (UUID) - FK a Round
- `participante_id` (UUID) - FK a Participant
- `monto` (float) - Monto del pago
- `fecha_pago` (datetime, opcional)
- `estado` (enum) - pendiente, pagado, atrasado

## Endpoints API

### Auth (`/api/auth`)
- `POST /register` - Registrar usuario
- `POST /login` - Iniciar sesion
- `GET /me` - Obtener usuario actual

### Tandas (`/api/tandas`)
- `GET /` - Listar tanda del usuario
- `POST /` - Crear tanda
- `GET /{tanda_id}` - Obtener tanda
- `PUT /{tanda_id}` - Actualizar tanda
- `DELETE /{tanda_id}` - Cancelar tanda

### Participantes (`/api/tandas`)
- `GET /{tanda_id}/participantes` - Listar participantes
- `POST /{tanda_id}/participantes` - Agregar participante
- `PUT /{tanda_id}/participantes/{participante_id}` - Editar participante
- `DELETE /{tanda_id}/participantes/{participante_id}` - Eliminar participante
- `POST /{tanda_id}/sortear` - Sortear orden
- `POST /{tanda_id}/iniciar` - Iniciar tanda

### Rondas (`/api/tandas`)
- `GET /{tanda_id}/rondas` - Listar rondas
- `GET /{tanda_id}/rondas/{ronda_id}` - Obtener ronda con detalles

### Pagos (`/api/tandas`)
- `POST /{tanda_id}/rondas/{ronda_id}/pagos/{participante_id}` - Registrar pago
- `POST /{tanda_id}/rondas/{ronda_id}/cobrar` - Cobrar ronda
- `POST /{tanda_id}/rondas/{ronda_id}/pagar` - Pagar al cobrador

### Reportes (`/api/tandas`)
- `GET /{tanda_id}/reporte` - Obtener reporte de tanda

### Usuarios (`/api/users`)
- `GET /` - Listar usuarios (buscar por email)
- `GET /{user_id}` - Obtener usuario

## Servicios

### tanda.py
- `create_tanda()` - Crear tanda
- `get_user_tandas()` - Obtener tanda del usuario
- `get_tanda_by_id()` - Obtener tanda por ID
- `update_tanda()` - Actualizar tanda
- `delete_tanda()` - Cancelar tanda

### pago.py
- `register_payment()` - Registrar pago de participante
- `cobrar_ronda()` - Marcar ronda como cobrada
- `pagar_ronda()` - Pagar al cobrador y avanzar tanda
- `get_round_payments()` - Obtener pagos de ronda

### sorteo.py
- `iniciar_tanda()` - Iniciar tanda y generar rondas
- `sortear_orden()` - Sortear orden aleatorio
- `definir_orden()` - Definir orden manualmente

### calculo.py
- Calculos para fechas y periodos

### report.py
- Generacion de reportes

## Ejecutar Proyecto

### 1. Crear entorno virtual
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: venv\Scripts\activate  # Windows
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar base de datos
Edita el archivo `.env` con tu conexion a PostgreSQL:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/tandas
SECRET_KEY=tu-secret-key-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Ejecutar migraciones
```bash
alembic upgrade head
```

### 5. Iniciar servidor
```bash
uvicorn app.main:app --reload
```

El servidor estara disponible en `http://localhost:8000`
Documentacion Swagger: `http://localhost:8000/docs`