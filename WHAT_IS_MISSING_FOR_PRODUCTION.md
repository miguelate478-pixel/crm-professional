# 📋 QUÉ FALTA PARA PRODUCCIÓN

**Status:** ✅ Código listo | ⚠️ Configuración pendiente  
**Date:** April 16, 2026

---

## 🔴 CRÍTICO - DEBE CONFIGURARSE ANTES DE DEPLOYAR

### 1. Variables de Entorno en Railway
En Railway, ve a **Settings → Variables** y configura:

```env
# REQUERIDO
JWT_SECRET=<genera-una-clave-aleatoria-de-32-caracteres>
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/data/crm.db
APP_URL=https://tu-dominio-railway.railway.app

# GOOGLE OAUTH (REQUERIDO para login)
GOOGLE_CLIENT_ID=<tu-google-client-id>
GOOGLE_CLIENT_SECRET=<tu-google-client-secret>
GOOGLE_REDIRECT_URI=https://tu-dominio-railway.railway.app/api/google/callback
```

**¿Cómo obtener Google OAuth?**
1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto
3. Habilita "Google+ API"
4. Crea credenciales OAuth 2.0
5. Agrega URI autorizado: `https://tu-dominio-railway.railway.app/api/google/callback`
6. Copia Client ID y Client Secret

### 2. Volumen de Persistencia en Railway
La base de datos SQLite necesita persistencia:

1. En Railway, ve a **Settings → Volumes**
2. Crea un volumen: `/data`
3. Esto asegura que los datos persistan entre deployments

**Sin esto:** Los datos se pierden cada vez que Railway reinicia el contenedor.

---

## 🟡 IMPORTANTE - CONFIGURAR PARA FUNCIONALIDAD COMPLETA

### 3. Email (Para notificaciones y reportes programados)

**Opción A: Resend (Recomendado)**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=CRM Pro <noreply@tudominio.com>
```

**Opción B: SMTP (Gmail, Outlook, etc.)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
SMTP_FROM_EMAIL=noreply@tudominio.com
```

**¿Por qué es importante?**
- Reportes programados se envían por email
- Notificaciones de leads/oportunidades
- Confirmaciones de usuario

### 4. Slack Integration (Opcional pero recomendado)
```env
SLACK_CLIENT_ID=xoxb-xxxxxxxxxxxxx
SLACK_CLIENT_SECRET=xxxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxx
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxx
```

**¿Cómo configurar?**
1. Ve a https://api.slack.com/apps
2. Crea una nueva app
3. Habilita "Incoming Webhooks"
4. Copia los tokens

### 5. WhatsApp Integration (Opcional)
```env
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_PHONE_ID=xxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=crm-whatsapp-verify
```

**¿Cómo configurar?**
1. Ve a https://developers.facebook.com
2. Crea una app de WhatsApp Business
3. Obtén el token de acceso
4. Configura el webhook

### 6. Microsoft Teams Integration (Opcional)
```env
TEAMS_CLIENT_ID=xxxxxxxxxxxxx
TEAMS_CLIENT_SECRET=xxxxxxxxxxxxx
TEAMS_BOT_ID=xxxxxxxxxxxxx
TEAMS_BOT_PASSWORD=xxxxxxxxxxxxx
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/xxxxx
APP_URL=https://tu-dominio-railway.railway.app
```

---

## 🟢 RECOMENDADO - PARA PRODUCCIÓN ROBUSTA

### 7. Monitoreo y Logging
```env
# Sentry (Error tracking)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# LogRocket (Session replay)
LOGROCKET_ID=xxxxx/xxxxx
```

### 8. Base de Datos Mejorada
**Actual:** SQLite (bueno para desarrollo, limitado para producción)

**Recomendado para producción:**
- PostgreSQL (mejor escalabilidad)
- Migración: 1-2 horas

**Cambios necesarios:**
```env
# Cambiar de:
DATABASE_URL=file:/data/crm.db

# A:
DATABASE_URL=postgresql://user:password@host:5432/crm_db
```

### 9. CDN para Assets Estáticos
- Cloudflare (recomendado)
- AWS CloudFront
- Bunny CDN

**Beneficios:**
- Carga más rápida
- Menor costo de ancho de banda
- Mejor performance global

### 10. Backup Automático
```bash
# Configurar backup diario de la base de datos
# Railway: Usar Railway Backups
# AWS: Usar AWS Backup
# Manual: Descargar crm.db diariamente
```

---

## 📋 CHECKLIST DE CONFIGURACIÓN

### Antes de Deployar (CRÍTICO)
- [ ] JWT_SECRET configurado
- [ ] GOOGLE_CLIENT_ID configurado
- [ ] GOOGLE_CLIENT_SECRET configurado
- [ ] GOOGLE_REDIRECT_URI configurado correctamente
- [ ] Volumen `/data` creado en Railway
- [ ] NODE_ENV=production
- [ ] APP_URL configurado con tu dominio

