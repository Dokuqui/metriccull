# MetricCull

**Advanced Performance Profiling Engine with AI-Driven Insights**
MetricCull is a full-stack profiling tool designed to automatically clone, run, and analyze code repositories. It combines a low-level Rust agent for granular profiling, a Go-based API gateway for real-time telemetry streaming, and a Python-powered AI "Brain" (via Google Gemini) to act as an automated Senior Performance Engineer.

---

## Features

* **Automated Environment Setup:** Automatically clones GitHub repositories, creates isolated Python virtual environments (`venv`), and installs dependencies via `requirements.txt` or `pyproject.toml`.
* **Rust-Powered Profiling:** Uses a custom Rust wrapper to execute target code safely while capturing granular function-level execution times and system metrics.
* **Real-Time Telemetry:** Streams live memory usage (RSS) via Server-Sent Events (SSE) from the Go backend, visualized instantly in React using Recharts.
* **AI Logic Analysis:** Feeds raw profiling data and "Hot Paths" (bottlenecks) into Google's `gemini-2.5-flash` model to generate highly technical, actionable optimization advice and a performance grade (A-F).
* **Exportable Reports:** Generates lightweight, downloadable Markdown (`.md`) reports summarizing core metrics and AI suggestions for easy PR documentation.
* **Historical Benchmarking:** Saves all profiling runs to a PostgreSQL database, allowing users to track performance regressions over time across different Python versions.

---

## Architecture Stack

MetricCull is built using a micro-architecture approach:

1. **Frontend (UI):** Next.js / React, TypeScript, Styled Components, Recharts.
2. **API Gateway (Orchestrator):** Go, Gin Framework, GORM. Handles SSE streaming, repository cloning, and database management.
3. **Agent (Profiler):** Rust. Executes the target code and captures system metrics.
4. **Brain (Analyzer):** Python 3. Parses `cProfile` binary data and communicates with the Google GenAI API.
5. **Database:** PostgreSQL.

---

## Prerequisites

To run this project locally, you will need the following installed:

* [Node.js & npm](https://nodejs.org/) (Frontend)
* [Go 1.20+](https://go.dev/) (API Gateway)
* [Rust & Cargo](https://rustup.rs/) (Profiling Agent)
* [Python 3.10+](https://www.python.org/) & pip (AI Brain & Target Environments)
* [PostgreSQL](https://www.postgresql.org/) (Database)
* Git (For cloning repos)

---

## Setup & Installation

### 1. Environment Variables

Create a `.env` file in the root of your project (or inside `api-gateway/`) with the following keys:

```env
# Database
DATABASE_URL="host=localhost user=youruser password=yourpass dbname=metriccull port=5432 sslmode=disable"

# Backend Configuration
FRONTEND_ORIGIN="http://localhost:3000"

# AI Brain
GEMINI_API_KEY="your_google_ai_studio_api_key"

```

Create a `.env.local` inside your `frontend/` directory:

```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"

```

### 2. Build the Rust Agent

The Go backend relies on the compiled Rust binary to execute the profiling.

```bash
cd cmd-agent
cargo build
# Ensure the binary is at: cmd-agent/target/debug/cmd-agent

```

### 3. Setup the AI Brain

Install the modern Google GenAI SDK for the Python analyzer.

```bash
cd brain
pip install google-genai

```

### 4. Start the Go API Gateway

Run the refactored Go backend (which handles routing, DB, and streaming).

```bash
cd api-gateway
go run .
# Server will start on http://localhost:8080

```

### 5. Start the Next.js Frontend

```bash
cd frontend
npm install
npm run dev
# Dashboard will be available at http://localhost:3000

```

---

## Usage

1. Open `http://localhost:3000` in your browser.
2. Paste a Python repository URL (e.g., `https://github.com/alexdedyura/cpu-benchmark`).
3. Select your target Python version from the dropdown.
4. Click **Analyze Repo**.
5. Watch the live terminal logs and memory streaming chart as MetricCull sets up the environment and executes the code.
6. Review the AI-generated logic analysis, inspect the Hot Paths, and download the `.md` report.
