#!/usr/bin/env python3
"""
Script para generar demandas inducidas asignadas a diferentes usuarios.
Genera múltiples demandas para el Dr. Carlos Mendoza y otros usuarios.
"""

import sqlite3
import random
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

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

# Tipos de diligenciamiento comunes
DILIGENCIAMIENTOS = [
    "Atención para el cuidado preconcepcional",
    "Salud mental",
    "Control de crecimiento y desarrollo",
    "Atención en salud sexual y reproductiva",
    "Prevención de enfermedades crónicas",
    "Promoción de hábitos saludables",
    "Control prenatal",
    "Atención en salud bucal",
    "Prevención de enfermedades transmisibles",
    "Atención en salud mental",
    "Control de vacunación",
    "Atención nutricional",
    "Prevención de violencia",
    "Atención en salud visual",
    "Control de enfermedades crónicas"
]

# Estados posibles
ESTADOS = ['Pendiente', 'Asignada', 'En proceso']

def obtener_usuarios_medicos():
    """Obtiene todos los usuarios médicos disponibles."""
    cursor.execute("""
        SELECT u.usuario_id, u.nombre_completo, u.email
        FROM Usuarios u
        LEFT JOIN Roles r ON u.rol_id = r.rol_id
        WHERE (r.nombre_rol = 'Médico' OR u.email LIKE '%medico%' OR u.email LIKE '%doctor%' OR u.nombre_completo LIKE '%Carlos%')
        AND u.activo = 1
        ORDER BY u.usuario_id
    """)
    usuarios = cursor.fetchall()
    
    if not usuarios:
        print("⚠️  No se encontraron usuarios médicos, creando uno...")
        # Crear un usuario médico por defecto
        cursor.execute("""
            INSERT INTO Usuarios (nombre_completo, email, numero_documento, activo)
            VALUES ('Dr. Médico Demo', 'medico.demo@salud.gov.co', '1000000000', 1)
        """)
        usuario_id = cursor.lastrowid
        conn.commit()
        cursor.execute("SELECT usuario_id, nombre_completo, email FROM Usuarios WHERE usuario_id = ?", (usuario_id,))
        usuarios = cursor.fetchall()
    
    return usuarios

def obtener_pacientes_aleatorios(limite=50):
    """Obtiene pacientes aleatorios para asignar demandas."""
    cursor.execute("""
        SELECT paciente_id, primer_nombre, primer_apellido, numero_documento
        FROM Pacientes
        WHERE activo = 1
        ORDER BY RANDOM()
        LIMIT ?
    """, (limite,))
    return cursor.fetchall()

