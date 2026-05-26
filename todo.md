# Susuerte - Actualización de Datos - TODO

## Features Completadas
- [x] Actualización de características (db, server, user)
- [x] Formulario Susuerte con rastreo de eventos
- [x] Autenticación OAuth de Manus
- [x] Tabla de base de datos para registros (susuert_registros)
- [x] Helpers de base de datos para CRUD de registros
- [x] Procedimientos tRPC para crear y obtener registros
- [x] Integración del formulario con base de datos
- [x] Panel de administración que muestra todos los registros
- [x] Acceso protegido al panel (solo admin)
- [x] Visualización de registros desde cualquier dispositivo
- [x] Edición de estado de registros desde el panel (pendiente, verificado, rechazado)

- [x] Búsqueda de registros por nombre, email o documento
- [x] Filtrado de registros por estado (pendiente, verificado, rechazado)

- [x] Verificación de email - Sistema de tokens con expiración de 24 horas

- [x] Exportación de datos a CSV desde el panel de administración
- [x] Mejorar generación de tokens (usar crypto en lugar de Math.random)

## Features Pendientes (Prioridad Alta)
- [x] Agregar tests para procedimientos de verificación (requestEmailVerification, verifyEmail)
- [x] Agregar tests para exportación CSV (tests de helpers de base de datos)

## Features Completadas (Fase 2)
- [x] Exportación de datos a CSV desde el panel de administración
- [x] Mejorar generación de tokens (usar crypto en lugar de Math.random)
- [x] Agregar tests para procedimientos de verificación
- [x] Agregar tests para exportación CSV
- [x] Refactorizar exportación CSV en utilidad testeable

## Features Completadas (Fase 3)
- [x] Agregar UI para verificación de email
- [x] Página /verify-email con soporte para token en URL
- [x] Formulario para solicitar enlace de verificación
- [x] Manejo de estados (idle, loading, success, error, token_generated)
- [x] Mostrar token generado con opción de copiar enlace
- [x] Feedback veraz en la UI (no afirma envío si solo genera token)

## Features Pendientes (Prioridad Media)
- [ ] Implementar envío real de emails de verificación
