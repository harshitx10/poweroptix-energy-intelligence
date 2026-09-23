# PowerOptix — Electricity Usage Optimizer
### AI-Based Electricity Consumption Forecasting, Cost Optimization & Energy Digital Twin

PowerOptix is an intelligent electricity management and optimization system. It analyzes household electricity consumption, estimates electricity costs using progressive tariff slab rates, predicts future consumption using machine learning, identifies inefficient usage, mathematically optimizes appliance operation using Linear Programming, and provides a deterministic Energy Digital Twin.

---

## Key Features & Architecture

### 1. Smart Electricity Usage Entry (Appliance Inventory)
- Tracks appliance power rating ($P_i$ in Watts), quantity ($Q_i$), daily hours ($H_i$), monthly days ($D_i$), standby draw ($P_{\text{standby}, i}$), usage priority (Essential, High, Medium, Low), and operational bounds $[H_{\min, i}, H_{\max, i}]$.
- Mathematical Consumption Formula:
  $$E_i = \frac{P_i \times Q_i \times H_i \times D_i}{1000} \quad (\text{kWh/month})$$
  $$E_{\text{standby}, i} = \frac{P_{\text{standby}, i} \times Q_i \times (24 - H_i) \times D_i}{1000} \quad (\text{kWh/month})$$

### 2. Electricity Bill & Progressive Tariff Engine
- Dynamic slab calculation supporting configurable tariff slabs (0–100, 101–200, 201–300, 301+ units) + fixed monthly charges.
- Computes monthly and annual electricity cost estimates.

### 3. ML Electricity Forecasting Engine
- **Method**: Lag Feature Engineering + Scikit-learn Ridge Regression.
- Features: Lag-1, Lag-2, Lag-3, 3-month rolling average, month index, and seasonal temperature proxies.
- Predicts next 3 months of consumption with confidence intervals and estimated bills.

### 4. Mathematical Energy Optimizer (`scipy.optimize.linprog`) ⭐⭐⭐⭐⭐
- **Objective**: $\min \sum_i c_i x_i$ where $x_i$ is optimized daily usage hours.
- Subject to bounds $H_{\min, i} \le x_i \le H_{\max, i}$, essential appliance priority constraints, and target monthly budget constraints.
- Includes dynamic **Explainability Panel** explaining *why* PowerOptix recommended each specific usage adjustment.

### 5. Deterministic Energy Digital Twin ⭐⭐⭐⭐⭐
- Simulates hardware upgrades (e.g. 40W incandescent $\rightarrow$ 10W LED), usage shifts, or load shedding.
- Calculates exact kWh saved, monthly money saved, annual financial impact, and $\text{CO}_2$ emissions reduction ($0.85\text{ kg CO}_2\text{/kWh}$).

### 6. Real-Time Interactive What-If Simulator
- Instant slider-based recalculations for single or multi-appliance adjustments.

### 7. Proposed PowerOptix Energy Efficiency Score (0–100)
- Multi-factor weighted evaluation (Energy Consumption Efficiency 25%, Peak Appliance Ratio 20%, Optimization Adherence 15%, Budget Adherence 15%, Consumption Trend 15%, Standby Draw 10%).

---

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Chart.js (`react-chartjs-2`), Lucide React, Glassmorphic CSS.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, Pydantic v2, Scikit-learn, SciPy (`scipy.optimize.linprog`), Pandas, NumPy.
- **Database**: MySQL as primary database with seamless SQLite fallback (`poweroptix.db`).

---

## How to Run the Project

### 1. Start FastAPI Backend
```bash
python run_backend.py
```
- API Endpoint: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`

### 2. Run Backend Unit Tests
```bash
python backend/tests/test_runner.py
```

### 3. Start React Frontend
```bash
cd frontend
npm run dev
```
- Local App URL: `http://localhost:5173`

---

## Demo Household Scenario
- Baseline Monthly Usage: **420 kWh**
- Estimated Monthly Bill: **₹3,850**
- Monthly Target Budget: **₹3,000**
- Top Consumer: **Air Conditioner (1.5 Ton, 1500W, 6 hrs/day)**
