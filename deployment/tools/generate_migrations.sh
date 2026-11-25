
#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_NAME="JALALI COSMETICS"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

echo "======================================"
echo "$PROJECT_NAME"
echo "DJANGO MIGRATION GENERATOR"
echo "======================================"

if ! command -v python >/dev/null 2>&1; then
    echo "ERROR: Python is not installed."
    exit 1
fi

if [[ ! -f "$BACKEND_DIR/manage.py" ]]; then
    echo "ERROR: backend/manage.py not found."
    exit 1
fi

cd "$BACKEND_DIR"

echo
echo "[1] Python version"
python --version

echo
echo "[2] Installing backend requirements"
python -m pip install -r requirements.txt

echo
echo "[3] Django configuration check"
python manage.py check

echo
echo "[4] Generating migrations"
python manage.py makemigrations

echo
echo "[5] Checking migration plan"
python manage.py migrate --plan

echo
echo "======================================"
echo "MIGRATION GENERATION FINISHED"
echo "Review the generated files and plan."
echo "No database migrations were applied."
echo "======================================"
