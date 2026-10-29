# Bakelicious ERP - Dedicated Bakery Management System
> *Internal Business Management & Atelier Operations Platform*

Bakelicious ERP is a full-stack, dedicated enterprise resource planning (ERP) system built exclusively for artisanal bakery operations. It manages client orders, production queues, master recipes, raw material inventory, automated costing, financial analytics, and official luxury cream invoice generation.

![Bakelicious Logo](frontend/public/logo.png)

---

## Architecture & Technology Stack

- **Frontend (Web Application):** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, FullCalendar, Recharts, `html2canvas` & `jsPDF` for luxury client invoicing.
- **Backend (REST API):** Python 3.10+, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, JWT Security & Bcrypt, Alembic, ReportLab.
- **Database:** SQLite for local development (`bakelicious.db`), PostgreSQL-ready via `DATABASE_URL`.
- **Media Uploads:** Local file system upload with image optimization and preview.

---

## Core ERP Modules

1. **Executive Dashboard (`/admin/dashboard`):** Live revenue tracking, profit curves, active orders summary, and automated low-stock ingredient alerts.
2. **Orders & Client Management (`/admin/orders`, `/admin/clients`):** Multi-item order creation, client contact records, advance payment tracking, and stage transitions (`Received` $\rightarrow$ `Delivered`).
3. **Production Queue (`/admin/production`):** Baker-focused Kanban workflow tracking orders through `Not Started`, `Preparing`, `Baking`, `Decorating`, `Ready`, and `Completed`.
4. **Products & Master Recipes (`/admin/products`, `/admin/categories`):** Cake catalog, size variants (1 lb, 2 lb, Bento), ingredients formula per cake, and automated cost-of-goods calculations.
5. **Delivery Calendar (`/admin/calendar`):** Interactive calendar scheduling delivery dates and baker assignments.
6. **Invoice Generator (`/admin/receipts`):** Official client invoice generator formatted on a pure `#FDF6EB` luxury cream background with `#540808` maroon branding, single A4 page guarantee, signature line, and dynamic client-named PDF export (`[CustomerName]_invoice.pdf`).
7. **Inventory & Costing (`/admin/inventory`, `/admin/costing`):** Real-time ingredient stock valuation, reorder thresholds, and profit margin analysis.
8. **Staff & RBAC Permissions (`/admin/employees`, `/admin/roles`):** Role-based access control with granular permission assignment (Super Admin, Baker, Front-Desk Staff).

---

## Quick Start (Local Setup)

### 1. Backend Server

```bash
cd backend

# Create & activate Python virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies and seed standard data
pip install -r requirements.txt
python seed.py

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```
API runs at `http://localhost:8000`. Swagger API docs available at `http://localhost:8000/docs`.

### 2. Frontend Application

```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
ERP portal runs at `http://localhost:3000`. Navigating to `http://localhost:3000` automatically directs to the ERP authentication gate (`/admin/login`).

---

## Default Super Admin Credentials

- **Email / Username:** `admin@bakelicious.com`
- **Password:** `admin123`
