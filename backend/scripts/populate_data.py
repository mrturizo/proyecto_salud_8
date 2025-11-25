#!/usr/bin/env python3
"""
Script para poblar la base de datos con datos de prueba usando Faker.
Genera 100+ pacientes con consultas distribuidas en diferentes familias.
"""

import sqlite3
import random
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

try:
    from faker import Faker
except ImportError:
    print("❌ Error: Faker no está instalado. Ejecuta: pip install faker")
    sys.exit(1)

# Configurar Faker en español colombiano
fake = Faker('es_CO')
Faker.seed(42)  # Para resultados reproducibles
random.seed(42)

# Rutas de la base de datos
SCRIPT_DIR = Path(__file__).parent.parent
DB_SOURCE = SCRIPT_DIR / 'database' / 'salud_digital_aps.db'
DB_TMP = '/tmp/salud_digital_aps.db'

# Determinar qué base de datos usar
if os.path.exists(DB_TMP):
    db_path = DB_TMP
elif os.path.exists(DB_SOURCE):
    db_path = str(DB_SOURCE)
else:
    print(f"❌ Error: No se encontró la base de datos en {DB_SOURCE} ni en {DB_TMP}")
    sys.exit(1)

print(f"📊 Usando base de datos: {db_path}")

# Conectar a la base de datos
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Motivos de consulta realistas
MOTIVOS_CONSULTA = [
    "Dolor de cabeza",
    "Fiebre",
    "Control médico",
    "Dolor abdominal",
    "Tos persistente",
    "Dolor de garganta",
    "Control de presión arterial",
    "Dolor en las articulaciones",
    "Cansancio",
    "Mareos",
    "Control de diabetes",
    "Dolor de espalda",
    "Resfriado común",
    "Consulta de rutina",
    "Seguimiento de tratamiento",
    "Dolor de oído",
    "Problemas digestivos",
    "Ansiedad",
    "Insomnio",
    "Dolor muscular"
]

# Diagnósticos CIE10 comunes (códigos reales)
DIAGNOSTICOS_CIE10 = [
    "A00.9",  # Cólera no especificado
    "A09.9",  # Gastroenteritis y colitis de origen no especificado
    "B34.9",  # Infección viral no especificada
    "E11.9",  # Diabetes mellitus tipo 2 sin complicaciones
    "E78.5",  # Hiperlipidemia no especificada
    "F41.9",  # Trastorno de ansiedad no especificado
    "G44.2",  # Cefalea tensional
    "I10",    # Hipertensión esencial (primaria)
    "J00",    # Resfriado común
    "J06.9",  # Infección aguda de las vías respiratorias superiores no especificada
    "K59.0",  # Estreñimiento
    "M54.5",  # Dolor lumbar bajo
    "N39.0",  # Infección de las vías urinarias no especificada
    "R05",    # Tos
    "R06.0",  # Disnea
    "R50.9",  # Fiebre no especificada
    "R51",    # Cefalea
    "R52",    # Dolor no clasificado en otra parte
    "Z00.0",  # Examen médico general
    "Z00.1"   # Examen de rutina del niño
]

def obtener_o_crear_usuario_medico():
    """Obtiene un usuario médico existente o crea uno nuevo."""
    # Buscar usuario médico existente
    cursor.execute("""
        SELECT usuario_id FROM Usuarios 
        WHERE rol_id = (SELECT rol_id FROM Roles WHERE nombre_rol = 'Médico' LIMIT 1)
        OR email LIKE '%medico%' OR email LIKE '%doctor%'
        LIMIT 1
    """)
    row = cursor.fetchone()
    
    if row:
        usuario_id = row['usuario_id']
        print(f"✅ Usando usuario médico existente: {usuario_id}")
        return usuario_id
    
    # Obtener o crear rol Médico
    cursor.execute("SELECT rol_id FROM Roles WHERE nombre_rol = 'Médico' LIMIT 1")
    rol_row = cursor.fetchone()
    
    if rol_row:
        rol_id = rol_row['rol_id']
    else:
        # Crear rol Médico si no existe
        cursor.execute("INSERT INTO Roles (nombre_rol) VALUES ('Médico')")
        rol_id = cursor.lastrowid
        print(f"✅ Rol Médico creado: {rol_id}")
    
    # Crear usuario médico
    nombre = fake.name()
    email = f"medico.{fake.user_name()}@salud.gov.co"
    numero_doc = str(fake.random_number(digits=10, fix_len=True))
    
    cursor.execute("""
        INSERT INTO Usuarios (nombre_completo, email, numero_documento, rol_id, activo)
        VALUES (?, ?, ?, ?, 1)
    """, (nombre, email, numero_doc, rol_id))
    
    usuario_id = cursor.lastrowid
    print(f"✅ Usuario médico creado: {usuario_id} - {nombre}")
    return usuario_id

