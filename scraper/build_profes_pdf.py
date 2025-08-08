#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, json, glob
from datetime import datetime

# --- ReportLab
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether
)

from reportlab.pdfbase.pdfmetrics import stringWidth

# --- Matplotlib (opcional para gráfico)
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAS_MPL = True
except Exception:
    HAS_MPL = False

# ---------------- Config ----------------
IN_DIR  = os.path.join("out", "profesores_enriquecido")
OUT_DIR = os.path.join("out", "reportes")
OUT_PDF = os.path.join(OUT_DIR, "profesores_explicado.pdf")

MAX_COMMENTS = 8
MAX_REVIEW_ROWS = 40
CHART_WIDTH = 12  # cm
CHART_HEIGHT = 4  # cm

# -------------- Utilidades --------------
def ensure_dirs():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(os.path.join(OUT_DIR, "charts"), exist_ok=True)

def safe_get(d, path, default=None):
    cur = d
    for k in path:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur

def fmt_pct(x, null="—"):
    return f"{x*100:.1f}%" if isinstance(x, (float, int)) else null

def fmt_num(x, null="—", nd=2):
    return f"{x:.{nd}f}" if isinstance(x, (float, int)) else null

def wrap_text(txt, max_len=420):
    if not txt: return "—"
    t = " ".join(str(txt).split())
    return t if len(t) <= max_len else t[:max_len-1] + "…"

# === Footer con crédito y paginado ===
def draw_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    page = canvas.getPageNumber()
    canvas.setFont("Helvetica", 8)
    canvas.setFillGray(0.4)
    text = (
        f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M')}  ·  "
        f"Página {page}  ·  © 2025 Daniel P. – Datos obtenidos de MisProfesores.com"
    )
    tw = stringWidth(text, "Helvetica", 8)
    canvas.drawString((w - tw) / 2.0, 0.75 * cm, text)
    canvas.restoreState()

# ---------- Semáforo / interpretación ----------
def bucket_quality(q, n_reviews):
    if q is None: return ("Sin datos suficientes", colors.HexColor("#cccccc"))
    if n_reviews < 3: return (f"Calidad {fmt_num(q)} (poca evidencia)", colors.HexColor("#c8c8c8"))
    if q >= 8.5:  return (f"Calidad alta ({fmt_num(q)})", colors.HexColor("#1e7e34"))
    if q >= 7.5:  return (f"Calidad buena ({fmt_num(q)})", colors.HexColor("#2ea043"))
    if q >= 6.5:  return (f"Calidad media ({fmt_num(q)})", colors.HexColor("#e6a700"))
    return (f"Calidad baja ({fmt_num(q)})", colors.HexColor("#c62828"))

def bucket_difficulty(d):
    if d is None: return ("Dificultad: sin dato", colors.HexColor("#cccccc"))
    if d < 2.0:   return ("Fácil", colors.HexColor("#2ea043"))
    if d < 3.5:   return ("Intermedia", colors.HexColor("#e6a700"))
    return ("Difícil", colors.HexColor("#c62828"))

def phrase_recommendation(ci, n):
    if not isinstance(ci, (list, tuple)) or len(ci) != 2 or n is None:
        return ("Recomendación: sin dato", colors.HexColor("#cccccc"))
    low = ci[0]
    if n < 3:    return (f"Al menos {fmt_pct(low)} lo recomienda (poca evidencia, n={n})", colors.HexColor("#c8c8c8"))
    if low >= .75:return (f"Al menos {fmt_pct(low)} lo recomienda (alto)", colors.HexColor("#1e7e34"))
    if low >= .55:return (f"Al menos {fmt_pct(low)} lo recomienda (medio)", colors.HexColor("#e6a700"))
    return (f"Al menos {fmt_pct(low)} lo recomienda (bajo)", colors.HexColor("#c62828"))

