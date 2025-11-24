# Comandos para subir al repositorio GitHub

Ejecuta estos comandos en tu terminal desde la carpeta del proyecto:

## 1. Inicializar Git (si no está inicializado)
```bash
git init
```

## 2. Agregar el repositorio remoto
```bash
git remote add origin https://github.com/MafeTello/APS_uao.git
```

## 3. Verificar el estado de los archivos
```bash
git status
```

## 4. Agregar todos los archivos al staging
```bash
git add .
```

## 5. Hacer commit con mensaje descriptivo
```bash
git commit -m "feat: implementar sistema de autenticación y autorización por roles

- Agregar sistema de login con 10 roles de usuario
- Implementar autenticación con credenciales específicas
- Crear componentes de protección de rutas
- Agregar persistencia de sesión con localStorage
- Implementar control de acceso por roles
- Crear interfaz responsive para todos los dispositivos
- Agregar manejo de errores y validaciones"
```

## 6. Subir al repositorio (primera vez)
```bash
git push -u origin main
```

## Para actualizaciones futuras:
```bash
git add .
git commit -m "tu mensaje de commit"
git push
```

## Comandos útiles adicionales:

### Ver el historial de commits
```bash
git log --oneline
```

### Ver diferencias antes de commit
```bash
git diff
```

### Ver el estado del repositorio
```bash
git status
```

### Crear una nueva rama
```bash
git checkout -b nombre-de-la-rama
```

### Cambiar entre ramas
```bash
git checkout main
git checkout nombre-de-la-rama
```