def obtener_cie10_desde_archivo():
    """Intenta obtener códigos CIE10 desde archivos CSV."""
    possible_paths = [
        SCRIPT_DIR.parent / 'terminology-data' / 'cie10_colombia.csv',
        SCRIPT_DIR.parent / 'terminology-data' / 'cie10_subset.csv',
    ]
    
    for csv_path in possible_paths:
        if csv_path.exists():
            try:
                import csv
                codes = []
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        code = row.get('code') or row.get('codigo') or row.get('CIE10', '')
                        if code and code.strip():
                            codes.append(code.strip())
                
                if codes:
                    print(f"✅ Cargados {len(codes)} códigos CIE10 desde {csv_path.name}")
                    return codes[:50]  # Limitar a 50 para variedad
            except Exception as e:
                print(f"⚠️  Error leyendo {csv_path}: {e}")
    
    print("⚠️  No se encontraron archivos CIE10, usando códigos predefinidos")
    return DIAGNOSTICOS_CIE10

def calcular_imc(peso, talla):
    """Calcula el IMC."""
    if peso and talla and talla > 0:
        return round(peso / ((talla / 100) ** 2), 1)
    return None

def generar_signos_vitales(edad):
    """Genera signos vitales según la edad."""
    if edad < 12:  # Niño
        return {
            'tension_sistolica': random.randint(90, 110),
            'tension_diastolica': random.randint(50, 70),
            'frecuencia_cardiaca': random.randint(80, 120),
            'frecuencia_respiratoria': random.randint(20, 30),
            'saturacion_oxigeno': random.randint(95, 100),
            'temperatura': round(random.uniform(36.0, 37.5), 1),
        }
    elif edad < 60:  # Adulto
        return {
            'tension_sistolica': random.randint(100, 140),
            'tension_diastolica': random.randint(60, 90),
            'frecuencia_cardiaca': random.randint(60, 100),
            'frecuencia_respiratoria': random.randint(16, 22),
            'saturacion_oxigeno': random.randint(95, 100),
            'temperatura': round(random.uniform(36.0, 37.2), 1),
        }
    else:  # Adulto mayor
        return {
            'tension_sistolica': random.randint(110, 150),
            'tension_diastolica': random.randint(70, 95),
            'frecuencia_cardiaca': random.randint(60, 90),
            'frecuencia_respiratoria': random.randint(14, 20),
            'saturacion_oxigeno': random.randint(93, 99),
            'temperatura': round(random.uniform(35.8, 37.0), 1),
        }

def generar_peso_talla(edad, genero):
    """Genera peso y talla según edad y género."""
    if edad < 2:  # Bebé
        peso = round(random.uniform(3.0, 12.0), 1)
        talla = random.randint(50, 85)
    elif edad < 12:  # Niño
        peso = round(random.uniform(15.0, 45.0), 1)
        talla = random.randint(85, 150)
    elif edad < 18:  # Adolescente
        if genero == 'M':
            peso = round(random.uniform(45.0, 75.0), 1)
            talla = random.randint(150, 180)
        else:
            peso = round(random.uniform(40.0, 65.0), 1)
            talla = random.randint(145, 170)
    else:  # Adulto
        if genero == 'M':
            peso = round(random.uniform(60.0, 90.0), 1)
            talla = random.randint(160, 185)
        else:
            peso = round(random.uniform(50.0, 75.0), 1)
            talla = random.randint(150, 170)
    
    imc = calcular_imc(peso, talla)
    return peso, talla, imc

