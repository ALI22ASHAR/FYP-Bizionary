# 🚀 Bizionary ERP System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2.7-green.svg?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3.3-orange.svg)](https://groq.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT_Models-purple.svg?logo=openai&logoColor=white)](https://openai.com/)

**Bizionary ERP** is a full-stack, enterprise-grade Enterprise Resource Planning (ERP) and business intelligence platform designed specifically to streamline operational workflows for Small and Medium Enterprises (SMEs). 

It unifies core corporate operations—including product catalogs, real-time inventory ledgers, multi-channel sales tracking, procurement workflows, client invoicing, double-entry financial accounting, and user-access management—into a centralized, secure repository. Furthermore, Bizionary embeds an agentic AI chatbot and predictive analytics services to assist managers in executing data-driven operations.

---

## 🌟 Key Features

*   **📊 Dynamic Dashboard:** Real-time KPI summaries, live cash flow metrics, period-filtered revenues, and interactive sales/financial charts (Recharts & ECharts).
*   **📦 Product & Stock Management:** Complete CRUD capabilities, dynamic low-stock reorder warnings, automated stock ledger tracing, and bulk stock adjustments.
*   **🔌 Procurement Workflow:** Supplier registry, ordered slips management, automated delivery due-date alerts, and line-item receiving tracking.
*   **💰 Sales & Returns Ledger:** Invoicing tracking, sales returns handling, automatic Cost-of-Goods-Sold (COGS) snapshots, and payment-method breakdown.
*   **📖 Double-Entry Accounting:** Multi-level Chart of Accounts (COA), journal entries, credit/debit balances, automated revenue/expense logging, and expense budget tracking with variance analysis.
*   **🤖 Groq AI Chatbot Assistant:** RAG-enabled chatbot utilizing Groq tool-use (function calling) to list low-stock items, summarize unpaid invoices, query sales trends, and output visual charts.
*   **📈 AI Analytics Engine:** Automated NLP reporting, pricing suggestions based on sales velocity, sentiment evaluation on customer feedback, and smart reordering quantity calculations.
*   **🔑 API Key Config Manager:** Secure dynamic configuration allowing administrators to add, test, cache, and rotate third-party API keys through the UI.
*   **📁 Excel Parser:** A month-flexible parser powered by Pandas and OpenPyXL to ingest monthly sales files from raw operational workbooks.

---

## 🏗️ System Architecture

Bizionary ERP follows a **3-Tier Client-Server Architecture** augmented with an external **Cognitive/AI Service Layer**.

### High-Level Architecture Diagram
```mermaid
flowchart TD
    subgraph Client Tier [Frontend Client - React]
        UI[Vite Single Page App]
        State[React Context / Custom Hooks]
        Chart[Recharts / ECharts Graphics]
        Doc[PDF / Canvas Export]
    end

    subgraph Application Tier [Backend Server - Django REST]
        Router[API Gateway / DRF Routers]
        Controllers[API Viewsets & Views]
        Signals[Django Signals Event Router]
        Services[Business Logic Service Layer]
        Parser[Excel Ingestion Engine]
        Cache[API Key Caching Mechanism]
    end

    subgraph Database Tier [Relational Storage]
        DB[(SQLite / PostgreSQL)]
        COA[Ledgers & Journal Tables]
        Inv[Product & Txn Tables]
        Aud[Audit Log Tables]
    end

    subgraph Cognitive Tier [External AI Providers]
        Groq[Groq Llama 3.3 API]
        OpenAI[OpenAI GPT Models]
    end

    %% Client and Backend Connection
    UI <-->|HTTPS REST Requests / JWT Auth| Router
    Router <--> Controllers
    Controllers <--> Services
    Services <--> Parser

    %% Event Signals and DB
    Controllers <--> DB
    Services <--> DB
    Signals -->|Atomic Updates| DB
    DB -.->|Signals Trigger| Signals

    %% API Keys and AI Connections
    Services <--> Cache
    Cache <--> DB
    Services <-->|Function Calling / JSON| Groq
    Services <-->|Completion Prompt / Context| OpenAI
```

