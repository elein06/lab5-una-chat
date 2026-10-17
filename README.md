# UNA Chat — Laboratorio 5

Chat en tiempo real con Node.js, Express y Socket.IO. Los mensajes se validan en el
servidor con `libs/unalib.js`: las URLs de imágenes se muestran como imagen, las de
video (mp4, webm, ogg, mov y YouTube) como reproductor, y cualquier intento de
inyección de scripts se escapa.

## Requisitos

- Node.js 20.19 o superior

## Instalación

```
npm install
npx playwright install chromium
```

## Ejecutar el chat

```
npm start
```

Abrir http://localhost:3000

## Suites de pruebas

| Suite | Herramienta | Carpeta | Comando |
|---|---|---|---|
| Unitarias | Mocha | `test/` | `npm test` |
| Integración | Jest + Supertest + socket.io-client | `tests/integration/` | `npm run test:integration` |
| End-to-end | Playwright | `tests/e2e/` | `npm run test:e2e` |

Para ejecutar las tres: `npm run test:all`

Comando de integración indicado en el laboratorio:

```
npx jest tests/integration --runInBand --env=node
```

Playwright levanta el servidor automáticamente en el puerto 3100 (`playwright.config.js`).
Jest ignora `tests/e2e` mediante `testPathIgnorePatterns`.
