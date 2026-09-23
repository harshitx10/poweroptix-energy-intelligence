"""
PowerOptix - Unsupervised Energy Anomaly Detector
Method: Isolation Forest (scikit-learn)
Detects unexpected consumption spikes, unusual nighttime usage, and baseline anomalies.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta

def detect_consumption_anomalies(history_df: pd.DataFrame = None, total_monthly_kwh: float = 420.0) -> dict:
    """
    Applies Isolation Forest to detect abnormal daily consumption patterns.
    """
    np.random.seed(42)
    
    # Generate 60 days of synthetic daily readings if history not provided
    if history_df is None or len(history_df) < 14:
        avg_daily_kwh = total_monthly_kwh / 30.0
        dates = [datetime.now() - timedelta(days=60 - i) for i in range(60)]
        daily_records = []
        for i, dt in enumerate(dates):
            # Normal fluctuation
            kwh = np.random.normal(avg_daily_kwh, avg_daily_kwh * 0.15)
            kwh = max(3.0, kwh)
            
            # Inject 3 controlled anomalies for testing
            is_injected_anomaly = False
            if i in [14, 38, 52]:
                kwh = avg_daily_kwh * np.random.uniform(1.85, 2.4)
                is_injected_anomaly = True

            daily_records.append({
                "date": dt.strftime("%Y-%m-%d"),
                "day_of_week": dt.strftime("%A"),
                "daily_kwh": round(kwh, 2),
                "peak_kwh": round(kwh * 0.45, 2),
                "night_kwh": round(kwh * 0.20, 2),
                "is_injected": is_injected_anomaly
            })
        df = pd.DataFrame(daily_records)
    else:
        df = history_df.copy()

    # Feature matrix for Isolation Forest
    X = df[["daily_kwh", "peak_kwh", "night_kwh"]]
    
    # Train Isolation Forest
    model = IsolationForest(contamination=0.08, random_state=42)
    model.fit(X)
    
    df["anomaly_score"] = model.decision_function(X)
    df["is_anomaly"] = model.predict(X)  # -1 for anomaly, 1 for normal

    detected_anomalies = []
    normal_count = 0
    anomaly_count = 0

    expected_avg = float(df["daily_kwh"].median())

    for _, row in df.iterrows():
        if row["is_anomaly"] == -1:
            anomaly_count += 1
            obs = float(row["daily_kwh"])
            dev_pct = round(((obs - expected_avg) / expected_avg) * 100.0, 1)

            # Explainable anomaly hypothesis
            if row["night_kwh"] > (expected_avg * 0.35):
                reason = "Unusually high overnight consumption detected."
            elif row["peak_kwh"] > (expected_avg * 0.6):
                reason = "Unusually high AC or heavy appliance usage during peak hours."
            else:
                reason = "Unexpected total daily consumption spike exceeding normal statistical baseline."

            detected_anomalies.append({
                "date": row["date"],
                "day_of_week": row["day_of_week"],
                "observed_kwh": obs,
                "expected_kwh": round(expected_avg, 2),
                "deviation_percentage": dev_pct,
                "severity": "High" if dev_pct > 60 else "Medium",
                "possible_reason": reason,
                "cautious_label": "Possible abnormal consumption pattern (Model-based observation)."
            })
        else:
            normal_count += 1

    records_list = df[["date", "daily_kwh", "peak_kwh", "night_kwh", "is_anomaly"]].to_dict(orient="records")

    return {
        "algorithm": "Unsupervised Isolation Forest (scikit-learn)",
        "total_days_analyzed": len(df),
        "normal_days_count": normal_count,
        "anomalies_detected_count": anomaly_count,
        "baseline_median_kwh": round(expected_avg, 2),
        "detected_anomalies": sorted(detected_anomalies, key=lambda x: x["deviation_percentage"], reverse=True),
        "daily_time_series": records_list
    }
