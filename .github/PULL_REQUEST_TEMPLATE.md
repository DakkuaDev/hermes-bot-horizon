name: 📦 Pull Request
description: Envía tus cambios a Bot Horizon
title: "[feat/fix] - Descripción corta"
body:
  - type: textarea
    id: summary
    attributes:
      label: Resumen
      description: Qué cambia y por qué
    validations:
      required: true
  - type: textarea
    id: testing
    attributes:
      label: Cómo lo probé
      description: Tests ejecutados, capturas de antes/después
    validations:
      required: true
  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: "El plugin sigue en un único `plugin.js` (si aplica)"
        - label: "Sin datos personales ni hardcodeados"
        - label: "`node --check` pasa"
        - label: "Tests del backend pasan"
    validations:
      required: true