### Entity Relationship Diagram (ERD) Outline
*   **Product:** SKU, Barcode, Category, Prices, Stock counts.
*   **InventoryTransaction:** Track all stock ins/outs linked to Sales, Purchases, or Adjustments.
*   **Sale & SaleItem:** Core sales logs linked to client invoices.
*   **Supplier & Purchase:** Procurement logs.
*   **Double-Entry Journal & Ledger:** Ledger accounts (Assets, Liabilities, Equity, Revenue, Expenses) synchronized atomically via Django signals upon any transaction save.

---

## 💻 Tech Stack

| Tier | Technology | Specific Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 19.2 (Vite) | Single-page application (SPA) with fast hot-reloading and modular UI. |
| **Styling & UI** | Tailwind CSS v4, Lucide Icons | Responsive modern design system with custom utility styling. |
| **Data Viz** | Recharts & ECharts | Real-time financial graphs, KPI trackers, and trend analytics. |
| **Export** | jsPDF + html2canvas | Client-side generation and downloading of invoices and custom reports. |
| **Backend Core** | Django 4.2.7 | Secure business APIs, ORM database transactions, and signal-driven events. |
| **API Framework** | Django REST Framework (DRF) | Stateless REST APIs, JWT token validation, and CORS middleware. |
| **Database (Dev)** | SQLite 3 | Relational database for zero-config local development. |
| **Database (Prod)** | PostgreSQL | Enterprise-grade, transaction-secure database for cloud environments. |
| **AI Layer** | Groq API (Llama 3.3) | Natural-language chatbot engine utilizing function-calling tool schemas. |
| **AI Fallback** | OpenAI GPT Models | Semantic sentiment analysis and text summarization. |
| **Excel Ingestion** | Pandas + OpenPyXL | Excel scanning and processing for bulk sales imports. |

---

## 📁 Repository Structure

```
├── accounts/                  # Django App: Double-entry financial journal & budgets
├── assets/                    # Static assets & logos
├── bizionary-frontend/        # React + Vite frontend source code
│   ├── public/                # Public assets
│   ├── src/                   # React components, hooks, assets
│   ├── package.json           # Frontend dependency manifest
│   └── tailwind.config.js     # Tailwind Configuration
├── chatbot/                   # Django App: Groq RAG chatbot & tool integrations
├── dashboard/                 # Django App: Real-time API aggregates for KPIs & charts
├── erp_system/                # Core Django project configuration & settings
├── insights/                  # Django App: Predictive NLP & demand analysis services
├── invoices/                  # Django App: Invoice tracking & generating models
├── product_catalog/           # Django App: Categorization and product properties
├── products/                  # Django App: Inventory logs, items & inventory ledgers
├── purchases/                 # Django App: Supplier registry & ordered slips
├── sales/                     # Django App: Sales orders & sales returns ledger
├── ui pics/                   # Application user interface screenshots
├── user_management/           # Django App: Roles, permissions & MFA settings
├── BizionaryERP.bat           # Desktop startup batch file script
├── BizionaryERP.spec          # PyInstaller configuration profile
├── build_exe.py               # Standalone compilation automation python script
├── manage.py                  # Django administrative command gateway
├── requirements.txt           # Backend python dependencies list
└── run_server.py              # Custom entrypoint for backend and migrations
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js v18+](https://nodejs.org/)

---

### 2. Backend Setup
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ALI22ASHAR/FYP-Bizionary.git
    cd FYP-Bizionary
    ```

2.  **Create and Activate a Virtual Environment:**
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    ```

3.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment Variables:**
    Create a `.env` file in the root directory (based on `.env.example`):
    ```env
    SECRET_KEY=your-django-secret-key
    DEBUG=True
    ALLOWED_HOSTS=localhost,127.0.0.1
    
    # DB Configuration (Defaults to SQLite if not provided)
    # DATABASE_URL=postgres://user:password@host:port/database
    
    # API Keys for AI features
    GROQ_API_KEY=your_groq_api_key
    GROQ_MODEL=llama-3.3-70b-versatile
    ```

5.  **Initialize Database & Run Migrations:**
    ```bash
    python manage.py migrate
    ```

6.  **Seed Database with Demo Data:**
    Populate basic roles, inventory items, sales records, and financial ledger accounts:
    ```bash
    python seed_roles_departments.py
    python populate_real_data.py
    python populate_purchases_and_expenses.py
    ```

7.  **Run the Django Server:**
    ```bash
    python manage.py runserver
    # Or run the compiled bootloader
    python run_server.py
    ```
    The backend will start at `http://127.0.0.1:8000/`.

