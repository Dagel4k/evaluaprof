#!/usr/bin/env python3
"""
Sistema de Análisis Avanzado para Datos de Profesores
Implementa 10 técnicas de análisis estadístico para evaluar profesores
"""

import json
import os
import re
import unicodedata
import pathlib
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from collections import defaultdict, Counter
import numpy as np
from scipy import stats
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

# Spanish stopwords (functional only, not occupational)
STOP_ES = {
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'fue', 'este', 'ha', 'sí', 'esta', 'son', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros'
}

# Spanish months mapping
MONTHS = {
    "Ene": 1, "Feb": 2, "Mar": 3, "Abr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Ago": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dic": 12
}

class ProfessorAnalyzer:
    def __init__(self, data_dir="profesores_json", out_dir="out"):
        self.data_dir = data_dir
        self.out_dir = pathlib.Path(out_dir)
        (self.out_dir / "profesores_enriquecido").mkdir(parents=True, exist_ok=True)
        (self.out_dir / "indices" / "subjects").mkdir(parents=True, exist_ok=True)
        self.global_stats = {}
        self.subject_stats = {}
        
    def _normalize(self, s: str) -> str:
        """Normalize text: lowercase, remove accents, clean punctuation"""
        s = s.lower()
        s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
        return re.sub(r'[^a-z0-9\s]', ' ', s)
        
    def parse_fecha(self, fecha_str: Optional[str]) -> Optional[datetime]:
        """Parse date string with Spanish month support"""
        if not fecha_str:
            return None
        # Format like 28/Dic/2016
        m = re.match(r'^(\d{1,2})/([A-Za-z]{3})/(\d{4})$', fecha_str.strip())
        if m:
            d, mon, y = m.groups()
            mon = mon[:3].title()
            if mon in MONTHS:
                return datetime(int(y), MONTHS[mon], int(d))
        # Fallback to numeric formats
        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d'):
            try:
                return datetime.strptime(fecha_str, fmt)
            except ValueError:
                continue
        return None

    def months_diff(self, a: datetime, b: datetime) -> float:
        """Calculate months difference with day fraction"""
        return (b.year - a.year) * 12 + (b.month - a.month) + (b.day - a.day) / 30.0

    def _extract_rows(self, calificaciones):
        """Extract atomic review rows with proper recommendation mapping"""
        rows = []
        for cal in calificaciones:
            tipo = (cal.get('tipo_calificacion') or '').strip().upper()
            recomienda = 1 if tipo == 'BUENO' else 0 if tipo else None
            
            # Handle facilidad to difficulty conversion
            facilidad = cal.get('puntaje_facilidad')
            if facilidad is not None and facilidad not in (None, 0, '0', '0.0'):
                dificultad = min(5.0, float(facilidad))
            else:
                dificultad = None
                
            row = {
                'fecha': self.parse_fecha(cal.get('fecha')),
                'calidad': (float(cal['puntaje_calidad_general']) 
                           if cal.get('puntaje_calidad_general') is not None else None),
                'dificultad': dificultad,
                'materia': (cal.get('materia') or '').upper().strip(),
                'nota': (float(cal['calificacion_recibida']) 
                         if (cal.get('calificacion_recibida') not in (None, 'N/A', 'NA', '')) else None),
                'comentario': (cal.get('comentario') or '').strip(),
                'recomienda': recomienda
            }
            rows.append(row)
        return rows

    def _save_json(self, relpath: str, obj: Any) -> None:
        def make_serializable(o):
            if isinstance(o, dict):  return {k: make_serializable(v) for k,v in o.items()}
            if isinstance(o, list):  return [make_serializable(x) for x in o]
            if isinstance(o, (np.integer, np.floating)): return float(o)
            if isinstance(o, np.ndarray): return o.tolist()
            if isinstance(o, bool): return int(o)  # opcional
            return o
        p = self.out_dir / relpath
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(make_serializable(obj), f, ensure_ascii=False, indent=2)

    def _save_professor_file(self, prof_id: str, analysis: Dict[str, Any]) -> None:
        self._save_json(f"profesores_enriquecido/{prof_id}.json", analysis)

    def _rows_to_public(self, rows: List[Dict[str, Any]], limit: int = None) -> List[Dict[str, Any]]:
        """Convierte filas internas a un payload JSON-serializable manteniendo comentario original."""
        out = []
        it = rows if limit is None else rows[:limit]
        for r in it:
            out.append({
                "fecha_iso": (r["fecha"].isoformat() if r["fecha"] else None),
                "materia": r["materia"],
                "calidad": r["calidad"],
                "dificultad": r["dificultad"],
                "nota": r["nota"],
                "recomienda": r["recomienda"],
                "comentario": r["comentario"],  # <-- TEXTO ORIGINAL, SIN NORMALIZAR
            })
        return out

    def decayed_mean_from_rows(self, rows, field, half_life=24):
        """Calculate decayed mean from atomic rows, handling missing dates properly"""
        now = datetime.now()
        valid_rows = []
        naive_values = []
        
        for row in rows:
            value = row.get(field)
            if value is not None:
                naive_values.append(value)
                if row['fecha']:
                    valid_rows.append((row['fecha'], value))
        
        if not naive_values:
            return None
            
        # Calculate naive mean (all reviews)
        naive_mean = np.mean(naive_values)
        
        # Calculate decayed mean (only reviews with dates)
        if not valid_rows:
            return naive_mean
            
        weights = []
        values = []
        
        for fecha, value in valid_rows:
            months = self.months_diff(fecha, now)
            weight = np.exp(-np.log(2) * months / half_life)
            weights.append(weight)
            values.append(value)
        
        if not weights:
            return naive_mean
            
        decayed_mean = np.average(values, weights=weights)
        return decayed_mean

    def bayesian_score(self, values: List[float], mu_global: float, k: int = 10) -> float:
        """Calcula score bayesiano para pocas reseñas"""
        if not values:
            return mu_global
        
        n = len(values)
        return (mu_global * k + sum(values)) / (k + n)
    
    def wilson_interval(self, p: float, n: int, confidence: float = 0.95) -> Tuple[float, float]:
        """Calcula intervalo de Wilson con confidence dinámico"""
        if n == 0:
            return (0.0, 1.0)
        
        # Map confidence to z-score
        z_map = {0.90: 1.645, 0.95: 1.96, 0.99: 2.576}
        z = z_map.get(confidence, 1.96)
        
        denominator = 1 + z**2/n
        centre_adjustment = z * np.sqrt(p*(1-p)/n + z*z/(4*n*n))
        centre_numerator = p + z*z/(2*n)
        
        lower = (centre_numerator - centre_adjustment) / denominator
        upper = (centre_numerator + centre_adjustment) / denominator
        
        return (max(0, lower), min(1, upper))

    def load_all_data(self):
        """Carga todos los archivos JSON de profesores"""
        print("Cargando datos de profesores...")
        professors_data = {}
        
        for filename in os.listdir(self.data_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(self.data_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        professor_id = filename.replace('.json', '')
                        professors_data[professor_id] = data
                except Exception as e:
                    print(f"Error cargando {filename}: {e}")
        
        print(f"Cargados {len(professors_data)} profesores")
        self.professors_data = professors_data
        self._calculate_global_stats(professors_data)
        return professors_data

    def _calculate_global_stats(self, professors_data):
        """Calcula estadísticas globales necesarias para los análisis"""
        all_quality = []
        all_difficulty = []
        all_recommendations = []
        subject_data = defaultdict(lambda: {'quality': [], 'difficulty': []})
        
        for prof_id, data in professors_data.items():
            for review in data.get('calificaciones', []):
                # Calidad
                if review.get('puntaje_calidad_general') is not None:
                    quality = float(review['puntaje_calidad_general'])
                    all_quality.append(quality)
                    
                    # Estadísticas por materia
                    subject = review.get('materia', '').upper()
                    if subject:
                        subject_data[subject]['quality'].append(quality)
                
                # Dificultad (misma escala que en _extract_rows): 0 => missing, clamp a 5.0
                fac = review.get('puntaje_facilidad')
                if fac is not None:
                    fac = float(fac)
                    if fac > 0:
                        diff = min(5.0, fac)
                        all_difficulty.append(diff)
                        subject = (review.get('materia') or '').upper()
                        if subject:
                            subject_data[subject]['difficulty'].append(diff)
                
                # Recomendaciones
                if review.get('tipo_calificacion'):
                    recommends = 1 if review['tipo_calificacion'] == 'BUENO' else 0
                    all_recommendations.append(recommends)
        
        # Count total reviews correctly
        total_reviews = sum(len(d.get('calificaciones', [])) for d in professors_data.values())
        
        # Estadísticas globales
        self.global_stats = {
            'mu_quality': float(np.mean(all_quality)) if all_quality else None,
            'mu_difficulty': float(np.mean(all_difficulty)) if all_difficulty else None,
            'recommendation_rate': float(np.mean(all_recommendations)) if all_recommendations else None,
            'total_reviews': int(total_reviews)
        }
        
        # Estadísticas por materia
        self.subject_stats = {}
        for subject, data in subject_data.items():
            if len(data['quality']) >= 3:  # Mínimo 3 reseñas para confiabilidad
                self.subject_stats[subject] = {
                    'mu_quality': np.mean(data['quality']),
                    'sigma_quality': np.std(data['quality'], ddof=1) if len(data['quality']) > 1 else 1.0,
                    'mu_difficulty': np.mean(data['difficulty']) if data['difficulty'] else 0,
                    'sigma_difficulty': np.std(data['difficulty'], ddof=1) if len(data['difficulty']) > 1 else 1.0,
                    'n_reviews': len(data['quality'])
                }

    def analyze_professor(self, prof_id: str, data: Dict) -> Dict[str, Any]:
        """Analiza un profesor aplicando todas las técnicas"""
        print(f"Analizando {prof_id}...")
        
        # Extract atomic rows
        reviews = self._extract_rows(data.get('calificaciones', []))
        
        if not reviews:
            return {
                'professor_id': prof_id,
                'error': 'No hay reseñas disponibles'
            }
        
        # 1. Promedios con decaimiento temporal
        quality_decayed = self.decayed_mean_from_rows(reviews, 'calidad')
        difficulty_decayed = self.decayed_mean_from_rows(reviews, 'dificultad')
        
        # 2. Ajuste Bayesiano
        qualities = [r['calidad'] for r in reviews if r['calidad'] is not None]
        difficulties = [r['dificultad'] for r in reviews if r['dificultad'] is not None]
        
        quality_bayes = self.bayesian_score(qualities, self.global_stats['mu_quality'])
        difficulty_bayes = self.bayesian_score(difficulties, self.global_stats['mu_difficulty'])
        
        # 3. Intervalo de Wilson para recomendaciones (with proper n>0 guard)
        recommendations = [r['recomienda'] for r in reviews if r['recomienda'] is not None]
        n = len(recommendations)
        if n:
            r = sum(recommendations)
            p = r/n
            low, high = self.wilson_interval(p, n, confidence=0.95)
            recommendation_analysis = {'rate': round(p, 3), 'wilson_interval': [low, high], 'n_recommendations': n}
        else:
            recommendation_analysis = {'rate': None, 'wilson_interval': None, 'n_recommendations': 0}
        
        # 4. Normalización por materia (z-score contextual) - ALL subjects
        subject_normalization = self.subject_normalization(reviews)
        
        # 5. Análisis de notas y equidad
        grades_analysis = self._analyze_grades(reviews)
        
        # 6. Análisis NLP
        nlp_analysis = self._analyze_nlp(reviews)
        
        # 7. Análisis de integridad
        integrity_analysis = self._analyze_integrity(reviews)
        
        # 8. Análisis de tendencias
        trends_analysis = self._analyze_trends(reviews)
        
        # Muestras de comentarios
        # Ordena por fecha descendente (None al final)
        rows_sorted = sorted(reviews, key=lambda r: (r["fecha"] is None, r["fecha"]), reverse=True)
        comments_recent = [r["comentario"] for r in rows_sorted[:10] if r["comentario"]]

        # Payload público de filas (comentarios sin limpiar)
        reviews_public = self._rows_to_public(rows_sorted)  # o limita con [:100] si pesa mucho
        
        return {
            'professor_id': prof_id,
            'nombre': data.get('nombre', ''),
            'universidad': data.get('universidad', ''),
            'decay_analysis': {
                'quality_decayed': quality_decayed,
                'difficulty_decayed': difficulty_decayed
            },
            'bayes_analysis': {
                'quality_bayes': quality_bayes,
                'difficulty_bayes': difficulty_bayes
            },
            'recommendation_analysis': recommendation_analysis,
            'subject_normalization': subject_normalization,
            'grades_analysis': grades_analysis,
            'nlp_analysis': nlp_analysis,
            'integrity_analysis': integrity_analysis,
            'trends_analysis': trends_analysis,
            'reviews_public': reviews_public,
            'comments_recent': comments_recent,
            'n_reviews': len(reviews)
        }
    
    def _decayed_series_avg(self, values, dates, half_life=24):
        """Calculate decayed average of a series"""
        if not values or not dates:
            return None
        now = datetime.now()
        weights = []
        valid_values = []
        
        for value, date in zip(values, dates):
            if date and value is not None:
                months = self.months_diff(date, now)
                weight = np.exp(-np.log(2) * months / half_life)
                weights.append(weight)
                valid_values.append(value)
        
        if not weights:
            return np.mean(values) if values else None
            
        return np.average(valid_values, weights=weights)

    def subject_normalization(self, rows):
        """Calculate decayed z-scores for ALL subjects"""
        z_vals = []
        per = defaultdict(list)
        
        for r in rows:
            subj = r['materia']
            if not subj or r['calidad'] is None:
                continue
            stats = self.subject_stats.get(subj)
            if not stats:
                continue
            mu = stats['mu_quality']
            sd = stats['sigma_quality'] or 1.0
            z = (r['calidad'] - mu) / sd
            z_vals.append((z, r['fecha']))
            per[subj].append((z, r['fecha']))
        
        def decayed_avg(zlist):
            if not zlist:
                return None
            now = datetime.now()
            acc = ws = 0.0
            for z, dt in zlist:
                if not dt:
                    continue
                w = 0.5 ** (self.months_diff(dt, now) / 24.0)
                acc += w * z
                ws += w
            return (acc / ws) if ws else None
        
        z_mean = np.mean([z for z, _ in z_vals]) if z_vals else None
        z_decayed = decayed_avg(z_vals)
        
        per_subject = [
            {
                "materia": s,
                "z_decayed": (decayed_avg(lst) or 0.0),
                "n": self.subject_stats[s]['n_reviews']
            }
            for s, lst in per.items()
        ]
        per_subject.sort(key=lambda x: x["z_decayed"], reverse=True)
        
        return {
            "z_mean": (round(float(z_mean), 2) if z_mean is not None else None),
            "z_mean_decayed": (round(float(z_decayed), 2) if z_decayed is not None else None),
            "per_subject": per_subject[:5]
        }

    def _analyze_grades(self, rows):
        """Analyze grade distribution and equity (grade vs difficulty correlation)"""
        grades = []
        difficulties = []
        valid_pairs = []
        
        for row in rows:
            if row['nota'] is not None and row['dificultad'] is not None:
                try:
                    grade = float(row['nota'])
                    difficulty = float(row['dificultad'])
                    grades.append(grade)
                    difficulties.append(difficulty)
                    valid_pairs.append((difficulty, grade))
                except (ValueError, TypeError):
                    continue
        
        if not grades:
            return {
                'grade_distribution': {'mean': None, 'std': None, 'histogram': None},
                'equity_index': None,
                'n_grades': 0
            }
        
        # Grade distribution
        grade_mean = np.mean(grades)
        grade_std = np.std(grades, ddof=1)
        
        # Create histogram bins
        bins = np.linspace(0, 10, 11)  # 0-10 scale
        hist, bin_edges = np.histogram(grades, bins=bins)
        
        # Equity analysis (correlation between difficulty and grade)
        equity_index = None
        if len(valid_pairs) >= 3:
            difficulties_only = [pair[0] for pair in valid_pairs]
            grades_only = [pair[1] for pair in valid_pairs]
            try:
                rho, _ = stats.spearmanr(difficulties_only, grades_only)
                equity_index = round(1 - max(0.0, float(rho) if not np.isnan(rho) else 0.0), 2)
            except:
                equity_index = None
        
        return {
            'grade_distribution': {
                'mean': grade_mean,
                'std': grade_std,
                'histogram': {
                    'counts': hist.tolist(),
                    'bins': bin_edges.tolist()
                }
            },
            'equity_index': equity_index,
            'n_grades': len(grades)
        }
    
    def _analyze_nlp(self, rows):
        """Analyze comments with improved Spanish NLP and text normalization"""
        comments = [row['comentario'] for row in rows if row['comentario']]
        
        if len(comments) < 3:
            return {
                'topics': [],
                'sentiment': {'overall': None, 'by_month': {}},
                'n_comments': len(comments)
            }
        
        # TF-IDF with normalized text and proper stopwords
        try:
            cleaned = [self._normalize(c) for c in comments]
            vectorizer = TfidfVectorizer(
                stop_words=list(STOP_ES),
                min_df=2,
                max_df=0.9,
                ngram_range=(1, 2),
                max_features=500
            )
            
            X = vectorizer.fit_transform(cleaned)
            
            # Topic modeling with NMF
            n_components = min(5, len(comments) // 2, 10)  # Dynamic components
            if n_components < 2:
                return {
                    'topics': [],
                    'sentiment': {'overall': None, 'by_month': {}},
                    'n_comments': len(comments)
                }
            
            nmf = NMF(n_components=n_components, init='nndsvda', random_state=42, max_iter=400)
            topic_matrix = nmf.fit_transform(X)
            
            # Extract top words per topic
            feature_names = vectorizer.get_feature_names_out()
            topics = []
            for i, topic in enumerate(nmf.components_):
                top_words = [feature_names[j] for j in topic.argsort()[-5:]]
                topics.append({
                    'id': i,
                    'words': top_words,
                    'weight': float(topic_matrix[:, i].mean())
                })
            
        except Exception as e:
            print(f"NLP analysis error: {e}")
            topics = []
        
        # Simple sentiment analysis (lexicon-based with normalized text)
        positive_words = {'bueno', 'excelente', 'genial', 'fantastico', 'maravilloso', 
                         'perfecto', 'increible', 'brillante', 'extraordinario', 'magnifico',
                         'claro', 'explicativo', 'comprensivo', 'paciente', 'dedicado',
                         'apasionado', 'motivador', 'inspirador', 'util', 'practico'}
        
        negative_words = {'malo', 'terrible', 'horrible', 'pesimo', 'decepcionante',
                         'confuso', 'aburrido', 'dificil', 'complicado', 'frustrante',
                         'inutil', 'desorganizado', 'impreciso', 'lento', 'monotono'}
        
        sentiment_scores = []
        sentiment_by_month = defaultdict(list)
        
        for i, row in enumerate(rows):
            if row['comentario'] and row['fecha']:
                comment = self._normalize(row['comentario'])
                words = comment.split()
                
                positive_count = sum(1 for word in words if word in positive_words)
                negative_count = sum(1 for word in words if word in negative_words)
                
                # Simple sentiment score
                if positive_count + negative_count > 0:
                    sentiment = (positive_count - negative_count) / (positive_count + negative_count)
                else:
                    sentiment = 0
                
                sentiment_scores.append(sentiment)
                
                # Group by month
                month_key = f"{row['fecha'].year}-{row['fecha'].month:02d}"
                sentiment_by_month[month_key].append(sentiment)
        
        overall_sentiment = np.mean(sentiment_scores) if sentiment_scores else None
        
        # Calculate monthly sentiment averages
        monthly_sentiment = {}
        for month, scores in sentiment_by_month.items():
            if scores:
                monthly_sentiment[month] = np.mean(scores)
        
        return {
            'topics': topics,
            'sentiment': {
                'overall': overall_sentiment,
                'by_month': monthly_sentiment
            },
            'n_comments': len(comments)
        }

    def _burst_windows(self, dates, k=3, window_hours=24):
        """Detect bursts using sliding window O(n) algorithm"""
        ds = sorted(d for d in dates if d)
        if len(ds) < k:
            return []
        out = []
        i = 0
        wh = timedelta(hours=window_hours)
        for j in range(len(ds)):
            while ds[j] - ds[i] > wh:
                i += 1
            if j - i + 1 >= k:
                out.append({
                    "from": ds[i].isoformat(),
                    "to": ds[j].isoformat(),
                    "count": j - i + 1
                })
        return out

    def _analyze_integrity(self, rows):
        """Analyze review integrity with O(n) burst detection and bounded penalties"""
        comments = [r['comentario'] for r in rows if r['comentario']]
        dups = 0
        
        if len(comments) > 1:
            try:
                vec = TfidfVectorizer(stop_words=list(STOP_ES), max_features=300)
                M = vec.fit_transform([self._normalize(c) for c in comments])
                S = cosine_similarity(M)
                for i in range(len(S)):
                    for j in range(i + 1, len(S)):
                        if S[i, j] > 0.9:
                            dups += 1
            except:
                pass
        
        dates = [r['fecha'] for r in rows if r['fecha']]
        bursts = self._burst_windows(dates, k=3, window_hours=24)
        
        qualities = [r['calidad'] for r in rows if r['calidad'] is not None]
        lowvar = (np.var(qualities) < 0.1) if len(qualities) >= 5 else False
        
        # Bounded penalties
        dup_rate = dups / max(1, len(comments) * (len(comments) - 1) / 2)
        trust = 1.0 - min(0.5, 0.5 * dup_rate) - (0.3 if bursts else 0.0) - (0.2 if lowvar else 0.0)
        
        return {
            "dup_rate": round(dup_rate, 3),
            "bursts": bursts,
            "low_variance_flag": int(lowvar),
            "trust_score": round(max(0.0, trust), 2)
        }
    
    def _analyze_trends(self, rows):
        """Analyze temporal trends with dynamic forecast bands"""
        if not rows or len(rows) < 3:
            return {
                'quality_trend': None,
                'difficulty_trend': None,
                'forecast': None,
                'seasonality': {}
            }
        
        # Group by month
        monthly_data = defaultdict(lambda: {'quality': [], 'difficulty': []})
        
        for row in rows:
            if row['fecha']:
                month_key = f"{row['fecha'].year}-{row['fecha'].month:02d}"
                if row['calidad'] is not None:
                    monthly_data[month_key]['quality'].append(row['calidad'])
                if row['dificultad'] is not None:
                    monthly_data[month_key]['difficulty'].append(row['dificultad'])
        
        # Calculate monthly averages
        months = sorted(monthly_data.keys())
        quality_series = []
        difficulty_series = []
        
        for month in months:
            data = monthly_data[month]
            if data['quality']:
                quality_series.append(np.mean(data['quality']))
            if data['difficulty']:
                difficulty_series.append(np.mean(data['difficulty']))
        
        # EWMA for trends
        quality_trend = None
        difficulty_trend = None
        
        if len(quality_series) >= 2:
            # Calculate EWMA
            alpha = 0.3
            ewma_quality = [quality_series[0]]
            for i in range(1, len(quality_series)):
                ewma_quality.append(alpha * quality_series[i] + (1 - alpha) * ewma_quality[i-1])
            
            # Calculate residuals for dynamic band
            residuals = [q - e for q, e in zip(quality_series, ewma_quality)]
            sigma = np.std(residuals, ddof=1) if len(residuals) > 1 else 0.5
            
            quality_trend = {
                'series': quality_series,
                'ewma': ewma_quality,
                'sigma': sigma
            }
        
        if len(difficulty_series) >= 2:
            alpha = 0.3
            ewma_difficulty = [difficulty_series[0]]
            for i in range(1, len(difficulty_series)):
                ewma_difficulty.append(alpha * difficulty_series[i] + (1 - alpha) * ewma_difficulty[i-1])
            
            residuals = [d - e for d, e in zip(difficulty_series, ewma_difficulty)]
            sigma = np.std(residuals, ddof=1) if len(residuals) > 1 else 0.5
            
            difficulty_trend = {
                'series': difficulty_series,
                'ewma': ewma_difficulty,
                'sigma': sigma
            }
        
        # Simple forecast (naive) with bounded bands
        forecast = None
        if quality_trend and len(quality_series) >= 2:
            last_quality = quality_series[-1]
            last_ewma = quality_trend['ewma'][-1]
            sigma = quality_trend['sigma']
            
            # Bounded forecast band [0, 10]
            band = [
                max(0.0, last_ewma - 1.96 * sigma),
                min(10.0, last_ewma + 1.96 * sigma)
            ]
            
            forecast = {
                'quality_next': last_ewma,
                'quality_band': band,
                'confidence': 0.95
            }
        
        return {
            'quality_trend': quality_trend,
            'difficulty_trend': difficulty_trend,
            'forecast': forecast,
            'seasonality': {}
        }
    
    def generate_pareto(self) -> Dict[str, Any]:
        pts = []
        for pid, a in self.analyzed_data.items():
            qb = a.get('bayes_analysis', {}).get('quality_bayes')
            dn = a.get('decay_analysis', {}).get('difficulty_decayed')
            n  = a.get('n_reviews', 0)
            if qb is None or dn is None or n < 3:
                continue
            pts.append({"id": pid, "nombre": a.get("nombre", ""), "x": dn, "y": qb, "n": n})
        pts.sort(key=lambda p: (p["x"], -p["y"]))  # x asc, y desc
        efficient = []
        best_y = -1
        for p in pts:
            if p["y"] > best_y:
                efficient.append(p["id"])
                best_y = p["y"]
        return {"points": pts, "efficient_ids": efficient}

    def _build_list_min(self) -> List[Dict[str, Any]]:
        items = []
        for pid, a in self.analyzed_data.items():
            if 'error' in a:
                continue
            items.append({
                "id": pid,
                "nombre": a.get("nombre", ""),
                "universidad": a.get("universidad", ""),
                "n": a.get("n_reviews", 0),
                "quality_bayes": (a.get("bayes_analysis", {}) or {}).get("quality_bayes"),
                "difficulty_now": (a.get("decay_analysis", {}) or {}).get("difficulty_decayed"),
                "rec_rate": (a.get("recommendation_analysis", {}) or {}).get("rate"),
                "rec_ci95": (a.get("recommendation_analysis", {}) or {}).get("wilson_interval"),
                "z_mean_decayed": ((a.get("subject_normalization", {}) or {}).get("z_mean_decayed")),
                "trust_score": ((a.get("integrity_analysis", {}) or {}).get("trust_score")),
            })
        return items

    def build_subject_indices(self) -> None:
        bucket = defaultdict(list)
        for pid, a in self.analyzed_data.items():
            per = (a.get("subject_normalization") or {}).get("per_subject") or []
            for s in per:
                bucket[s["materia"]].append({
                    "id": pid,
                    "nombre": a.get("nombre",""),
                    "z_decayed": s.get("z_decayed"),
                    "quality_bayes": (a.get("bayes_analysis",{}) or {}).get("quality_bayes"),
                    "difficulty_now": (a.get("decay_analysis",{}) or {}).get("difficulty_decayed"),
                    "n": a.get("n_reviews",0)
                })
        for materia, arr in bucket.items():
            arr.sort(key=lambda x: (x["z_decayed"] if x["z_decayed"] is not None else -999), reverse=True)
            safe = re.sub(r'[^A-Z0-9_-]+', '_', materia.upper())
            self._save_json(f"indices/subjects/{safe}.json", arr)

    def analyze_all_professors(self) -> Dict[str, Any]:
        """Analiza todos los profesores y genera resultados completos"""
        print("Analizando todos los profesores...")
        
        self.analyzed_data = {}
        for prof_id, data in self.professors_data.items():
            try:
                analysis = self.analyze_professor(prof_id, data)
                self.analyzed_data[prof_id] = analysis
                self._save_professor_file(prof_id, analysis)   # <-- guarda 1 archivo por profe
            except Exception as e:
                print(f"Error analizando {prof_id}: {e}")
        
        # índices
        list_min = self._build_list_min()
        self._save_json("indices/list-min.json", list_min)

        pareto = self.generate_pareto()
        self._save_json("indices/pareto.json", pareto)

        # meta mínimo
        meta = {
            "schema_version": "1.0",
            "generated_at": datetime.now().isoformat(),
            "params": {"half_life_months": 24, "bayes_k": 10, "wilson_confidence": 0.95},
            "global_stats": self.global_stats,
            "professors_count": len(self.analyzed_data)
        }
        self._save_json("indices/meta.json", meta)

        # opcional: rankings por materia
        # self.build_subject_indices()

        return {
            "global_stats": self.global_stats,
            "subject_stats": self.subject_stats,
            "professors": self.analyzed_data,  # útil para tests; el frontend NO necesita esto
            "pareto": pareto,
            "list_min_len": len(list_min)
        }
    
    def _generate_comparison_data(self) -> List[Dict]:
        """Genera datos para comparación A/B/C"""
        comparison_metrics = []
        
        for prof_id, analysis in self.analyzed_data.items():
            if 'error' in analysis:
                continue
                
            metrics = {
                'id': prof_id,
                'name': analysis.get('nombre', ''),
                'quality_bayes': analysis.get('bayes_analysis', {}).get('quality_bayes'),
                'difficulty_now': analysis.get('decay_analysis', {}).get('difficulty_decayed'),
                'rec_ic': analysis.get('recommendation_analysis', {}).get('wilson_interval'),
                'n': analysis.get('n_reviews', 0)
            }
            comparison_metrics.append(metrics)
        
        return comparison_metrics
    
    def save_results(self, output_file: str = 'advanced_analysis_results.json'):
        """Guarda los resultados del análisis"""
        results = self.analyze_all_professors()
        
        # Ensure all data is JSON serializable
        def make_serializable(obj):
            if isinstance(obj, dict):
                return {k: make_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_serializable(item) for item in obj]
            elif isinstance(obj, bool):
                return int(obj)
            elif isinstance(obj, (np.integer, np.floating)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif obj is None:
                return None
            else:
                return obj
        
        results = make_serializable(results)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"Resultados guardados en {output_file}")
        return results

def main():
    analyzer = ProfessorAnalyzer(data_dir="profesores_json", out_dir="out")
    analyzer.load_all_data()
    results = analyzer.analyze_all_professors()
    print("\nOK. Archivos generados en ./out")
    print(f"- Profesores: {results['list_min_len']} en indices/list-min.json")
    print(f"- Pareto: {len(results['pareto']['points'])} puntos, {len(results['pareto']['efficient_ids'])} eficientes")

if __name__ == "__main__":
    main()
