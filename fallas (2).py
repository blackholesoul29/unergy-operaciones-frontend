"""
api/v1/fallas.py
Router FastAPI — Módulo de Monitoreo / Bitácora de Fallas
Unergy Operaciones · v1.0
"""
from __future__ import annotations
import uuid, os, shutil
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from app.core.database import get_db
from app.models.fallas import (
    Falla, FallaSeguimiento, FallaFoto,
    FallaCatCategoria, FallaCatTipo, FallaCatEstado,
    FallaCatPrioridad, FallaCatResolucion,
)
from app.schemas.fallas import (
    FallaCreate, FallaUpdate, FallaOut, FallaListItem, FallaListResponse,
    SeguimientoCreate, SeguimientoOut, FotoOut,
    CatalogosResponse, CategoriaOut, TipoFallaOut, EstadoOut,
    PrioridadOut, ResolucionOut,
)

router = APIRouter(prefix="/fallas", tags=["Monitoreo — Fallas"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads/fallas"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_MB = 10


# ─── helpers ────────────────────────────────────────────────

def _next_codigo(db: Session) -> str:
    result = db.query(func.max(Falla.codigo_interno)).scalar()
    if not result:
        return "F-00001"
    try:
        num = int(result.split("-")[1]) + 1
    except (IndexError, ValueError):
        num = 1
    return f"F-{num:05d}"


def _refresh_sla(falla: Falla) -> None:
    if falla.fecha_registro:
        ref = falla.fecha_resolucion or datetime.utcnow()
        falla.dias_abierta = (ref - falla.fecha_registro).days
        if falla.sla_limite_dias is not None:
            falla.sla_cumplido = falla.dias_abierta <= falla.sla_limite_dias


def _load_options(db: Session):
    return (
        joinedload(Falla.proyecto),
        joinedload(Falla.tipo_falla).joinedload(FallaCatTipo.categoria),
        joinedload(Falla.estado),
        joinedload(Falla.prioridad),
        joinedload(Falla.tipo_resolucion),
        joinedload(Falla.registrado_por),
        joinedload(Falla.asignado_a),
        joinedload(Falla.seguimientos).joinedload(FallaSeguimiento.usuario),
        joinedload(Falla.fotos),
    )


# ─── catálogos ──────────────────────────────────────────────

@router.get("/catalogos", response_model=CatalogosResponse,
            summary="Todos los catálogos en una sola llamada")
def get_catalogos(db: Session = Depends(get_db)):
    return CatalogosResponse(
        categorias=db.query(FallaCatCategoria).order_by(FallaCatCategoria.orden).all(),
        tipos=db.query(FallaCatTipo)
               .options(joinedload(FallaCatTipo.categoria))
               .order_by(FallaCatTipo.codigo).all(),
        estados=db.query(FallaCatEstado).order_by(FallaCatEstado.orden).all(),
        prioridades=db.query(FallaCatPrioridad).order_by(FallaCatPrioridad.nivel).all(),
        resoluciones=db.query(FallaCatResolucion).order_by(FallaCatResolucion.etiqueta).all(),
    )


# ─── KPIs ───────────────────────────────────────────────────

@router.get("/stats/resumen", summary="KPIs para el tablero")
def get_stats(proyecto_id: Optional[UUID] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Falla)
    if proyecto_id:
        q = q.filter(Falla.proyecto_id == proyecto_id)

    activas = (q.join(FallaCatEstado, Falla.estado_id == FallaCatEstado.id)
                .filter(FallaCatEstado.es_terminal == False).count())

    en_rev = (q.join(FallaCatEstado, Falla.estado_id == FallaCatEstado.id)
               .filter(FallaCatEstado.codigo == "en_revision").count())

    inicio_mes = date.today().replace(day=1)
    resueltas_mes = (q.join(FallaCatEstado, Falla.estado_id == FallaCatEstado.id)
                      .filter(FallaCatEstado.es_terminal == True,
                              func.date(Falla.fecha_resolucion) >= inicio_mes).count())

    total_cerradas = (q.join(FallaCatEstado, Falla.estado_id == FallaCatEstado.id)
                       .filter(FallaCatEstado.es_terminal == True).count())
    dentro_sla = q.filter(Falla.sla_cumplido == True).count()
    cumplimiento = round(dentro_sla / total_cerradas * 100, 1) if total_cerradas else None

    alerta_7d = (q.join(FallaCatEstado, Falla.estado_id == FallaCatEstado.id)
                  .filter(FallaCatEstado.es_terminal == False,
                          Falla.dias_abierta >= 7).count())

    return {
        "total_activas": activas,
        "en_revision": en_rev,
        "resueltas_mes": resueltas_mes,
        "cumplimiento_sla_pct": cumplimiento,
        "alerta_7_dias": alerta_7d,
    }


# ─── listado ────────────────────────────────────────────────

@router.get("", response_model=FallaListResponse, summary="Listado paginado con filtros")
def list_fallas(
    page:            int            = Query(1, ge=1),
    page_size:       int            = Query(20, ge=1, le=100),
    proyecto_id:     Optional[UUID] = Query(None),
    estado_codigo:   Optional[str]  = Query(None),
    prioridad_codigo:Optional[str]  = Query(None),
    tipo_codigo:     Optional[str]  = Query(None),
    buscar:          Optional[str]  = Query(None),
    solo_activas:    bool           = Query(False),
    solo_alerta:     bool           = Query(False, description="+7 días sin resolver"),
    db: Session = Depends(get_db),
):
    q = (db.query(Falla)
         .options(
             joinedload(Falla.proyecto),
             joinedload(Falla.tipo_falla).joinedload(FallaCatTipo.categoria),
             joinedload(Falla.estado),
             joinedload(Falla.prioridad),
         )
         .order_by(desc(Falla.fecha_registro)))

    if proyecto_id:
        q = q.filter(Falla.proyecto_id == proyecto_id)

    if estado_codigo:
        q = (q.join(FallaCatEstado, Falla.estado_id == FallaCatEstado.id)
               .filter(FallaCatEstado.codigo == estado_codigo))
    elif solo_activas:
        q = (q.join(FallaCatEstado, Falla.estado_id == FallaCatEstado.id)
               .filter(FallaCatEstado.es_terminal == False))

    if prioridad_codigo:
        q = (q.join(FallaCatPrioridad, Falla.prioridad_id == FallaCatPrioridad.id)
               .filter(FallaCatPrioridad.codigo == prioridad_codigo))

    if tipo_codigo:
        q = (q.join(FallaCatTipo, Falla.tipo_falla_id == FallaCatTipo.id)
               .filter(FallaCatTipo.codigo == tipo_codigo))

    if solo_alerta:
        q = q.filter(Falla.dias_abierta >= 7)

    if buscar:
        term = f"%{buscar}%"
        q = q.filter(
            Falla.codigo_interno.ilike(term) |
            Falla.descripcion.ilike(term) |
            Falla.proyecto_nombre_raw.ilike(term)
        )

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()

    # Calcular dias_abierta y tiene_fotos en memoria
    result = []
    for f in items:
        _refresh_sla(f)
        item = FallaListItem.model_validate(f)
        item.tiene_fotos = len(f.fotos) > 0 if hasattr(f, 'fotos') else False
        result.append(item)

    return FallaListResponse(total=total, page=page, page_size=page_size, items=result)


# ─── crear ──────────────────────────────────────────────────

@router.post("", response_model=FallaOut, status_code=status.HTTP_201_CREATED,
             summary="Registrar nueva falla")
def create_falla(body: FallaCreate, db: Session = Depends(get_db)):
    nota_inicial = body.nota_inicial
    data = body.model_dump(exclude={"nota_inicial"})
    falla = Falla(**data, codigo_interno=_next_codigo(db))
    db.add(falla)
    db.flush()

    if nota_inicial:
        seg = FallaSeguimiento(falla_id=falla.id, nota=nota_inicial)
        db.add(seg)

    db.commit()
    db.refresh(falla)
    _refresh_sla(falla)
    db.commit()
    return db.query(Falla).options(*_load_options(db)).filter(Falla.id == falla.id).first()


# ─── detalle ────────────────────────────────────────────────

@router.get("/{falla_id}", response_model=FallaOut, summary="Detalle completo de una falla")
def get_falla(falla_id: UUID, db: Session = Depends(get_db)):
    falla = (db.query(Falla)
               .options(*_load_options(db))
               .filter(Falla.id == falla_id)
               .first())
    if not falla:
        raise HTTPException(status_code=404, detail="Falla no encontrada")
    _refresh_sla(falla)
    return falla


# ─── actualizar ─────────────────────────────────────────────

@router.patch("/{falla_id}", response_model=FallaOut, summary="Actualizar falla")
def update_falla(falla_id: UUID, body: FallaUpdate, db: Session = Depends(get_db)):
    falla = db.query(Falla).filter(Falla.id == falla_id).first()
    if not falla:
        raise HTTPException(status_code=404, detail="Falla no encontrada")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(falla, k, v)

    falla.ultima_actualizacion = datetime.utcnow()
    _refresh_sla(falla)
    db.commit()
    return db.query(Falla).options(*_load_options(db)).filter(Falla.id == falla_id).first()


# ─── eliminar ───────────────────────────────────────────────

@router.delete("/{falla_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar falla (solo admin)")
def delete_falla(falla_id: UUID, db: Session = Depends(get_db)):
    falla = db.query(Falla).filter(Falla.id == falla_id).first()
    if not falla:
        raise HTTPException(status_code=404, detail="Falla no encontrada")
    db.delete(falla)
    db.commit()


# ─── seguimientos ────────────────────────────────────────────

@router.post("/{falla_id}/seguimientos", response_model=SeguimientoOut,
             status_code=status.HTTP_201_CREATED, summary="Agregar nota de seguimiento")
def add_seguimiento(falla_id: UUID, body: SeguimientoCreate, db: Session = Depends(get_db)):
    falla = db.query(Falla).filter(Falla.id == falla_id).first()
    if not falla:
        raise HTTPException(status_code=404, detail="Falla no encontrada")

    seg = FallaSeguimiento(
        falla_id=falla_id,
        nota=body.nota,
        estado_nuevo=body.estado_nuevo,
        prioridad_nueva=body.prioridad_nueva,
    )

    # Actualizar estado si viene en el seguimiento
    if body.estado_nuevo:
        estado = db.query(FallaCatEstado).filter(
            FallaCatEstado.codigo == body.estado_nuevo).first()
        if estado:
            falla.estado_id = estado.id
            if estado.es_terminal:
                falla.fecha_resolucion = datetime.utcnow()
            _refresh_sla(falla)

    falla.ultima_actualizacion = datetime.utcnow()
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return seg


# ─── fotos ───────────────────────────────────────────────────

@router.post("/{falla_id}/fotos", response_model=FotoOut,
             status_code=status.HTTP_201_CREATED, summary="Subir foto al servidor")
async def upload_foto(
    falla_id: UUID,
    file: UploadFile = File(...),
    etapa: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    falla = db.query(Falla).filter(Falla.id == falla_id).first()
    if not falla:
        raise HTTPException(status_code=404, detail="Falla no encontrada")

    # Validar tamaño
    contents = await file.read()
    if len(contents) > MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Archivo supera {MAX_FILE_MB}MB")

    # Guardar en disco
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    safe_ext = ext if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"} else ".bin"
    filename = f"{falla_id}_{uuid.uuid4().hex[:8]}{safe_ext}"
    dest = UPLOAD_DIR / filename
    dest.write_bytes(contents)

    # Calcular orden
    orden = db.query(func.count(FallaFoto.id)).filter(FallaFoto.falla_id == falla_id).scalar() or 0

    foto = FallaFoto(
        falla_id=falla_id,
        url=f"/uploads/fallas/{filename}",
        nombre_archivo=file.filename,
        etapa=etapa,
        orden=orden,
        tamano_bytes=len(contents),
    )
    db.add(foto)
    db.commit()
    db.refresh(foto)
    return foto


@router.delete("/{falla_id}/fotos/{foto_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar foto")
def delete_foto(falla_id: UUID, foto_id: UUID, db: Session = Depends(get_db)):
    foto = db.query(FallaFoto).filter(
        FallaFoto.id == foto_id,
        FallaFoto.falla_id == falla_id,
    ).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    # Borrar archivo físico si existe
    if foto.url and foto.url.startswith("/uploads/"):
        filepath = Path("/app") / foto.url.lstrip("/")
        if filepath.exists():
            filepath.unlink(missing_ok=True)

    db.delete(foto)
    db.commit()
