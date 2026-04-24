"""
models/fallas.py
Modelos SQLAlchemy — Módulo de Monitoreo / Bitácora de Fallas
Unergy Operaciones · v1.0
"""
import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, Text, Date, Time,
    DateTime, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


# ─────────────────────────────────────────────
#  CATÁLOGOS
# ─────────────────────────────────────────────

class FallaCatCategoria(Base):
    """Categoría raíz de falla  (ej: '1. Fallas de Medición')"""
    __tablename__ = "falla_cat_categoria"

    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo   = Column(String(10),  nullable=False, unique=True)   # "1", "2", …
    etiqueta = Column(String(100), nullable=False)
    icono    = Column(String(10),  nullable=True)
    color_hex= Column(String(7),   nullable=True)
    orden    = Column(Integer,     nullable=False, default=0)
    activa   = Column(Boolean,     nullable=False, default=True)

    tipos    = relationship("FallaCatTipo", back_populates="categoria")


class FallaCatTipo(Base):
    """Tipo específico de falla con su código (ej: '2.8 Falla de inversor')"""
    __tablename__ = "falla_cat_tipo"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    categoria_id  = Column(UUID(as_uuid=True), ForeignKey("falla_cat_categoria.id"), nullable=False)
    codigo        = Column(String(10),  nullable=False, unique=True)   # "2.8"
    etiqueta      = Column(String(150), nullable=False)
    causa_comun   = Column(Text,        nullable=True)
    accion_sugerida = Column(Text,      nullable=True)
    activo        = Column(Boolean,     nullable=False, default=True)

    categoria     = relationship("FallaCatCategoria", back_populates="tipos")
    fallas        = relationship("Falla", back_populates="tipo_falla")


class FallaCatEstado(Base):
    """Estados posibles de una falla"""
    __tablename__ = "falla_cat_estado"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo      = Column(String(30),  nullable=False, unique=True)
    etiqueta    = Column(String(50),  nullable=False)
    color_hex   = Column(String(7),   nullable=True)
    icono       = Column(String(10),  nullable=True)
    es_terminal = Column(Boolean,     nullable=False, default=False)
    orden       = Column(Integer,     nullable=False, default=0)

    fallas      = relationship("Falla", back_populates="estado")


class FallaCatPrioridad(Base):
    """Nivel de prioridad"""
    __tablename__ = "falla_cat_prioridad"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo              = Column(String(20),  nullable=False, unique=True)
    etiqueta            = Column(String(50),  nullable=False)
    color_hex           = Column(String(7),   nullable=True)
    nivel               = Column(Integer,     nullable=False)
    sla_horas_respuesta = Column(Integer,     nullable=True)

    fallas              = relationship("Falla", back_populates="prioridad")


class FallaCatResolucion(Base):
    """Tipo de resolución aplicada"""
    __tablename__ = "falla_cat_resolucion"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo      = Column(String(60),  nullable=False, unique=True)
    etiqueta    = Column(String(150), nullable=False)
    descripcion = Column(Text,        nullable=True)

    fallas      = relationship("Falla", back_populates="tipo_resolucion")


# ─────────────────────────────────────────────
#  FALLA PRINCIPAL
# ─────────────────────────────────────────────

