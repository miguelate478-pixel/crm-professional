# 🚀 RAILWAY SETUP - CHECKLIST RÁPIDO

**Tiempo estimado:** 10 minutos

---

## ✅ PASO 1: Generar JWT_SECRET

En tu terminal:
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copia el resultado (ej: `abc123xyz...`)

---

## ✅ PASO 2: Obtener Google OAuth

1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto (o usa uno existente)
3. Habilita "Google+ API"
4. Ve a "Credenciales"
5. Crea "OAuth 2.0 Client ID" (tipo: Web application)
6. Agrega URI autorizado:
   ```
   https://tu-proyecto-railway.railway.app/api/google/callback
   ```
7. Copia:
   - Client ID
   - Client Secret

---

## ✅ PASO 3: Configurar Railway

### 3.1 Variables de Entorno
1. Abre tu proyecto en Railway
2. Ve a **Settings → Variables**
3. Agrega estas variables:

```
JWT_SECRET=<tu-jwt-secret-generado>
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/data/crm.db
APP_URL=https://tu-proyecto-railway.railway.app
GOOGLE_CLIENT_ID=<tu-google-client-id>
GOOGLE_CLIENT_SECRET=<tu-google-client-secret>
GOOGLE_REDIRECT_URI=https://tu-proyecto-railway.railway.app/api/google/callback
```

### 3.2 Crear Volumen de Persistencia
1. Ve a **Settings → Volumes**
2. Crea un nuevo volumen:
   - Mount Path: `/data`
   - Size: 1GB (suficiente para empezar)
3. Guardar

### 3.3 Deployar
1. Ve a **Deployments**
2. Haz click en "Deploy" (o espera a que se auto-depliegue)
3. Espera 5-10 minutos

---

## ✅ PASO 4: Verificar que Funciona

1. Abre tu URL de Railway (ej: `https://tu-proyecto-railway.railway.app`)
2. Deberías ver la página de login
3. Haz click en "Login with Google"
4. Verifica que puedas iniciar sesión
5. Crea un lead de prueba
6. Genera un reporte

---

## ✅ PASO 5: Configurar Email (Opcional pero recomendado)

### Opción A: Resend (Más fácil)
1. Ve a https://resend.com
2. Crea una cuenta
3. Obtén tu API key
4. En Railway, agrega:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=CRM Pro <noreply@tudominio.com>
   ```

### Opción B: SMTP (Gmail)
1. En Railway, agrega:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASSWORD=tu-app-password
   SMTP_FROM_EMAIL=noreply@tudominio.com
   ```

---

## 📋 VARIABLES REQUERIDAS

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| JWT_SECRET | Generado con openssl | `abc123xyz...` |
| NODE_ENV | production | `production` |
| PORT | 3000 | `3000` |
| DATABASE_URL | Ruta de SQLite | `file:/data/crm.db` |
| APP_URL | Tu URL de Railway | `https://crm-prod.railway.app` |
| GOOGLE_CLIENT_ID | De Google Cloud | `123456.apps.googleusercontent.com` |
| GOOGLE_CLIENT_SECRET | De Google Cloud | `GOCSPX-xxxxx` |
| GOOGLE_REDIRECT_URI | Tu URL + callback | `https://crm-prod.railway.app/api/google/callback` |

---

## 🔍 VERIFICAR DESPUÉS DE DEPLOYAR

- [ ] Página de login carga
- [ ] Login con Google funciona
- [ ] Puedo crear un lead
- [ ] Puedo crear una oportunidad
- [ ] Puedo generar un reporte
- [ ] Puedo exportar a CSV
- [ ] Puedo exportar a PDF

---

## 🆘 PROBLEMAS COMUNES

### "Login no funciona"
- Verifica que GOOGLE_REDIRECT_URI sea exacto
- Verifica que el URI esté autorizado en Google Cloud Console

### "Base de datos se pierde"
- Verifica que el volumen `/data` esté creado
- Verifica que DATABASE_URL sea `file:/data/crm.db`

### "Error 500 en login"
- Verifica que JWT_SECRET esté configurado
- Verifica que GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET sean correctos

### "Reportes no se envían"
- Configura RESEND_API_KEY o SMTP
- Verifica que FROM_EMAIL sea válido

---

## 📞 SOPORTE

Si algo no funciona:
1. Ve a Railway → Logs
2. Busca el error
3. Verifica que todas las variables estén configuradas
4. Haz un redeploy manual

---

## ✨ LISTO!

Una vez completados estos pasos, tu CRM estará en producción. 🎉

**Tiempo total:** ~10 minutos
