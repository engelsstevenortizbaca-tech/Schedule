 Sistema de Generación Automática de Horarios

Proyecto académico para el diseño e implementación de una base de datos relacional en MySQL que permite gestionar y generar horarios de clases en una institución de educación secundaria, evitando choques de docentes, aulas y grupos mediante restricciones de integridad.

---

 Descripción del Proyecto

El sistema modela las entidades principales del entorno académico (coordinaciones, carreras, semestres, turnos, parciales, bloques horarios, aulas, docentes, asignaturas, grupos y horarios) y define relaciones entre ellas para permitir la planificación automatizada de clases.

El objetivo principal es reducir errores humanos en la asignación de horarios y sentar las bases para una futura aplicación web o de escritorio.

---

 Objetivos

- Diseñar un modelo entidad-relación (ER) para la planificación de horarios.
- Implementar la base de datos en MySQL.
- Garantizar integridad referencial mediante claves foráneas.
- Evitar choques de horarios (docente, aula y grupo).
- Proveer consultas SQL para asignación y visualización de horarios.
- Facilitar futuras extensiones del sistema (interfaz web, reportes).

---

 Estructura de la Base de Datos

Tablas principales:

- `coordinacion`
- `turno`
- `semestre`
- `parcial`
- `bloque_horario`
- `aula`
- `carrera`
- `asignatura`
- `docente`
- `grupo`
- `horario`

Relaciones clave:

- `carrera.id_coordinacion → coordinacion.id_coordinacion`
- `grupo.id_carrera → carrera.id_carrera`
- `grupo.id_semestre → semestre.id_semestre`
- `bloque_horario.id_turno → turno.id_turno`
- `parcial.id_turno → turno.id_turno`
- `horario.id_grupo → grupo.id_grupo`
- `horario.id_asignatura → asignatura.id_asignatura`
- `horario.id_docente → docente.id_docente`
- `horario.id_aula → aula.id_aula`
- `horario.id_bloque → bloque_horario.id_bloque`
- `horario.id_parcial → parcial.id_parcial`

---

 Reglas de Integridad

- Un docente no puede estar en dos clases en el mismo bloque y fecha.
- Un aula no puede asignarse a dos clases en el mismo bloque y fecha.
- Un grupo no puede tener dos clases en el mismo bloque y fecha.
- Las relaciones entre tablas se validan con claves foráneas (FOREIGN KEY).
- El motor de la base de datos debe ser InnoDB para aplicar las restricciones.

---

 Requisitos

- MySQL 8.x o superior  
- phpMyAdmin (opcional)  
- Motor InnoDB habilitado  

---

 Instalación

1. Crear la base de datos:

```sql
CREATE DATABASE horario;
USE horario;