class Falla(Base):
    """Registro principal de falla operativa"""
    __tablename__ = "fallas"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo_interno        = Column(String(20),  nullable=False, unique=True, index=True)

    # Relaciones
    proyecto_id           = Column(UUID(as_uuid=True), ForeignKey("proyectos.id"), nullable=True, index=True)
    tipo_falla_id         = Column(UUID(as_uuid=True), ForeignKey("falla_cat_tipo.id"), nullable=True)
    estado_id             = Column(UUID(as_uuid=True), ForeignKey("falla_cat_estado.id"), nullable=True)
    prioridad_id          = Column(UUID(as_uuid=True), ForeignKey("falla_cat_prioridad.id"), nullable=True)
    tipo_resolucion_id    = Column(UUID(as_uuid=True), ForeignKey("falla_cat_resolucion.id"), nullable=True)
    registrado_por_id     = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    asignado_a_id         = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)

    # Nombre del proyecto como texto (para fallas de proyectos aún no en el sistema)
    proyecto_nombre_raw   = Column(String(150), nullable=True)

    # Identificación
    descripcion           = Column(Text,        nullable=True)
    fecha_identificacion  = Column(Date,        nullable=True)
    hora_identificacion   = Column(Time,        nullable=True)
    fecha_ocurrencia      = Column(DateTime,    nullable=True)

    # Resolución
    causa_raiz            = Column(Text,        nullable=True)
    accion_correctiva     = Column(Text,        nullable=True)
    fecha_resolucion      = Column(DateTime,    nullable=True)
    energia_perdida_kwh   = Column(Float,       nullable=True)

    # SLA
    sla_limite_dias       = Column(Integer,     nullable=True)
    dias_abierta          = Column(Integer,     nullable=True)
    sla_cumplido          = Column(Boolean,     nullable=True)

    # Autoría y auditoría
    centinela             = Column(String(150), nullable=True)   # campo heredado del Excel
    fecha_registro        = Column(DateTime,    nullable=False, default=datetime.utcnow)
    ultima_actualizacion  = Column(DateTime,    nullable=True,  onupdate=datetime.utcnow)

    # Relaciones ORM
    proyecto              = relationship("Proyecto",          foreign_keys=[proyecto_id])
    tipo_falla            = relationship("FallaCatTipo",      back_populates="fallas")
    estado                = relationship("FallaCatEstado",    back_populates="fallas")
    prioridad             = relationship("FallaCatPrioridad", back_populates="fallas")
    tipo_resolucion       = relationship("FallaCatResolucion",back_populates="fallas")
    registrado_por        = relationship("Usuario",           foreign_keys=[registrado_por_id])
    asignado_a            = relationship("Usuario",           foreign_keys=[asignado_a_id])
    seguimientos          = relationship("FallaSeguimiento",  back_populates="falla",
                                         cascade="all, delete-orphan", order_by="FallaSeguimiento.created_at")
    fotos                 = relationship("FallaFoto",         back_populates="falla",
                                         cascade="all, delete-orphan", order_by="FallaFoto.orden")

    __table_args__ = (
        Index("ix_fallas_proyecto_estado", "proyecto_id", "estado_id"),
        Index("ix_fallas_fecha_registro",  "fecha_registro"),
    )


# ─────────────────────────────────────────────
#  SEGUIMIENTO
# ─────────────────────────────────────────────

class FallaSeguimiento(Base):
    """Línea de tiempo de actualizaciones de una falla"""
    __tablename__ = "falla_seguimientos"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    falla_id        = Column(UUID(as_uuid=True), ForeignKey("fallas.id", ondelete="CASCADE"),
                             nullable=False, index=True)
    usuario_id      = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    nota            = Column(Text,       nullable=False)
    estado_nuevo    = Column(String(30), nullable=True)
    prioridad_nueva = Column(String(30), nullable=True)
    created_at      = Column(DateTime,   nullable=False, default=datetime.utcnow)

    falla           = relationship("Falla",   back_populates="seguimientos")
    usuario         = relationship("Usuario", foreign_keys=[usuario_id])


# ─────────────────────────────────────────────
#  FOTO
# ─────────────────────────────────────────────

class FallaFoto(Base):
    """Foto o documento adjunto a una falla"""
    __tablename__ = "falla_fotos"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    falla_id        = Column(UUID(as_uuid=True), ForeignKey("fallas.id", ondelete="CASCADE"),
                             nullable=False, index=True)
    subido_por_id   = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)

    # Drive o Railway Storage
    url             = Column(String(500), nullable=False)          # URL pública o de Drive
    file_id_drive   = Column(String(100), nullable=True, unique=True)  # ID de Google Drive (si aplica)
    nombre_archivo  = Column(String(200), nullable=True)
    etapa           = Column(String(50),  nullable=True)           # "inicio", "proceso", "cierre"
    orden           = Column(Integer,     nullable=False, default=0)
    tamano_bytes    = Column(Integer,     nullable=True)
    uploaded_at     = Column(DateTime,    nullable=False, default=datetime.utcnow)

    falla           = relationship("Falla",   back_populates="fotos")
    subido_por      = relationship("Usuario", foreign_keys=[subido_por_id])