def crear_familia(usuario_id):
    """Crea una familia."""
    apellido = fake.last_name()
    direccion = fake.address().replace('\n', ', ')
    municipio = fake.city()
    barrio = fake.neighborhood() if hasattr(fake, 'neighborhood') else fake.street_name()
    
    cursor.execute("""
        INSERT INTO Familias (
            apellido_principal, direccion, barrio_vereda, municipio,
            telefono_contacto, zona, territorio, tipo_familia, creado_por_uid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        apellido,
        direccion,
        barrio,
        municipio,
        fake.phone_number(),
        random.choice(['Urbana', 'Rural']),
        fake.street_name(),
        random.choice(['Nuclear', 'Extensa', 'Monoparental', 'Compuesta']),
        usuario_id
    ))
    
    return cursor.lastrowid

def crear_paciente(familia_id):
    """Crea un paciente."""
    tipo_doc = random.choice(['CC', 'TI', 'CE'])
    numero_doc = str(fake.random_number(digits=10, fix_len=True))
    
    # Verificar que no exista
    cursor.execute("SELECT paciente_id FROM Pacientes WHERE numero_documento = ?", (numero_doc,))
    if cursor.fetchone():
        # Si existe, generar otro
        numero_doc = str(fake.random_number(digits=10, fix_len=True))
    
    primer_nombre = fake.first_name()
    segundo_nombre = fake.first_name() if random.random() > 0.3 else None
    primer_apellido = fake.last_name()
    segundo_apellido = fake.last_name() if random.random() > 0.5 else None
    
    fecha_nac = fake.date_of_birth(minimum_age=0, maximum_age=85)
    genero = random.choice(['M', 'F'])
    
    cursor.execute("""
        INSERT INTO Pacientes (
            familia_id, tipo_documento, numero_documento,
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
            fecha_nacimiento, genero, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        familia_id, tipo_doc, numero_doc,
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        fecha_nac.isoformat(), genero
    ))
    
    paciente_id = cursor.lastrowid
    edad = (datetime.now().date() - fecha_nac).days // 365
    
    return paciente_id, edad, genero

