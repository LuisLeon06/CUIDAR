# CUIDAR — La inteligencia de cuidar lo que importa

Plataforma argentina de IA para analizar y predecir la conservación de frutas y verduras.
React 19 + Vite + Tailwind 4 (frontend) y Express (backend / API).

## Desarrollo local

**Requisitos:** Node.js 18 o superior.

```bash
npm install
npm run dev
```

La app queda en http://localhost:3000 (frontend + API en el mismo servidor).

Opcional: creá un archivo `.env` con tu clave de Gemini para el análisis con IA real:

```
GEMINI_API_KEY="tu_clave"
```

Sin clave, la app usa el motor de predicción local.

## Build de producción

```bash
npm run build
```

Genera:

- `dist/` → el sitio web estático (HTML, JS, CSS, PWA, `.htaccess`).
- `server-dist/server.js` → el servidor Express empaquetado (API + sirve `dist/`).

## Subir a Hostinger

### Opción A — Hosting compartido (estático, `public_html`)

1. Ejecutá `npm run build`.
2. Subí **el contenido** de la carpeta `dist/` (no la carpeta en sí) a `public_html`
   con el Administrador de archivos o FTP. Incluí el archivo oculto `.htaccess`.
3. Activá SSL (HTTPS) en hPanel: la cámara y la PWA lo necesitan.

En este modo no hay servidor Node: la app usa sus respaldos locales
(predicción local, clima directo desde Open-Meteo, inventario en el navegador).

### Opción B — Hostinger con Node.js (planes Business / Cloud / VPS)

1. Conectá este repositorio de GitHub en hPanel → *Websites* → *Node.js*.
2. Configuración:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Node version: 18 o superior
3. (Opcional) agregá la variable de entorno `GEMINI_API_KEY`.

El servidor usa el puerto que define Hostinger (`PORT`) y sirve la API completa.

## Licencia

Copyright © 2026 Luis Emanuel Leon Arancibia. Todos los derechos reservados.

Este repositorio es público solo para su visualización y la evaluación de la hackatón. No se permite usar, copiar, modificar, distribuir ni desplegar el código, ni usar la marca "CUIDAR", sin autorización escrita. Ver [LICENSE](./LICENSE).