def bucket_trust(ts, dup_rate, bursts, lowvar):
    if ts is None: return ("Integridad: desconocida", colors.HexColor("#cccccc"))
    warn = []
    if dup_rate and dup_rate > .15: warn.append("duplicados")
    if bursts:                       warn.append("ráfagas")
    if lowvar:                       warn.append("poca varianza")
    if   ts >= .85: base = ("Integridad alta", colors.HexColor("#1e7e34"))
    elif ts >= .65: base = ("Integridad media", colors.HexColor("#e6a700"))
    else:           base = ("Integridad baja", colors.HexColor("#c62828"))
    if warn: base = (base[0] + " (posibles sesgos: " + ", ".join(warn) + ")", base[1])
    return base

def summarize_subjects(per_subject):
    if not per_subject: return ("Sin materias destacadas", "Sin materias débiles")
    ranked = sorted(per_subject, key=lambda s: (s.get("z_decayed") is None, s.get("z_decayed")), reverse=True)
    strong = [s["materia"] for s in ranked[:3] if s.get("z_decayed") is not None and s["z_decayed"] > 0.4]
    weak   = [s["materia"] for s in ranked[-3:] if s.get("z_decayed") is not None and s["z_decayed"] < -0.4]
    if not strong: strong = ["—"]
    if not weak:   weak   = ["—"]
    return (", ".join(strong), ", ".join(weak))

def analyze_trend(trends_block):
    ewma = safe_get(trends_block or {}, ["quality_trend", "ewma"], [])
    if not ewma or len(ewma) < 3: return ("Tendencia: insuficiente", colors.HexColor("#cccccc"))
    last = sum(ewma[-3:]) / 3.0
    prev = sum(ewma[:3]) / 3.0
    slope = (last - prev) / max(1, len(ewma)-1)
    if slope > 0.05:  return ("Mejorando", colors.HexColor("#1e7e34"))
    if slope < -0.05: return ("Empeorando", colors.HexColor("#c62828"))
    return ("Estable", colors.HexColor("#e6a700"))

def make_quality_chart(prof_id, trend_block):
    if not HAS_MPL or not trend_block: return None
    series = safe_get(trend_block, ["quality_trend", "series"], [])
    ewma   = safe_get(trend_block, ["quality_trend", "ewma"], [])
    if not series or not ewma or len(series) != len(ewma): return None
    try:
        fig = plt.figure(figsize=(CHART_WIDTH/2.54, CHART_HEIGHT/2.54), dpi=120)
        ax = fig.add_subplot(111)
        ax.plot(range(len(series)), series, marker="o", label="Serie mensual")
        ax.plot(range(len(ewma)), ewma, marker="s", label="EWMA", linewidth=2)
        ax.set_ylim(0, 10)
        ax.set_ylabel("Calidad"); ax.set_xlabel("Tiempo (meses ordenados)")
        ax.grid(True, linewidth=0.4); ax.legend(loc="best", fontsize=8)
        p = os.path.join(OUT_DIR, "charts", f"{prof_id}_quality.png")
        fig.tight_layout(); fig.savefig(p); plt.close(fig)
        return p
    except Exception:
        return None

# ---------- Secciones ----------
def glossary_story(styles):
    """Tabla con celdas Paragraph (wordWrap) para que NUNCA se desborde."""
    flow = []
    flow.append(Paragraph("Cómo leer este reporte", styles["Heading1"]))
    flow.append(Spacer(1, 0.2*cm))

    # estilos de celda con wrap
    cell = styles["Wrap9"]
    head = styles["Wrap9Bold"]

    bullets = [
        ("Calidad (Bayes)", "Promedio ajustado que evita engaños con pocas reseñas. &gt;8.5 muy alto, &lt;6.5 bajo."),
        ("Dificultad", "0–2 fácil, 2–3.5 intermedia, &gt;3.5 difícil (según quienes lo han tomado)."),
        ("Recomendación (IC de Wilson)", "Mostramos “al menos X%” que recomienda; estimación conservadora y confiable."),
        ("Materias destacadas (z-score)", "Dónde rinde mejor/peor respecto al promedio de esa materia en la universidad."),
        ("Tendencia (EWMA)", "Si la calidad mejora, empeora o se mantiene estable en el tiempo."),
        ("Integridad", "Señales de datos raros (duplicados, ráfagas de reseñas, variación anormal). Más alto = más confiable."),
        ("Sentimiento", "Polaridad básica de los comentarios. Sirve de contexto, no de sentencia final."),
    ]
    data = [
        [Paragraph("Indicador", head), Paragraph("Cómo interpretarlo", head)]
    ]
    for k, v in bullets:
        data.append([Paragraph(k, cell), Paragraph(v, cell)])

    # ancho usable ~ 17.8 cm; reparte 34/66
    col_widths = [6.0*cm, 11.6*cm]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#f0f0f0")),
        ("GRID",       (0,0), (-1,-1), 0.3, colors.HexColor("#c8c8c8")),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
    ]))
    flow.append(t)
    flow.append(Spacer(1, 0.45*cm))
    flow.append(Paragraph(
        "Resumen operativo: revisa el bloque de interpretación por profesor. "
        "Verde = buena apuesta; ámbar = depende del contexto; rojo = evítalo salvo que busques reto.",
        styles["BodyText"]
    ))
    flow.append(PageBreak())
    return flow