### Después de Deployar (IMPORTANTE)
- [ ] Email configurado (Resend o SMTP)
- [ ] Slack integration configurado (opcional)
- [ ] WhatsApp integration configurado (opcional)
- [ ] Monitoreo configurado (Sentry)
- [ ] Backups configurados

### Optimización (RECOMENDADO)
- [ ] CDN configurado
- [ ] Migrar a PostgreSQL
- [ ] SSL/HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] CORS configurado

---

## 🚀 PASOS PARA DEPLOYAR AHORA

### Paso 1: Configurar Variables Críticas en Railway
1. Ve a tu proyecto en Railway
2. Settings → Variables
3. Agrega:
   ```
   JWT_SECRET=<genera-con-openssl-rand-base64-32>
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=file:/data/crm.db
   APP_URL=https://tu-dominio-railway.railway.app
   GOOGLE_CLIENT_ID=<tu-id>
   GOOGLE_CLIENT_SECRET=<tu-secret>
   GOOGLE_REDIRECT_URI=https://tu-dominio-railway.railway.app/api/google/callback
   ```

### Paso 2: Crear Volumen de Persistencia
1. Settings → Volumes
2. Crear volumen: `/data`
3. Guardar

### Paso 3: Deployar
1. Railway debería auto-deployar con el último push
2. O haz click en "Deploy" manualmente
3. Espera 5-10 minutos

### Paso 4: Verificar
1. Abre tu URL de Railway
2. Intenta login con Google
3. Verifica que funciona

### Paso 5: Configurar Email (Opcional pero recomendado)
1. Crea cuenta en Resend.com
2. Obtén API key
3. Agrega a Railway variables:
   ```
   RESEND_API_KEY=re_xxxxx
   FROM_EMAIL=CRM Pro <noreply@tudominio.com>
   ```

---

## 🔧 GENERAR JWT_SECRET

En tu terminal local:
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copia el resultado y úsalo como JWT_SECRET.

---

## 📊 RESUMEN DE VARIABLES

| Variable | Requerido | Dónde obtener |
|----------|-----------|---------------|
| JWT_SECRET | ✅ | Generar con openssl |
| NODE_ENV | ✅ | Usar "production" |
| DATABASE_URL | ✅ | file:/data/crm.db |
| APP_URL | ✅ | Tu URL de Railway |
| GOOGLE_CLIENT_ID | ✅ | Google Cloud Console |
| GOOGLE_CLIENT_SECRET | ✅ | Google Cloud Console |
| GOOGLE_REDIRECT_URI | ✅ | Tu URL + /api/google/callback |
| RESEND_API_KEY | ⚠️ | Resend.com |
| SLACK_CLIENT_ID | ⚠️ | Slack API |
| WHATSAPP_TOKEN | ⚠️ | Facebook Developers |
| TEAMS_CLIENT_ID | ⚠️ | Azure Portal |

---

## ⚠️ PROBLEMAS COMUNES

### "Login no funciona"
**Causa:** GOOGLE_CLIENT_ID o GOOGLE_REDIRECT_URI incorrectos
**Solución:** Verifica en Google Cloud Console que el URI autorizado sea exacto

### "Base de datos se pierde después de restart"
**Causa:** No hay volumen de persistencia
**Solución:** Crear volumen `/data` en Railway

### "Reportes no se envían por email"
**Causa:** RESEND_API_KEY no configurado
**Solución:** Configurar email (Resend o SMTP)

### "Slack integration no funciona"
**Causa:** Tokens de Slack incorrectos
**Solución:** Verificar en Slack API dashboard

---

## 📈 PRÓXIMOS PASOS DESPUÉS DE DEPLOYAR

### Semana 1
- [ ] Monitorear logs en Railway
- [ ] Probar todas las características
- [ ] Recopilar feedback de usuarios
- [ ] Arreglar bugs encontrados

### Semana 2-4
- [ ] Configurar monitoreo (Sentry)
- [ ] Configurar backups automáticos
- [ ] Optimizar performance
- [ ] Agregar más integraciones

### Mes 2-3
- [ ] Migrar a PostgreSQL
- [ ] Configurar CDN
- [ ] Implementar nuevas características
- [ ] Escalar infraestructura

---

## 🎯 CONCLUSIÓN

**Para deployar AHORA:**
1. Configura las 7 variables críticas en Railway
2. Crea el volumen `/data`
3. Haz deploy
4. Prueba login con Google

**Después de deployar:**
1. Configura email (Resend)
2. Configura Slack (opcional)
3. Configura monitoreo (Sentry)
4. Configura backups

**El código está listo. Solo falta la configuración.** 🚀

---

**¿Necesitas ayuda con alguna configuración específica?**