---

### 3. Frontend Setup
1.  **Navigate to the Frontend Directory:**
    ```bash
    cd bizionary-frontend
    ```

2.  **Install Node Modules:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file inside `bizionary-frontend/`:
    ```env
    VITE_API_URL=http://127.0.0.1:8000
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The frontend client will start at `http://localhost:5173/` (or similar depending on port availability).

---

## 📦 Desktop App Packaging & Standalone Architecture (Theoretical Overview)

While Bizionary ERP is fully prepared to scale to cloud-based server setups, it features a unique **offline standalone desktop mode** compiled as a Windows executable. This design is built specifically for SMEs requiring local, offline-first operations with zero external dependencies.

### 🔌 How Standalone Server Bundling Works
Instead of rewriting the entire system in a native desktop language, Bizionary utilizes a **standalone server bundling pattern**. It packages a complete, localized web ecosystem:
1. **Application Server:** A local Django instance running a lightweight HTTP server on port `8000`.
2. **Database Engine:** An embedded, low-overhead SQLite database stored as a local file (`db.sqlite3`).
3. **Static File Server:** Uses **Whitenoise** to serve React files and CSS directly from memory/disk without needing Nginx or Apache.
4. **Desktop Launcher:** A simple Windows Batch script (`BizionaryERP.bat`) that triggers the server process and automatically launches the user's default system browser pointing to the application.

```mermaid
graph LR
    User[👤 SME User] -->|1. Double Clicks| Batch[BizionaryERP.bat]
    Batch -->|2. Launches| EXE[BizionaryERP.exe Process]
    EXE -->|3. Runs Local server| Django[Django & SQLite Server]
    EXE -->|4. Opens browser| Browser[Web Browser @ localhost:8000]
    Browser <-->|5. HTTP JSON/Static| Django
```

### ⚙️ The Automated Packaging Pipeline (`build_exe.py`)
To build the distribution package, the automated pipeline executes the following processes:

1. **Vite React Compilation:** Computes a production build of the Single-Page Application (SPA), generating optimized HTML, JavaScript, and CSS inside `bizionary-frontend/dist/`.
2. **Clean Database Bootstrapping:** Builds a fresh, empty SQLite template database. It automatically executes migrations to generate all schemas and runs the seeding scripts (`seed_roles_departments.py`) to prepare base roles/permissions.
3. **Static Collection:** Gathers all React build files and Django admin CSS/JS assets into a central `staticfiles/` directory using Django's `collectstatic` helper.
4. **PyInstaller Compilation:** Packages the Python runtime, compiled byte-code (`.pyc`), dependencies, SQLite database template, and static files into a single directory structure under `dist/BizionaryERP/`.
5. **Click-to-Run Packaging:** Injects the batch launcher script into the directory and compresses the entire ecosystem into a release zip archive (`BizionaryERP_Windows.zip`).

---

## 🚀 Cloud Deployment

Bizionary ERP is configured to run as a decoupled application on:
1.  **Backend (Railway):** Reads production postgres configurations using `DATABASE_URL` and manages Whitenoise static collection. Read the [Deployment Manual](file:///c:/Users/Dell/Desktop/Fyp/DEPLOYMENT.md) for environment requirements.
2.  **Frontend (Vercel):** Seamless continuous deployment directly connected to your frontend branch.

---

## 📸 Gallery & User Interface

Here are some glimpses of the **Bizionary ERP** application dashboard and operational modules:

| Chatbot Assistant | Product Catalog |
| :---: | :---: |
| ![Dashboard Overview](<ui pics/Screenshot 2026-07-19 012026.png>) | ![Sales Charts](<ui pics/Screenshot 2026-07-19 012037.png>) |

| Sales Analytics |  Stock Management  |
| :---: | :---: |
| ![Product Catalog](<ui pics/Screenshot 2026-07-19 012046.png>) | ![Procurement](<ui pics/Screenshot 2026-07-19 012050.png>) |

 Dashboard Overview
 ![Groq Chatbot](<ui pics/Screenshot 2026-07-19 012108.png>) |

---

## 📄 License
This project is developed as a Final Year Project (FYP). Refer to local project agreements for licensing and redistribution permissions.