def interpretive_block(data, styles):
    qb = safe_get(data, ["bayes_analysis", "quality_bayes"])
    dn = safe_get(data, ["decay_analysis", "difficulty_decayed"])
    ci = safe_get(data, ["recommendation_analysis", "wilson_interval"])
    n  = data.get("n_reviews", 0)
    ts = safe_get(data, ["integrity_analysis", "trust_score"])
    dup= safe_get(data, ["integrity_analysis", "dup_rate"]) or 0.0
    bursts = safe_get(data, ["integrity_analysis", "bursts"]) or []
    lowvar  = safe_get(data, ["integrity_analysis", "low_variance_flag"])
    subj = safe_get(data, ["subject_normalization", "per_subject"], []) or []
    trend_label, trend_color = analyze_trend(data.get("trends_analysis"))

    q_label, q_color = bucket_quality(qb, n)
    d_label, d_color = bucket_difficulty(dn)
    r_label, r_color = phrase_recommendation(ci, n)
    t_label, t_color = bucket_trust(ts, dup, bursts, lowvar)
    strong, weak = summarize_subjects(subj)

    sent_overall = safe_get(data, ["nlp_analysis", "sentiment", "overall"])
    if isinstance(sent_overall, (float, int)):
        s_label = "Sentimiento positivo en reseñas" if sent_overall > 0.2 else \
                  "Sentimiento negativo en reseñas" if sent_overall < -0.2 else \
                  "Sentimiento mixto/neutro en reseñas"
    else:
        s_label = "Sentimiento: sin dato"

    rows = [
        ["Resumen interpretado", ""],
        ["Calidad (ajustada)", q_label],
        ["Dificultad", d_label],
        ["Recomendación (mín.)", r_label],
        ["Tendencia reciente", trend_label],
        ["Materias fuertes", strong],
        ["Materias débiles", weak],
        ["Integridad", t_label],
        ["Sentimiento", s_label],
        ["Muestras (n)", str(n)],
    ]
    tbl = Table(rows, colWidths=[5.5*cm, 10.5*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#eef6ff")),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("GRID",       (0,0), (-1,-1), 0.3, colors.HexColor("#c8c8c8")),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ("FONTNAME",   (0,1), (0,-1), "Helvetica-Bold"),
        ("TEXTCOLOR",  (1,1), (1,1), q_color),
        ("TEXTCOLOR",  (1,2), (1,2), d_color),
        ("TEXTCOLOR",  (1,3), (1,3), r_color),
        ("TEXTCOLOR",  (1,4), (1,4), trend_color),
        ("TEXTCOLOR",  (1,7), (1,7), t_color),
    ]))
    return tbl

