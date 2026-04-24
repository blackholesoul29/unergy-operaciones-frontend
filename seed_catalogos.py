"""
seeds/seed_catalogos.py
Siembra los catálogos de fallas con los datos reales del Excel.
Ejecutar: python seeds/seed_catalogos.py

Catálogos incluidos:
  - 5 categorías
  - 43 tipos de falla (con códigos reales)
  - 4 estados
  - 3 prioridades
  - 12 tipos de resolución
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.fallas import (
    FallaCatCategoria, FallaCatTipo, FallaCatEstado,
    FallaCatPrioridad, FallaCatResolucion,
)


# ─── datos ──────────────────────────────────────────────────

CATEGORIAS = [
    {"codigo": "1", "etiqueta": "Fallas de Medición",                    "icono": "📡", "color_hex": "#3B82F6", "orden": 1},
    {"codigo": "2", "etiqueta": "Fallas Eléctricas",                     "icono": "⚡", "color_hex": "#F59E0B", "orden": 2},
    {"codigo": "3", "etiqueta": "Fallas por Eventos Adversos",           "icono": "🌪", "color_hex": "#EF4444", "orden": 3},
    {"codigo": "4", "etiqueta": "Fallos por Desgaste / Degradación",     "icono": "🔧", "color_hex": "#8B5CF6", "orden": 4},
    {"codigo": "5", "etiqueta": "Fallas Civiles / Estructurales",        "icono": "🏗",  "color_hex": "#6B7280", "orden": 5},
    {"codigo": "9", "etiqueta": "Sin Suministro Eléctrico en el Proyecto","icono": "🔌", "color_hex": "#EC4899", "orden": 6},
    {"codigo": "10","etiqueta": "Personalizadas",                         "icono": "⚙",  "color_hex": "#14B8A6", "orden": 7},
]

# codigo → (categoria_codigo, etiqueta, causa_comun, accion_sugerida)
TIPOS = [
    ("1.1",  "1", "Pérdida de comunicación de inversores",
     "Pérdida del enlace de datos entre el inversor y el datalogger/SCADA.",
     "Verificar conectividad de red, reiniciar datalogger, revisar configuración de comunicación RS485/Modbus."),
    ("1.2",  "1", "Pérdida de comunicación de medidor bidireccional principal",
     "Fallo en la comunicación del medidor bidireccional con el sistema de monitoreo.",
     "Verificar cableado RS485, configuración del medidor, revisar dirección Modbus."),
    ("1.3",  "1", "Módem dañado",
     "El módem de comunicación del proyecto presenta fallo hardware.",
     "Reiniciar módem, verificar SIM/señal, reemplazar si persiste."),
    ("1.4",  "1", "Medidor dañado",
     "El medidor bidireccional presenta fallo de medición o hardware.",
     "Solicitar revisión del OR, tramitar reemplazo del medidor."),
    ("1.5",  "1", "PT o CT mal instalado / dañado",
     "Transformador de potencial o corriente con instalación incorrecta o daño físico.",
     "Revisar conexiones del PT/CT, verificar relación de transformación, reemplazar si necesario."),
    ("1.6",  "1", "Lecturas inconsistentes del medidor bidireccional",
     "El medidor registra valores anómalos que no corresponden a la generación real.",
     "Comparar con lectura del inversor, solicitar calibración al OR."),
    ("1.7",  "1", "PT o CT dañado",
     "Transformador de corriente o tensión dañado.",
     "Reemplazar componente afectado, verificar medición posterior."),
    ("1.9",  "1", "Sensor de irradiancia dañado o descalibrado",
     "El sensor piranométrico entrega lecturas erróneas o nulas.",
     "Verificar conexión del sensor, limpiar superficie, calibrar o reemplazar."),
    ("1.11", "1", "Falla en plataforma de monitoreo / SCADA",
     "La plataforma de monitoreo no muestra datos o presenta errores.",
     "Verificar conectividad del servidor, reiniciar servicios de comunicación."),
    ("2.0",  "2", "Desconexión del proyecto sin causa identificada",
     "El proyecto presenta desconexión sin alarma o causa aparente.",
     "Revisar log de eventos del inversor, verificar suministro de red, inspección en sitio."),
    ("2.1",  "2", "Pérdida de red eléctrica (utility)",
     "El operador de red interrumpió el suministro eléctrico.",
     "Contactar al OR para confirmar interrupción y tiempo estimado de restablecimiento."),
    ("2.2",  "2", "Sobrevoltaje o desbalance",
     "La tensión de la red supera los límites de operación del inversor.",
     "Verificar tensión en bornes del inversor, reportar al OR si es problema de la red."),
    ("2.3",  "2", "Baja tensión (Relé o inversor)",
     "La tensión de red cae por debajo del umbral mínimo de operación.",
     "Verificar tensión en bornes, revisar relé de protección, reportar al OR."),
    ("2.5",  "2", "Falla de transformador de servicios auxiliares (baja tensión)",
     "El transformador de servicios auxiliares presenta fallo.",
     "Inspección en sitio, verificar tensión de salida, tramitar reemplazo si necesario."),
    ("2.8",  "2", "Falla de inversor",
     "El inversor presenta falla que impide su operación normal.",
     "Revisar alarmas del inversor, reinicio remoto, si persiste solicitar visita técnica."),
    ("2.9",  "2", "Falla de resistencia de aislamiento (IR) en strings o cableado DC",
     "Baja resistencia de aislamiento detectada en strings o cableado.",
     "Localizar string o cable afectado con megóhmetro, reparar o reemplazar sección dañada."),
    ("2.11", "2", "Tracker no opera correctamente",
     "El sistema de seguimiento solar no sigue la trayectoria del sol correctamente.",
     "Verificar comunicación del tracker, revisar mecanismo físico, actualizar firmware."),
    ("2.14", "2", "Inversor no responde",
     "El inversor no responde a comandos remotos ni locales.",
     "Intentar reinicio remoto, verificar alimentación del inversor, visita técnica si persiste."),
    ("2.15", "2", "Disparo del totalizador por sobrecorriente",
     "El interruptor general dispara por exceso de corriente.",
     "Verificar causa de sobrecorriente, revisar configuración de protecciones, reactivar con precaución."),
    ("2.17", "2", "Desconexión por mantenimiento",
     "El proyecto fue desconectado por actividad de mantenimiento programado.",
     "Verificar que el mantenimiento fue notificado y registrar tiempo fuera de servicio."),
    ("2.18", "2", "Disparo del totalizador por sobretensión en AC",
     "El interruptor general dispara por sobretensión en AC.",
     "Verificar tensión de red, ajustar parámetros de protección si corresponde."),
    ("2.19", "2", "Red inestable",
     "La red eléctrica presenta variaciones frecuentes de tensión o frecuencia.",
     "Registrar eventos, reportar al OR con evidencias, evaluar instalación de protecciones adicionales."),
    ("2.25", "2", "Totalizador disparado sin causa aparente (falsa operación)",
     "El totalizador dispara sin justificación técnica aparente.",
     "Revisar ajustes de la protección, verificar parámetros de coordinación, contactar fabricante."),
    ("3.1",  "3", "Incendio",
     "Incendio en instalaciones del proyecto.",
     "Activar protocolo de emergencia, contactar bomberos, preservar evidencias para seguro."),
    ("3.2",  "3", "Descarga atmosférica (rayo)",
     "Un rayo causó daños en el sistema.",
     "Inspección completa de equipos, revisar pararrayos y puestas a tierra, reemplazar componentes dañados."),
    ("3.3",  "3", "Inundación",
     "Inundación afecta las instalaciones del proyecto.",
     "Verificar estado de equipos una vez retirada el agua, inspección de aislamiento antes de reconectar."),
    ("3.7",  "3", "Granizo",
     "Granizo causó daños en módulos fotovoltaicos.",
     "Inspección visual de módulos, prueba de aislamiento, documentar para reclamación de seguro."),
    ("3.8",  "3", "Vandalismo / Robo de equipos",
     "Vandalismo o robo de componentes del sistema.",
     "Reportar a autoridades, documentar con fotos, tramitar reposición por seguro."),
    ("4.1",  "4", "Panel quebrado o con fisura en vidrio",
     "Módulo fotovoltaico con vidrio fracturado o fisura visible.",
     "Documentar con fotos, verificar si genera arco, reemplazar módulo afectado."),
    ("4.4",  "4", "Tracker en mal estado (desgaste mecánico)",
     "Mecanismo del tracker con desgaste que afecta el seguimiento.",
     "Lubricación preventiva, reemplazo de piezas desgastadas, ajuste de actuadores."),
    ("4.5",  "4", "Módulo con degradación acelerada (por debajo de garantía)",
     "Módulo presenta degradación de potencia mayor a la garantizada.",
     "Curva IV del módulo, documentar para reclamación de garantía al fabricante."),
    ("4.6",  "4", "Inversor con derating o eficiencia reducida",
     "El inversor opera por debajo de su eficiencia nominal.",
     "Revisar temperatura de operación, limpieza de filtros, actualizar firmware."),
    ("4.8",  "4", "Corrosión de conectores MC4 o terminales",
     "Conectores MC4 o terminales presentan corrosión que aumenta resistencia.",
     "Reemplazar conectores corroídos, verificar par de apriete, aplicar sellante si aplica."),
    ("4.13", "4", "Obstrucción de filtros de aire del inversor",
     "Los filtros del inversor están obstruidos reduciendo la refrigeración.",
     "Limpieza de filtros, verificar temperatura de operación post-limpieza."),
    ("5.1",  "5", "No hay suministro eléctrico",
     "El proyecto no tiene suministro de la red eléctrica.",
     "Verificar con el OR el estado del servicio, registrar tiempo de interrupción."),
    ("5.2",  "5", "No hay suministro eléctrico",
     "Ausencia de suministro eléctrico en la zona.",
     "Coordinar con OR para restablecimiento, notificar a cliente."),
    ("5.3",  "5", "Desconexión (No hay suministro)",
     "Desconexión por falta de suministro de la red.",
     "Verificar con OR, registrar hora de inicio y fin del evento."),
    ("5.6",  "5", "No hay suministro eléctrico",
     "Sin suministro eléctrico — causa por confirmar.",
     "Contactar OR, verificar en sitio si aplica."),
    ("5.7",  "5", "Desconexión del sistema",
     "El sistema se desconectó de la red.",
     "Verificar causa de desconexión, revisar protecciones."),
    ("5.8",  "5", "Desconexión del proyecto",
     "El proyecto está desconectado.",
     "Inspección en sitio para determinar causa, revisar estado de protecciones."),
    ("9.0",  "9", "Sin suministro eléctrico – causa no identificada",
     "El proyecto no tiene suministro y la causa no está identificada.",
     "Inspección en sitio, contactar OR, revisar log de eventos."),
    ("9.8",  "9", "Sin suministro por mantenimiento programado del OR (ventana de mantenimiento)",
     "El OR realizó mantenimiento programado que interrumpió el suministro.",
     "Verificar notificación previa del OR, registrar el evento en bitácora."),
    ("10.0", "10","Personalizada",
     "Falla personalizada no catalogada.",
     "Describir en el campo de descripción adicional."),
]

ESTADOS = [
    {"codigo": "activa",      "etiqueta": "Activa",       "color_hex": "#EF4444", "icono": "🔴", "es_terminal": False, "orden": 1},
    {"codigo": "en_revision", "etiqueta": "En Revisión",  "color_hex": "#F59E0B", "icono": "🟡", "es_terminal": False, "orden": 2},
    {"codigo": "programada",  "etiqueta": "Programada",   "color_hex": "#3B82F6", "icono": "🔵", "es_terminal": False, "orden": 3},
    {"codigo": "terminada",   "etiqueta": "Terminada",    "color_hex": "#10B981", "icono": "🟢", "es_terminal": True,  "orden": 4},
]

PRIORIDADES = [
    {"codigo": "critica", "etiqueta": "Crítica", "color_hex": "#DC2626", "nivel": 1, "sla_horas_respuesta": 48},
    {"codigo": "alta",    "etiqueta": "Alta",    "color_hex": "#F59E0B", "nivel": 2, "sla_horas_respuesta": 72},
    {"codigo": "media",   "etiqueta": "Media",   "color_hex": "#3B82F6", "nivel": 3, "sla_horas_respuesta": 96},
    {"codigo": "baja",    "etiqueta": "Baja",    "color_hex": "#6B7280", "nivel": 4, "sla_horas_respuesta": None},
]

RESOLUCIONES = [
    "Actualización de firmware del inversor",
    "Actualización de firmware del reconectador",
    "Ajuste de curvas de coordinación de relés",
    "Ajuste y apriete de conexiones eléctricas",
    "Intervención de operador de red",
    "Intervención del operador de red (OR)",
    "Reemplazo de componente",
    "Reemplazo de inversor",
    "Reemplazo de medidor bidireccional",
    "Reinicio remoto",
    "Reinicio remoto de inversor",
    "Reparación completa en sitio",
]


# ─── seed ───────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        print("🌱 Seeding catálogos de fallas...")

        # Categorías
        cat_map = {}
        for c in CATEGORIAS:
            obj = db.query(FallaCatCategoria).filter_by(codigo=c["codigo"]).first()
            if not obj:
                obj = FallaCatCategoria(**c)
                db.add(obj)
                db.flush()
                print(f"  ✅ Categoría {c['codigo']}: {c['etiqueta']}")
            cat_map[c["codigo"]] = obj.id
        db.commit()

        # Tipos
        for t in TIPOS:
            codigo, cat_code, etiqueta, causa, accion = t
            obj = db.query(FallaCatTipo).filter_by(codigo=codigo).first()
            if not obj:
                obj = FallaCatTipo(
                    codigo=codigo,
                    categoria_id=cat_map[cat_code],
                    etiqueta=etiqueta,
                    causa_comun=causa,
                    accion_sugerida=accion,
                )
                db.add(obj)
        db.commit()
        print(f"  ✅ {len(TIPOS)} tipos de falla cargados")

        # Estados
        for e in ESTADOS:
            if not db.query(FallaCatEstado).filter_by(codigo=e["codigo"]).first():
                db.add(FallaCatEstado(**e))
        db.commit()
        print(f"  ✅ {len(ESTADOS)} estados cargados")

        # Prioridades
        for p in PRIORIDADES:
            if not db.query(FallaCatPrioridad).filter_by(codigo=p["codigo"]).first():
                db.add(FallaCatPrioridad(**p))
        db.commit()
        print(f"  ✅ {len(PRIORIDADES)} prioridades cargadas")

        # Resoluciones
        for r in RESOLUCIONES:
            codigo = r.lower().replace(" ", "_").replace("/", "_")[:60]
            if not db.query(FallaCatResolucion).filter_by(codigo=codigo).first():
                db.add(FallaCatResolucion(codigo=codigo, etiqueta=r))
        db.commit()
        print(f"  ✅ {len(RESOLUCIONES)} tipos de resolución cargados")

        print("\n✅ Seed completado exitosamente.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error en seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
