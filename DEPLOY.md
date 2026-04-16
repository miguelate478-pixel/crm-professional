# Guía de Despliegue — CRM Pro

## Opción 1: Railway (Recomendado)

### Pasos:

1. **Sube el código a GitHub**
   ```bash
   git init
   git add .
   git commit -m "CRM Pro - initial deploy"
   git remote add origin https://github.com/TU_USUARIO/crm-pro.git
   git push -u origin main
   ```

2. **Crea un proyecto en Railway**
   - Ve a [railway.app](https://railway.app) y crea una cuenta
   - Haz clic en "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio

3. **Configura las variables de entorno en Railway**
   - En el panel de Railway, ve a tu servicio → "Variables"
   - Agrega:
     ```
     JWT_SECRET=<genera uno con: openssl rand -base64 32>
     NODE_ENV=production
     PORT=3000
     DATABASE_URL=file:/data/crm.db
     ```

4. **Configura el volumen para SQLite (persistencia)**
   - En Railway, ve a tu servicio → "Volumes"
   - Crea un volumen montado en `/data`
   - Esto asegura que la base de datos no se pierda al redeploy

5. **Deploy automático**
   - Railway detecta el `Dockerfile` y construye automáticamente
   - El health check apunta a `/api/health`

---

## Opción 2: Render

1. Crea cuenta en [render.com](https://render.com)
2. "New Web Service" → conecta tu repo de GitHub
3. Configuración:
   - **Environment**: Docker
   - **Build Command**: (automático con Dockerfile)
   - **Start Command**: `node dist/index.js`
4. Variables de entorno: igual que Railway
5. Para persistencia: crea un "Disk" montado en `/data`

---

## Opción 3: VPS / Servidor propio

```bash
# En el servidor
git clone https://github.com/TU_USUARIO/crm-pro.git
cd crm-pro
cp .env.example .env
# Edita .env con tus valores reales
nano .env

# Con Docker
docker build -t crm-pro .
docker run -d \
  --name crm-pro \
  -p 3000:3000 \
  -v /opt/crm-data:/data \
  --env-file .env \
  crm-pro
```

---

## Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET` | Clave secreta para JWT (mín. 32 chars) | `abc123...` |
| `NODE_ENV` | Entorno | `production` |
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_URL` | Ruta a la base de datos SQLite | `file:/data/crm.db` |

### Generar JWT_SECRET seguro:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## Notas importantes

- **SQLite en producción**: Funciona bien para hasta ~50 usuarios concurrentes. Si necesitas más escala, migra a PostgreSQL.
- **Backups**: Haz backup del archivo `/data/crm.db` regularmente.
- **HTTPS**: Railway y Render proveen HTTPS automáticamente.
- **Demo data**: Solo la organización ID=1 tiene datos de demo. Nuevos registros empiezan vacíos con su propio pipeline.