def build_professor_story(data, styles):
    flow = []
    nombre = data.get("nombre") or data.get("professor_id") or "Profesor"
    uni    = data.get("universidad", "—")
    pid    = data.get("professor_id", "—")

    # Título que alimenta el TOC
    titulo_toc = f"{nombre} - {uni}" if uni and uni != "—" else nombre
    flow.append(Paragraph(titulo_toc, styles["ProfHeading"]))
    flow.append(Paragraph(f"ID: {pid}", styles["BodyText"]))
    flow.append(Spacer(1, 0.25*cm))

    # Bloque interpretado
    flow.append(interpretive_block(data, styles))
    flow.append(Spacer(1, 0.35*cm))

    # KPIs crudos
    qb = safe_get(data, ["bayes_analysis", "quality_bayes"])
    dn = safe_get(data, ["decay_analysis", "difficulty_decayed"])
    rr = safe_get(data, ["recommendation_analysis", "rate"])
    ic = safe_get(data, ["recommendation_analysis", "wilson_interval"])
    ts = safe_get(data, ["integrity_analysis", "trust_score"])
    n  = data.get("n_reviews", 0)

    kpi = [
        ["Métrica", "Valor"],
        ["Calidad (Bayes)",     fmt_num(qb)],
        ["Dificultad (actual)", fmt_num(dn)],
        ["Recomendación (tasa)", fmt_pct(rr)],
        ["IC95% Wilson",        f"[{fmt_pct(ic[0])}, {fmt_pct(ic[1])}]" if isinstance(ic, list) else "—"],
        ["Trust score",         fmt_num(ts, nd=2)],
        ["N reseñas",           str(n)],
    ]
    t = Table(kpi, colWidths=[6*cm, 10*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#f0f0f0")),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("ALIGN",      (0,0), (-1,-1), "LEFT"),
        ("GRID",       (0,0), (-1,-1), 0.3, colors.HexColor("#c8c8c8")),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
    ]))
    flow.append(t)
    flow.append(Spacer(1, 0.3*cm))

    # Materias destacadas
    subj = safe_get(data, ["subject_normalization", "per_subject"], []) or []
    if subj:
        rows = [["Materia", "z̄ (decay)", "n (global materia)"]]
        for s in subj[:5]:
            rows.append([s.get("materia",""), fmt_num(s.get("z_decayed")), str(s.get("n","—"))])
        t2 = Table(rows, colWidths=[9*cm, 3.5*cm, 3.5*cm])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#eef6ff")),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("GRID",       (0,0), (-1,-1), 0.3, colors.HexColor("#c8c8c8")),
        ]))
        flow.append(Paragraph("Materias destacadas (z-score contextual):", styles["Heading3"]))
        flow.append(t2)
        flow.append(Spacer(1, 0.3*cm))

    # Gráfico
    chart_path = make_quality_chart(pid, data.get("trends_analysis"))
    if chart_path:
        flow.append(Paragraph("Tendencia de calidad (serie vs EWMA):", styles["Heading3"]))
        flow.append(Image(chart_path, width=CHART_WIDTH*cm, height=CHART_HEIGHT*cm))
        flow.append(Spacer(1, 0.3*cm))

    # Integridad
    integ = data.get("integrity_analysis", {}) or {}
    integ_rows = [
        ["Indicador", "Valor"],
        ["dup_rate", fmt_num(integ.get("dup_rate"), nd=3)],
        ["low_variance_flag", "Sí" if integ.get("low_variance_flag") else "No"],
        ["trust_score", fmt_num(integ.get("trust_score"), nd=2)],
        ["burst_days", str(len(integ.get("bursts") or []))]
    ]
    t3 = Table(integ_rows, colWidths=[6*cm, 10*cm])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#f9f6e8")),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("GRID",       (0,0), (-1,-1), 0.3, colors.HexColor("#c8c8c8")),
    ]))
    flow.append(Paragraph("Integridad de reseñas (señales de fiabilidad):", styles["Heading3"]))
    flow.append(t3)
    flow.append(Spacer(1, 0.3*cm))

    # Comentarios recientes
    comments = data.get("comments_recent") or []
    if not comments and data.get("reviews_public"):
        reviews_sorted = sorted(
            data["reviews_public"],
            key=lambda r: (r.get("fecha_iso") is None, r.get("fecha_iso")),
            reverse=True
        )
        comments = [r.get("comentario") for r in reviews_sorted if r.get("comentario")]
    if comments:
        flow.append(Paragraph("Comentarios recientes (muestra):", styles["Heading3"]))
        bullets = [Paragraph(f"• {wrap_text(c, 420)}", styles["BodyText"]) for c in comments[:MAX_COMMENTS]]
        flow.append(KeepTogether(bullets))
        flow.append(Spacer(1, 0.3*cm))

    # Tabla compacta de reseñas públicas
    rows = data.get("reviews_public") or []
    if rows:
        flow.append(Paragraph("Reseñas (compacto):", styles["Heading3"]))
        header = ["Fecha", "Materia", "Cal.", "Dif.", "Nota", "Rec."]
        tbl = [header]
        for r in rows[:MAX_REVIEW_ROWS]:
            tbl.append([
                (r.get("fecha_iso") or "—")[:10],
                wrap_text(r.get("materia") or "—", 32),
                fmt_num(r.get("calidad"), nd=1) if r.get("calidad") is not None else "—",
                fmt_num(r.get("dificultad"), nd=1) if r.get("dificultad") is not None else "—",
                fmt_num(r.get("nota"), nd=1) if r.get("nota") is not None else "—",
                ("Sí" if r.get("recomienda")==1 else "No" if r.get("recomienda")==0 else "—"),
            ])
        t4 = Table(tbl, colWidths=[2.2*cm, 6.2*cm, 1.6*cm, 1.6*cm, 1.6*cm, 2.0*cm])
        t4.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#efefef")),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("GRID",       (0,0), (-1,-1), 0.25, colors.HexColor("#c8c8c8")),
            ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ]))
        flow.append(t4)

    flow.append(PageBreak())
    return flow

