# Contributing to Bot Horizon

¡Gracias por querer contribuir! 🙌 Bot Horizon es un proyecto **open source** con un flujo claro para que todo el código sea revisado antes de entrar.

## Cómo contribuir

### 1. Reportar errores 🐛

Abre un **[Issue](https://github.com/DakkuaDev/hermes-bot-horizon/issues/new?template=bug_report.yml)** con:

- Pasos para reproducir
- Qué esperabas que pasara vs. qué pasó
- Captura de pantalla si aplica
- Versión de Hermes Desktop y sistema operativo

### 2. Sugerir mejoras 💡

Abre un **[Issue](https://github.com/DakkuaDev/hermes-bot-horizon/issues/new?template=feature_request.yml)** describiendo la mejora y por qué la quieres.

### 3. Enviar código 🧑‍💻

1. **Fork** el repo
2. Crea una rama: `git checkout -b feat/nombre-corto` o `fix/nombre-corto`
3. Haz tus cambios (¡con comentarios claros!)
4. **Prueba** que el plugin sigue funcionando (mira abajo)
5. Abre un **Pull Request** hacia `main` describiendo qué cambia y por qué

## Reglas de revisión 🔒

- **Nada se mergea a `main` sin un PR revisado** por el mantenedor
- El PR debe pasar los checks automáticos de CI
- Los cambios de UI deben incluir captura de antes/después
- Mantén el plugin **en un único archivo** `plugin.js` siempre que sea posible (instalación simple)
- **Sin datos personales ni hardcodeados**: el plugin debe funcionar para cualquiera con sus propios bots

## Tests rápidos

```bash
# Verifica la sintaxis del frontend
node --check desktop/bot-horizon/plugin.js

# Tests del backend (ledger, streak, pets)
python3 tests/bv_ledger_test.py
python3 tests/bv_streak_test.py
python3 tests/bv_pets_test.py
```

## Atribución

Al modificar o distribuir, **mantén la atribución al autor original** (ver [LICENSE](LICENSE)).