def crear_demanda_inducida(paciente_id, asignado_a_uid, solicitado_por_uid, fecha_demanda):
    """Crea una demanda inducida."""
    diligenciamiento = random.sample(DILIGENCIAMIENTOS, random.randint(1, 3))
    estado = random.choice(ESTADOS)
    
    # Generar número de formulario
    numero_formulario = f"DEM-{random.randint(1000, 9999)}-{datetime.now().year}"
    
    # Remisión a profesionales (puede incluir múltiples profesionales)
    remision_a = {
        "profesionales": [asignado_a_uid],
        "tipo": random.choice(["Consulta médica", "Control", "Seguimiento", "Atención especializada"])
    }
    
    # Seguimiento básico
    seguimiento = {
        "fecha_seguimiento": None,
        "observaciones": None,
        "medio": None,
        "verificado": False
    }
    
    cursor.execute("""
        INSERT INTO Demandas_Inducidas (
            numero_formulario, paciente_id, fecha_demanda, diligenciamiento,
            remision_a, estado, asignado_a_uid, solicitado_por_uid, seguimiento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        numero_formulario,
        paciente_id,
        fecha_demanda,
        json.dumps(diligenciamiento),
        json.dumps(remision_a),
        estado,
        asignado_a_uid,
        solicitado_por_uid,
        json.dumps(seguimiento)
    ))
    
    return cursor.lastrowid

def main():
    """Función principal."""
    print("🚀 Iniciando generación de demandas inducidas...")
    print("=" * 60)
    
    try:
        # Obtener usuarios médicos
        usuarios = obtener_usuarios_medicos()
        print(f"\n👨‍⚕️ Usuarios médicos encontrados: {len(usuarios)}")
        for usuario in usuarios:
            print(f"   - {usuario['nombre_completo']} (ID: {usuario['usuario_id']})")
        
        if not usuarios:
            print("❌ No hay usuarios médicos disponibles")
            return
        
        # Buscar específicamente a Carlos Mendoza
        carlos_mendoza = None
        for usuario in usuarios:
            if 'carlos' in usuario['nombre_completo'].lower() or 'carlos' in usuario['email'].lower():
                carlos_mendoza = usuario
                break
        
        if not carlos_mendoza:
            # Usar el primer usuario como Carlos Mendoza si no se encuentra
            carlos_mendoza = usuarios[0]
            print(f"\n⚠️  Carlos Mendoza no encontrado, usando: {carlos_mendoza['nombre_completo']}")
        else:
            print(f"\n✅ Dr. Carlos Mendoza encontrado: {carlos_mendoza['nombre_completo']} (ID: {carlos_mendoza['usuario_id']})")
        
        # Obtener pacientes
        pacientes = obtener_pacientes_aleatorios(100)
        print(f"\n👥 Pacientes disponibles: {len(pacientes)}")
        
        if not pacientes:
            print("❌ No hay pacientes disponibles")
            return
        
        # Generar demandas
        total_demandas = 0
        demandas_por_usuario = {}
        
        # Asignar más demandas a Carlos Mendoza (al menos 15-20)
        num_demandas_carlos = random.randint(15, 25)
        print(f"\n📋 Generando {num_demandas_carlos} demandas para Dr. Carlos Mendoza...")
        
        pacientes_carlos = random.sample(pacientes, min(num_demandas_carlos, len(pacientes)))
        for paciente in pacientes_carlos:
            # Fecha aleatoria en los últimos 3 meses
            dias_atras = random.randint(0, 90)
            fecha_demanda = (datetime.now() - timedelta(days=dias_atras)).strftime('%Y-%m-%d')
            
            demanda_id = crear_demanda_inducida(
                paciente['paciente_id'],
                carlos_mendoza['usuario_id'],  # Asignado a
                carlos_mendoza['usuario_id'],   # Solicitado por
                fecha_demanda
            )
            total_demandas += 1
            demandas_por_usuario[carlos_mendoza['usuario_id']] = demandas_por_usuario.get(carlos_mendoza['usuario_id'], 0) + 1
        
        conn.commit()
        print(f"✅ {num_demandas_carlos} demandas creadas para Dr. Carlos Mendoza\n")
        
        # Asignar demandas a otros usuarios (5-10 por usuario)
        otros_usuarios = [u for u in usuarios if u['usuario_id'] != carlos_mendoza['usuario_id']]
        
        if otros_usuarios:
            print(f"📋 Generando demandas para otros {len(otros_usuarios)} usuarios...")
            pacientes_restantes = [p for p in pacientes if p['paciente_id'] not in [pac['paciente_id'] for pac in pacientes_carlos]]
            
            for usuario in otros_usuarios:
                num_demandas = random.randint(5, 12)
                pacientes_usuario = random.sample(pacientes_restantes, min(num_demandas, len(pacientes_restantes)))
                
                for paciente in pacientes_usuario:
                    dias_atras = random.randint(0, 90)
                    fecha_demanda = (datetime.now() - timedelta(days=dias_atras)).strftime('%Y-%m-%d')
                    
                    demanda_id = crear_demanda_inducida(
                        paciente['paciente_id'],
                        usuario['usuario_id'],
                        random.choice([carlos_mendoza['usuario_id'], usuario['usuario_id']]),  # Solicitado por
                        fecha_demanda
                    )
                    total_demandas += 1
                    demandas_por_usuario[usuario['usuario_id']] = demandas_por_usuario.get(usuario['usuario_id'], 0) + 1
                
                conn.commit()
                print(f"   ✅ {num_demandas} demandas para {usuario['nombre_completo']}")
        
        # Resumen final
        print("\n" + "=" * 60)
        print("✅ Generación de demandas completada exitosamente!")
        print(f"📊 Resumen:")
        print(f"   - Total de demandas creadas: {total_demandas}")
        print(f"\n   Demandas por usuario:")
        for usuario_id, count in demandas_por_usuario.items():
            usuario_nombre = next((u['nombre_completo'] for u in usuarios if u['usuario_id'] == usuario_id), f"Usuario {usuario_id}")
            print(f"   - {usuario_nombre}: {count} demandas")
        print("=" * 60)
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante la generación de demandas: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()



