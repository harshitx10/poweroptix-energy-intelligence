import random
from typing import List, Dict, Any, Optional

QUIZ_QUESTIONS = [
    # Category 1: Appliance Wattage Trivia
    {
        "id": "watt_1",
        "category": "appliance_trivia",
        "category_name": "Appliance Wattage Trivia",
        "difficulty": "Easy",
        "question": "Which of the following household appliances typically consumes the highest amount of power (Watts) per hour of operation?",
        "options": [
            "LED Bulb (12W)",
            "Ceiling Fan (75W)",
            "1.5 Ton Split Air Conditioner (1500W)",
            "Laptop Charger (65W)"
        ],
        "correct_answer": 2,
        "explanation": "A 1.5 Ton AC draws ~1500W, making it the highest power consumer among these appliances (over 20 times more than a ceiling fan).",
        "formula_details": "Power Consumption = 1500 Watts = 1.5 kW"
    },
    {
        "id": "watt_2",
        "category": "appliance_trivia",
        "category_name": "Appliance Wattage Trivia",
        "difficulty": "Medium",
        "question": "What is 'Standby Power Draw' (Vampire Draw) in modern electrical appliances?",
        "options": [
            "Power consumed when the appliance operates at maximum capacity",
            "Electricity consumed while the appliance is switched off or in sleep mode but plugged in",
            "Surge voltage that occurs when turning an appliance on",
            "Power lost as heat in the wall wiring"
        ],
        "correct_answer": 1,
        "explanation": "Standby draw is power continuously drawn by electronics (TVs, microwave displays, chargers) while turned off or on standby mode.",
        "formula_details": "E_standby = (P_standby × Q × (24 - H) × D) / 1000 kWh/month"
    },
    {
        "id": "watt_3",
        "category": "appliance_trivia",
        "category_name": "Appliance Wattage Trivia",
        "difficulty": "Hard",
        "question": "Replacing a 60W incandescent light bulb running 5 hours daily with a 9W LED bulb saves how many kWh per 30-day month?",
        "options": [
            "1.5 kWh",
            "4.5 kWh",
            "7.65 kWh",
            "15.0 kWh"
        ],
        "correct_answer": 2,
        "explanation": "Old usage = (60W × 5h × 30d)/1000 = 9 kWh/mo. New usage = (9W × 5h × 30d)/1000 = 1.35 kWh/mo. Savings = 9 - 1.35 = 7.65 kWh/mo.",
        "formula_details": "kWh Saved = [(60 - 9) × 5 × 30] / 1000 = 51 × 150 / 1000 = 7.65 kWh"
    },
    {
        "id": "watt_4",
        "category": "appliance_trivia",
        "category_name": "Appliance Wattage Trivia",
        "difficulty": "Medium",
        "question": "If an electric water heater is rated at 2,000 Watts and runs for 1.5 hours daily, what is its monthly consumption (30 days)?",
        "options": [
            "45 kWh",
            "90 kWh",
            "60 kWh",
            "120 kWh"
        ],
        "correct_answer": 1,
        "explanation": "(2000W × 1.5 hours/day × 30 days) / 1000 = 90 kWh per month.",
        "formula_details": "E = (2000 × 1.5 × 30) / 1000 = 90.0 kWh"
    },

    # Category 2: Tariff & Cost Calculations
    {
        "id": "tariff_1",
        "category": "tariff_math",
        "category_name": "Tariff & Cost Calculations",
        "difficulty": "Easy",
        "question": "In a progressive slab tariff system, why does the cost per unit (kWh) increase as consumption rises?",
        "options": [
            "To penalize power grid operators",
            "To encourage energy conservation by making higher consumption tiers progressively more expensive",
            "Because high-voltage electricity is harder to produce",
            "To cover the fixed cost of electric meters"
        ],
        "correct_answer": 1,
        "explanation": "Progressive slab tariffs charge higher rates per unit for higher consumption brackets (e.g. 0-100 @ ₹4.50, 101-200 @ ₹6.00, 301+ @ ₹9.50) to incentivize conservation.",
        "formula_details": "Bill = Fixed Charge + Σ (Slab Units × Slab Rate)"
    },
    {
        "id": "tariff_2",
        "category": "tariff_math",
        "category_name": "Tariff & Cost Calculations",
        "difficulty": "Hard",
        "question": "With Slabs: [0-100 units @ ₹4.50], [101-200 units @ ₹6.00], [201+ units @ ₹8.00], and Fixed Charge ₹150, what is the bill for 250 kWh?",
        "options": [
            "₹1,450",
            "₹1,600",
            "₹1,550",
            "₹1,700"
        ],
        "correct_answer": 1,
        "explanation": "Fixed Charge = ₹150. Slab 1 (100u) = 100 × 4.50 = ₹450. Slab 2 (100u) = 100 × 6.00 = ₹600. Slab 3 (50u) = 50 × 8.00 = ₹400. Total = 150 + 450 + 600 + 400 = ₹1,600.",
        "formula_details": "150 + (100 × 4.5) + (100 × 6.0) + (50 × 8.0) = 150 + 450 + 600 + 400 = ₹1,600"
    },
    {
        "id": "tariff_3",
        "category": "tariff_math",
        "category_name": "Tariff & Cost Calculations",
        "difficulty": "Medium",
        "question": "How does SciPy Linear Programming (`scipy.optimize.linprog`) optimize appliance usage hours in PowerOptix?",
        "options": [
            "By randomly shutting down appliances until target is reached",
            "By minimizing total energy bill subject to user-defined minimum operational bounds and essential priority constraints",
            "By turning off all low priority devices permanently",
            "By increasing tariff rates dynamically"
        ],
        "correct_answer": 1,
        "explanation": "SciPy LP minimizes Z = Σ (cost_i × x_i) while guaranteeing x_i ≥ H_min for all appliances and respecting target budget constraints.",
        "formula_details": "min c^T x  s.t.  A_ub x ≤ b_ub,  lb ≤ x ≤ ub"
    },

    # Category 3: Eco Habits & Carbon Footprint
    {
        "id": "eco_1",
        "category": "eco_habits",
        "category_name": "Eco Habits & Carbon Footprint",
        "difficulty": "Easy",
        "question": "In standard grid emission factors, approximately how much CO2 is avoided for every 1 kWh of thermal grid electricity saved?",
        "options": [
            "0.10 kg CO2",
            "0.85 kg CO2",
            "3.50 kg CO2",
            "10.0 kg CO2"
        ],
        "correct_answer": 1,
        "explanation": "The standard average grid emissions conversion factor used in PowerOptix is 0.85 kg CO2 per kWh of thermal grid power saved.",
        "formula_details": "CO2 Avoided = kWh Saved × 0.85 kg/kWh"
    },
    {
        "id": "eco_2",
        "category": "eco_habits",
        "category_name": "Eco Habits & Carbon Footprint",
        "difficulty": "Medium",
        "question": "What thermostat temperature setting is recommended for maximum AC energy efficiency without sacrificing comfort?",
        "options": [
            "18°C (64°F)",
            "24°C - 25°C (75°F - 77°F)",
            "20°C (68°F)",
            "30°C (86°F)"
        ],
        "correct_answer": 1,
        "explanation": "Setting the AC at 24°C–25°C balances human thermal comfort and reduces compressor load by ~6% for every 1°C increase over 18°C.",
        "formula_details": "6% energy saving per +1°C setpoint rise"
    },
    {
        "id": "eco_3",
        "category": "eco_habits",
        "category_name": "Eco Habits & Carbon Footprint",
        "difficulty": "Hard",
        "question": "If a household reduces baseline monthly consumption from 420 kWh to 288 kWh, how much CO2 is prevented from entering the atmosphere annually?",
        "options": [
            "112.2 kg CO2",
            "1,346.4 kg CO2",
            "560.0 kg CO2",
            "2,500.0 kg CO2"
        ],
        "correct_answer": 1,
        "explanation": "Monthly saving = 420 - 288 = 132 kWh/month. Annual saving = 132 × 12 = 1584 kWh/year. CO2 saved = 1584 × 0.85 kg = 1,346.4 kg CO2/year.",
        "formula_details": "(420 - 288) × 12 × 0.85 = 132 × 12 × 0.85 = 1,346.4 kg CO2/year"
    },

    # Category 4: Smart Tech & Digital Twin
    {
        "id": "tech_1",
        "category": "smart_tech",
        "category_name": "Smart Tech & Digital Twin",
        "difficulty": "Medium",
        "question": "What is the primary advantage of an Inverter Air Conditioner over a conventional non-inverter fixed-speed AC?",
        "options": [
            "Inverter AC cools the room to 0°C faster",
            "Inverter AC uses a variable-speed compressor that modulates motor speed instead of repeatedly cycling ON/OFF at maximum power",
            "Inverter AC requires no electricity connection",
            "Inverter AC has a higher standby wattage draw"
        ],
        "correct_answer": 1,
        "explanation": "Inverter technology modulates compressor speed to match cooling demand, eliminating the high surge current and energy waste of frequent ON/OFF cycles.",
        "formula_details": "Energy savings of 30%–50% compared to non-inverter fixed speed models"
    },
    {
        "id": "tech_2",
        "category": "smart_tech",
        "category_name": "Smart Tech & Digital Twin",
        "difficulty": "Hard",
        "question": "In a 3 kW Solar PV Rooftop installation generating 4 kWh per kWp per day, what is the estimated monthly solar power production (30 days)?",
        "options": [
            "120 kWh",
            "360 kWh",
            "720 kWh",
            "900 kWh"
        ],
        "correct_answer": 1,
        "explanation": "Daily yield = 3 kWp × 4 kWh/kWp/day = 12 kWh/day. Monthly yield = 12 × 30 = 360 kWh per month.",
        "formula_details": "Solar Output = System Capacity (kWp) × Daily Yield × 30 days = 3 × 4 × 30 = 360 kWh"
    }
]