def crear_consulta(paciente_id, usuario_id, fecha_atencion, edad, genero, diagnosticos_cie10):
    """Crea una consulta médica con historia clínica."""
    # Crear atención clínica
    cursor.execute("""
        INSERT INTO Atenciones_Clinicas (
            paciente_id, usuario_id, fecha_atencion, tipo_atencion, estado
        ) VALUES (?, ?, ?, ?, ?)
    """, (paciente_id, usuario_id, fecha_atencion, 'Consulta Médica', 'Completada'))
    
    atencion_id = cursor.lastrowid
    
    # Generar datos de la consulta
    motivo = random.choice(MOTIVOS_CONSULTA)
    diagnostico = random.choice(diagnosticos_cie10)
    enfermedad_actual = f"Paciente refiere {motivo.lower()} desde hace {random.randint(1, 7)} días."
    
    signos = generar_signos_vitales(edad)
    peso, talla, imc = generar_peso_talla(edad, genero)
    
    examen_fisico = f"Paciente en buen estado general. {random.choice(['Sin alteraciones', 'Leve palidez', 'Buen estado de hidratación'])}."
    plan_manejo = f"Tratamiento sintomático. {random.choice(['Control en 7 días', 'Seguimiento según evolución', 'Control en 15 días'])}."
    
    hora_consulta = f"{random.randint(8, 17):02d}:{random.randint(0, 59):02d}"
    
    # Insertar historia clínica
    cursor.execute("""
        INSERT INTO HC_Medicina_General (
            atencion_id, hora_consulta, motivo_consulta, enfermedad_actual,
            diagnosticos_cie10, examen_fisico, plan_manejo,
            tension_arterial_sistolica, tension_arterial_diastolica,
            frecuencia_cardiaca, frecuencia_respiratoria,
            saturacion_oxigeno, temperatura,
            peso, talla, imc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        atencion_id, hora_consulta, motivo, enfermedad_actual,
        diagnostico, examen_fisico, plan_manejo,
        signos['tension_sistolica'], signos['tension_diastolica'],
        signos['frecuencia_cardiaca'], signos['frecuencia_respiratoria'],
        signos['saturacion_oxigeno'], signos['temperatura'],
        peso, talla, imc
    ))
    
    return atencion_id

def main():
    """Función principal."""
    print("🚀 Iniciando población de datos...")
    print("=" * 60)
    
    try:
        # Obtener usuario médico
        usuario_id = obtener_o_crear_usuario_medico()
        
        # Obtener códigos CIE10
        diagnosticos_cie10 = obtener_cie10_desde_archivo()
        
        # Crear familias
        num_familias = 18
        print(f"\n📋 Creando {num_familias} familias...")
        familias = []
        for i in range(num_familias):
            familia_id = crear_familia(usuario_id)
            familias.append(familia_id)
            if (i + 1) % 5 == 0:
                print(f"  ✅ {i + 1}/{num_familias} familias creadas")
        
        conn.commit()
        print(f"✅ {num_familias} familias creadas\n")
        
        # Crear pacientes y consultas
        total_pacientes = 0
        total_consultas = 0
        pacientes_multiples_consultas = []
        
        print(f"👥 Creando pacientes y consultas...")
        for familia_id in familias:
            # 5-8 pacientes por familia
            num_pacientes = random.randint(5, 8)
            
            for _ in range(num_pacientes):
                paciente_id, edad, genero = crear_paciente(familia_id)
                total_pacientes += 1
                
                # Al menos 1 consulta por paciente
                fecha_base = datetime.now() - timedelta(days=random.randint(0, 180))
                fecha_atencion = fecha_base.strftime('%Y-%m-%d')
                crear_consulta(paciente_id, usuario_id, fecha_atencion, edad, genero, diagnosticos_cie10)
                total_consultas += 1
                
                # Seleccionar algunos pacientes para múltiples consultas (10+ pacientes)
                if len(pacientes_multiples_consultas) < 12 and random.random() > 0.7:
                    pacientes_multiples_consultas.append((paciente_id, edad, genero))
            
            if total_pacientes % 20 == 0:
                print(f"  ✅ {total_pacientes} pacientes creados...")
                conn.commit()
        
        conn.commit()
        print(f"✅ {total_pacientes} pacientes creados con al menos 1 consulta\n")
        
        # Crear múltiples consultas para algunos pacientes
        print(f"📅 Creando consultas adicionales para {len(pacientes_multiples_consultas)} pacientes...")
        for paciente_id, edad, genero in pacientes_multiples_consultas:
            num_consultas_adicionales = random.randint(1, 4)  # 2-5 consultas totales
            
            for i in range(num_consultas_adicionales):
                # Distribuir consultas en el tiempo (últimos 6-12 meses)
                dias_atras = random.randint(30, 365)
                fecha_atencion = (datetime.now() - timedelta(days=dias_atras)).strftime('%Y-%m-%d')
                crear_consulta(paciente_id, usuario_id, fecha_atencion, edad, genero, diagnosticos_cie10)
                total_consultas += 1
        
        conn.commit()
        print(f"✅ Consultas adicionales creadas\n")
        
        # Resumen final
        print("=" * 60)
        print("✅ Población de datos completada exitosamente!")
        print(f"📊 Resumen:")
        print(f"   - Familias: {num_familias}")
        print(f"   - Pacientes: {total_pacientes}")
        print(f"   - Consultas: {total_consultas}")
        print(f"   - Pacientes con múltiples consultas: {len(pacientes_multiples_consultas)}")
        print("=" * 60)
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante la población de datos: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()

