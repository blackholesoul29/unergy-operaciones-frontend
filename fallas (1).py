"""
schemas/fallas.py
Pydantic v2 schemas — Módulo de Monitoreo / Bitácora de Fallas
Unergy Operaciones · v1.0
"""
from __future__ import annotations
from datetime import datetime, date, time
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# ─────────────────────────────────────────────
#  CATÁLOGOS
# ─────────────────────────────────────────────

class CategoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    codigo: str
    etiqueta: str
    icono: Optional[str]
    color_hex: Optional[str]
    orden: int
    activa: bool


class TipoFallaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    categoria_id: UUID
    codigo: str
    etiqueta: str
    causa_comun: Optional[str]
    accion_sugerida: Optional[str]
    activo: bool
    categoria: Optional[CategoriaOut]


class EstadoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    codigo: str
    etiqueta: str
    color_hex: Optional[str]
    icono: Optional[str]
    es_terminal: bool
    orden: int


class PrioridadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    codigo: str
    etiqueta: str
    color_hex: Optional[str]
    nivel: int
    sla_horas_respuesta: Optional[int]


class ResolucionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    codigo: str
    etiqueta: str
    descripcion: Optional[str]


# ─────────────────────────────────────────────
#  SEGUIMIENTO
# ─────────────────────────────────────────────

class SeguimientoCreate(BaseModel):
    nota: str = Field(..., min_length=1, max_length=2000)
    estado_nuevo: Optional[str] = None
    prioridad_nueva: Optional[str] = None


class SeguimientoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    falla_id: UUID
    nota: str
    estado_nuevo: Optional[str]
    prioridad_nueva: Optional[str]
    created_at: datetime
    usuario_nombre: Optional[str] = None  # campo computado

    @classmethod
    def from_orm_with_usuario(cls, obj):
        d = cls.model_validate(obj)
        if obj.usuario:
            d.usuario_nombre = obj.usuario.nombre
        return d


# ─────────────────────────────────────────────
#  FOTO
# ─────────────────────────────────────────────

class FotoCreate(BaseModel):
    url: str = Field(..., max_length=500)
    file_id_drive: Optional[str] = None
    nombre_archivo: Optional[str] = None
    etapa: Optional[str] = None          # "inicio" | "proceso" | "cierre"
    orden: int = 0


class FotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    falla_id: UUID
    url: str
    file_id_drive: Optional[str]
    nombre_archivo: Optional[str]
    etapa: Optional[str]
    orden: int
    uploaded_at: datetime


# ─────────────────────────────────────────────
#  PROYECTO RESUMEN (para embeber en falla)
# ─────────────────────────────────────────────

class ProyectoResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    sub_project: str
    nombre_display: Optional[str]
    nombre_clientes: Optional[str]
    municipio: Optional[str]


# ─────────────────────────────────────────────
#  FALLA
# ─────────────────────────────────────────────

class FallaCreate(BaseModel):
    proyecto_id: Optional[UUID] = None
    proyecto_nombre_raw: Optional[str] = None       # si el proyecto no está en la DB aún
    tipo_falla_id: Optional[UUID] = None
    estado_id: Optional[UUID] = None
    prioridad_id: Optional[UUID] = None
    tipo_resolucion_id: Optional[UUID] = None
    asignado_a_id: Optional[UUID] = None
    descripcion: Optional[str] = None
    fecha_identificacion: Optional[date] = None
    hora_identificacion: Optional[time] = None
    fecha_ocurrencia: Optional[datetime] = None
    causa_raiz: Optional[str] = None
    accion_correctiva: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    energia_perdida_kwh: Optional[float] = None
    sla_limite_dias: Optional[int] = None
    nota_inicial: Optional[str] = None             # crea seguimiento inicial automático


class FallaUpdate(BaseModel):
    tipo_falla_id: Optional[UUID] = None
    estado_id: Optional[UUID] = None
    prioridad_id: Optional[UUID] = None
    tipo_resolucion_id: Optional[UUID] = None
    asignado_a_id: Optional[UUID] = None
    descripcion: Optional[str] = None
    fecha_identificacion: Optional[date] = None
    hora_identificacion: Optional[time] = None
    fecha_ocurrencia: Optional[datetime] = None
    causa_raiz: Optional[str] = None
    accion_correctiva: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    energia_perdida_kwh: Optional[float] = None
    sla_limite_dias: Optional[int] = None


class FallaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    codigo_interno: str
    proyecto_id: Optional[UUID]
    proyecto_nombre_raw: Optional[str]
    tipo_falla_id: Optional[UUID]
    estado_id: Optional[UUID]
    prioridad_id: Optional[UUID]
    tipo_resolucion_id: Optional[UUID]
    registrado_por_id: Optional[UUID]
    asignado_a_id: Optional[UUID]
    descripcion: Optional[str]
    fecha_identificacion: Optional[date]
    hora_identificacion: Optional[time]
    fecha_ocurrencia: Optional[datetime]
    causa_raiz: Optional[str]
    accion_correctiva: Optional[str]
    fecha_resolucion: Optional[datetime]
    energia_perdida_kwh: Optional[float]
    sla_limite_dias: Optional[int]
    dias_abierta: Optional[int]
    sla_cumplido: Optional[bool]
    centinela: Optional[str]
    fecha_registro: datetime
    ultima_actualizacion: Optional[datetime]

    # Relaciones expandidas
    proyecto: Optional[ProyectoResumen]
    tipo_falla: Optional[TipoFallaOut]
    estado: Optional[EstadoOut]
    prioridad: Optional[PrioridadOut]
    tipo_resolucion: Optional[ResolucionOut]
    seguimientos: List[SeguimientoOut] = []
    fotos: List[FotoOut] = []


class FallaListItem(BaseModel):
    """Schema ligero para listar fallas en el tablero"""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    codigo_interno: str
    proyecto_id: Optional[UUID]
    proyecto_nombre_raw: Optional[str]
    descripcion: Optional[str]
    fecha_identificacion: Optional[date]
    fecha_ocurrencia: Optional[datetime]
    fecha_resolucion: Optional[datetime]
    dias_abierta: Optional[int]
    sla_cumplido: Optional[bool]
    sla_limite_dias: Optional[int]
    fecha_registro: datetime
    ultima_actualizacion: Optional[datetime]
    tiene_fotos: bool = False

    # Relaciones resumen
    proyecto: Optional[ProyectoResumen]
    tipo_falla: Optional[TipoFallaOut]
    estado: Optional[EstadoOut]
    prioridad: Optional[PrioridadOut]


class FallaListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[FallaListItem]


# ─────────────────────────────────────────────
#  CATALOGS RESPONSE (un solo endpoint)
# ─────────────────────────────────────────────

class CatalogosResponse(BaseModel):
    categorias: List[CategoriaOut]
    tipos: List[TipoFallaOut]
    estados: List[EstadoOut]
    prioridades: List[PrioridadOut]
    resoluciones: List[ResolucionOut]