ACHIEVEMENT_BADGES = [
    {
        "id": "badge_wattage_master",
        "name": "Wattage Master",
        "description": "Scored 100% in Appliance Wattage Trivia",
        "icon": "Zap"
    },
    {
        "id": "badge_tariff_guru",
        "name": "Tariff Guru",
        "description": "Mastered complex tariff slab & LP cost calculations",
        "icon": "Calculator"
    },
    {
        "id": "badge_eco_champion",
        "name": "Eco Champion",
        "description": "Demonstrated expert knowledge in carbon reduction & energy efficiency",
        "icon": "Leaf"
    },
    {
        "id": "badge_digital_twin_legend",
        "name": "Digital Twin Legend",
        "description": "Achieved a perfect score in Smart Tech & Solar Digital Twin questions",
        "icon": "Cpu"
    },
    {
        "id": "badge_speed_demon",
        "name": "Speed Demon",
        "description": "Completed a Timed Challenge quiz with over 80% accuracy",
        "icon": "Award"
    }
]

def get_quiz_questions(category: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    questions = QUIZ_QUESTIONS
    if category and category != "all":
        questions = [q for q in questions if q["category"] == category]
    if difficulty and difficulty != "all":
        questions = [q for q in questions if q["difficulty"].lower() == difficulty.lower()]
    
    shuffled = random.sample(questions, min(len(questions), limit))
    return shuffled

def evaluate_quiz_submission(category: str, answers: Dict[str, int], time_taken_seconds: int = 0, mode: str = "learning") -> Dict[str, Any]:
    relevant_questions = [q for q in QUIZ_QUESTIONS if q["id"] in answers]
    if not relevant_questions:
        relevant_questions = [q for q in QUIZ_QUESTIONS if category == "all" or q["category"] == category]

    total_questions = len(relevant_questions)
    correct_count = 0
    score = 0
    streak = 0
    max_streak = 0
    question_results = []

    for q in relevant_questions:
        q_id = q["id"]
        user_ans = answers.get(q_id, -1)
        is_correct = (user_ans == q["correct_answer"])

        if is_correct:
            correct_count += 1
            streak += 1
            if streak > max_streak:
                max_streak = streak
            
            base_pts = 100
            streak_bonus = (streak - 1) * 20
            score += base_pts + streak_bonus
        else:
            streak = 0

        question_results.append({
            "id": q_id,
            "question": q["question"],
            "user_answer": user_ans,
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "options": q["options"],
            "explanation": q["explanation"],
            "formula_details": q.get("formula_details", "")
        })

    accuracy_pct = round((correct_count / max(total_questions, 1)) * 100, 1)

    speed_bonus = 0
    if mode == "timed" and time_taken_seconds > 0:
        target_time = total_questions * 15
        if time_taken_seconds < target_time:
            speed_bonus = int((target_time - time_taken_seconds) * 10)
            score += speed_bonus

    unlocked_badges = []
    if accuracy_pct == 100.0:
        if category == "appliance_trivia":
            unlocked_badges.append(ACHIEVEMENT_BADGES[0])
        elif category == "tariff_math":
            unlocked_badges.append(ACHIEVEMENT_BADGES[1])
        elif category == "eco_habits":
            unlocked_badges.append(ACHIEVEMENT_BADGES[2])
        elif category == "smart_tech":
            unlocked_badges.append(ACHIEVEMENT_BADGES[3])
        elif category == "all":
            unlocked_badges.append(ACHIEVEMENT_BADGES[0])
            unlocked_badges.append(ACHIEVEMENT_BADGES[1])

    if mode == "timed" and accuracy_pct >= 80.0:
        unlocked_badges.append(ACHIEVEMENT_BADGES[4])

    return {
        "score": score,
        "total_questions": total_questions,
        "correct_count": correct_count,
        "accuracy_pct": accuracy_pct,
        "max_streak": max_streak,
        "speed_bonus": speed_bonus,
        "mode": mode,
        "category": category,
        "unlocked_badges": unlocked_badges,
        "question_results": question_results
    }