# ------------- Build PDF (portada, TOC real y footer) -------------
def main():
    ensure_dirs()
    files = sorted(glob.glob(os.path.join(IN_DIR, "*.json")))
    if not files:
        raise SystemExit(f"No se encontraron JSON en: {IN_DIR}")

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=8, leading=10))
    styles["Heading1"].fontSize = 16; styles["Heading1"].leading = 18
    styles["Heading3"].fontSize = 11; styles["Heading3"].leading = 14
    styles.add(ParagraphStyle(name="ProfHeading", parent=styles["Heading1"]))
    # estilos con wrap para tablas largas
    styles.add(ParagraphStyle(name="Wrap9", parent=styles["BodyText"], fontSize=9, leading=11, wordWrap="CJK"))
    styles.add(ParagraphStyle(name="Wrap9Bold", parent=styles["Wrap9"], fontName="Helvetica-Bold"))

    # Documento base + plantilla de página con footer
    doc = BaseDocTemplate(
        OUT_PDF, pagesize=A4,
        leftMargin=1.6*cm, rightMargin=1.6*cm,
        topMargin=1.6*cm, bottomMargin=1.6*cm,
        title="Reporte de Profesores (Explicado)", author="Daniel P."
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
    template = PageTemplate(id='AllPages', frames=[frame], onPage=draw_footer)
    doc.addPageTemplates([template])

    # Índice funcional (TOC) - versión simplificada
    toc_entries = []

    # afterFlowable: registra entradas del TOC SOLO para ProfHeading
    def after_flowable(flowable):
        from reportlab.platypus import Paragraph as RLParagraph
        if isinstance(flowable, RLParagraph) and flowable.style.name == "ProfHeading":
            text = flowable.getPlainText()
            # guardar entrada del TOC
            toc_entries.append((text, doc.page))
    doc.afterFlowable = after_flowable

    story = []

    # === Portada mejorada que ocupa toda la hoja ===
    story.append(Spacer(1, 2*cm))
    
    # Título principal centrado
    story.append(Paragraph("Reporte de Profesores", styles["Heading1"]))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("Análisis Avanzado y Explicado", styles["Heading3"]))
    story.append(Spacer(1, 2*cm))
    
    # Información del reporte con mejor formato
    story.append(Paragraph("📊 Análisis Estadístico Avanzado", styles["BodyText"]))
    story.append(Paragraph("🎯 Evaluación Bayesiana de Calidad", styles["BodyText"]))
    story.append(Paragraph("📈 Análisis de Tendencias Temporales", styles["BodyText"]))
    story.append(Paragraph("🔍 Verificación de Integridad de Datos", styles["BodyText"]))
    story.append(Paragraph("💬 Análisis de Sentimiento", styles["BodyText"]))
    story.append(Paragraph("📋 Normalización por Materia", styles["BodyText"]))
    story.append(Spacer(1, 1.5*cm))
    
    # Estadísticas del reporte
    total_profesores = len(files)
    story.append(Paragraph(f"📚 Total de Profesores Analizados: {total_profesores}", styles["BodyText"]))
    story.append(Paragraph(f"📅 Fecha de Generación: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["BodyText"]))
    story.append(Paragraph("🏫 Fuente: MisProfesores.com", styles["BodyText"]))
    story.append(Spacer(1, 2*cm))
    
    # Información técnica
    story.append(Paragraph("Metodología:", styles["Heading3"]))
    story.append(Paragraph("• Análisis Bayesiano para estimaciones robustas", styles["BodyText"]))
    story.append(Paragraph("• Intervalos de confianza de Wilson para recomendaciones", styles["BodyText"]))
    story.append(Paragraph("• EWMA para detección de tendencias temporales", styles["BodyText"]))
    story.append(Paragraph("• Z-scores normalizados por materia", styles["BodyText"]))
    story.append(Paragraph("• Verificación de integridad y detección de sesgos", styles["BodyText"]))
    story.append(Spacer(1, 2*cm))
    
    # Créditos en la parte inferior
    story.append(Paragraph("© 2025 Daniel P. – Análisis Avanzado de Datos Educativos", styles["BodyText"]))
    story.append(Paragraph("Datos obtenidos de MisProfesores.com", styles["Small"]))
    story.append(PageBreak())

    # === Índice (funcional) ===
    story.append(Paragraph("Índice de Contenido", styles["Heading1"]))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("• Cómo leer este reporte", styles["BodyText"]))
    story.append(Paragraph("• Glosario de indicadores", styles["BodyText"]))
    story.append(Paragraph("• Profesores analizados:", styles["BodyText"]))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph("(Ver índice detallado al final del documento)", styles["Small"]))
    story.append(PageBreak())

    # === Glosario / cómo leer ===
    story += glossary_story(styles)

    # === Cuerpo por profesor ===
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        story += build_professor_story(data, styles)

    # Generar TOC detallado después de procesar todos los profesores
    if toc_entries:
        # Crear una nueva página para el índice detallado
        story.append(PageBreak())
        story.append(Paragraph("Índice Detallado de Profesores", styles["Heading1"]))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph(f"Total de profesores analizados: {len(toc_entries)}", styles["BodyText"]))
        story.append(Spacer(1, 0.5*cm))
        
        # Agrupar profesores por universidad si es posible
        profs_by_uni = {}
        for text, page in toc_entries:
            # Intentar extraer universidad del nombre (asumiendo formato "Nombre - Universidad")
            if " - " in text:
                nombre, uni = text.split(" - ", 1)
                if uni not in profs_by_uni:
                    profs_by_uni[uni] = []
                profs_by_uni[uni].append((nombre, page))
            else:
                if "Sin universidad" not in profs_by_uni:
                    profs_by_uni["Sin universidad"] = []
                profs_by_uni["Sin universidad"].append((text, page))
        
        # Mostrar profesores agrupados por universidad
        for uni, profesores in profs_by_uni.items():
            story.append(Paragraph(f"🏫 {uni} ({len(profesores)} profesores)", styles["Heading3"]))
            for nombre, page in profesores:
                story.append(Paragraph(f"  • {nombre} - Página {page}", styles["BodyText"]))
            story.append(Spacer(1, 0.3*cm))
        
        story.append(PageBreak())

    doc.build(story)
    print(f"PDF generado: {OUT_PDF}")

if __name__ == "__main__":
    main()
