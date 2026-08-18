from fastapi import APIRouter, Query
from app.core.config import settings
import httpx
from typing import Optional

router = APIRouter()

OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"


def compute_risk_index(humidity: float, temp: float, wind_speed: float) -> dict:
    """
    Compute pathogen proliferation vulnerability index for finger millet blast.
    Based on epidemiological thresholds:
      - Humidity > 85% → high spore germination
      - Temperature 20-30°C → optimal fungal growth
      - Low wind → prolonged leaf wetness
    """
    # Humidity score (0-40 points)
    if humidity >= 90:
        h_score = 40
    elif humidity >= 85:
        h_score = 35
    elif humidity >= 75:
        h_score = 25
    elif humidity >= 60:
        h_score = 15
    else:
        h_score = 5

    # Temperature score (0-35 points) — optimal blast range 20-30°C
    if 22 <= temp <= 28:
        t_score = 35
    elif 20 <= temp <= 30:
        t_score = 28
    elif 15 <= temp <= 35:
        t_score = 15
    else:
        t_score = 5

    # Wind score (0-25 points) — lower wind = higher leaf wetness duration
    if wind_speed < 2:
        w_score = 25
    elif wind_speed < 5:
        w_score = 18
    elif wind_speed < 10:
        w_score = 10
    else:
        w_score = 5

    total = h_score + t_score + w_score  # Max 100

    if total >= 75:
        level = "CRITICAL"
    elif total >= 55:
        level = "HIGH"
    elif total >= 35:
        level = "MODERATE"
    else:
        level = "LOW"

    # Estimate leaf wetness hours from humidity + wind
    if humidity >= 85 and wind_speed < 5:
        leaf_wetness = round(12 + (humidity - 85) * 0.3 - wind_speed * 0.5, 1)
    elif humidity >= 70:
        leaf_wetness = round(8 + (humidity - 70) * 0.2 - wind_speed * 0.3, 1)
    else:
        leaf_wetness = round(max(2, 6 - wind_speed * 0.5), 1)

    return {
        "risk_index": total,
        "risk_level": level,
        "leaf_wetness_hrs": max(0, leaf_wetness),
        "h_score": h_score,
        "t_score": t_score,
        "w_score": w_score,
    }


@router.get("/")
async def weather_status():
    return {"module": "weather", "status": "active", "api": "OpenWeatherMap"}


@router.get("/current")
async def get_current_weather(
    lat: float = Query(default=12.9716, description="Latitude (default: Bangalore)"),
    lon: float = Query(default=77.5946, description="Longitude (default: Bangalore)"),
):
    """Fetch current weather + 72h pathogen risk index from OpenWeatherMap."""
    api_key = settings.WEATHER_API_KEY

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Current weather
        current_resp = await client.get(
            f"{OPENWEATHER_BASE}/weather",
            params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"},
        )
        current_data = current_resp.json()

        # 5-day / 3-hour forecast (covers 72h)
        forecast_resp = await client.get(
            f"{OPENWEATHER_BASE}/forecast",
            params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric", "cnt": 24},
        )
        forecast_data = forecast_resp.json()

    if current_resp.status_code != 200:
        return {
            "error": True,
            "message": current_data.get("message", "Failed to fetch weather data"),
            "status_code": current_resp.status_code,
        }

    # Current conditions
    main = current_data.get("main", {})
    wind = current_data.get("wind", {})
    weather_desc = current_data.get("weather", [{}])[0]
    clouds = current_data.get("clouds", {})

    humidity = main.get("humidity", 0)
    temp = main.get("temp", 0)
    feels_like = main.get("feels_like", 0)
    temp_min = main.get("temp_min", 0)
    temp_max = main.get("temp_max", 0)
    pressure = main.get("pressure", 0)
    wind_speed = wind.get("speed", 0)
    wind_deg = wind.get("deg", 0)
    cloud_pct = clouds.get("all", 0)

    # Compute pathogen risk
    risk = compute_risk_index(humidity, temp, wind_speed)

    # Process 72h forecast for trend data
    forecast_points = []
    if forecast_data.get("list"):
        for item in forecast_data["list"][:24]:  # 24 × 3h = 72h
            fm = item.get("main", {})
            fw = item.get("wind", {})
            fweather = item.get("weather", [{}])[0]
            f_risk = compute_risk_index(fm.get("humidity", 0), fm.get("temp", 0), fw.get("speed", 0))
            forecast_points.append({
                "dt": item.get("dt"),
                "dt_txt": item.get("dt_txt"),
                "temp": fm.get("temp"),
                "humidity": fm.get("humidity"),
                "wind_speed": fw.get("speed", 0),
                "description": fweather.get("description", ""),
                "icon": fweather.get("icon", ""),
                "risk_index": f_risk["risk_index"],
                "risk_level": f_risk["risk_level"],
                "leaf_wetness_hrs": f_risk["leaf_wetness_hrs"],
            })

    # Compute 72h averages
    avg_humidity = 0
    avg_temp = 0
    max_risk = 0
    if forecast_points:
        avg_humidity = round(sum(p["humidity"] for p in forecast_points) / len(forecast_points), 1)
        avg_temp = round(sum(p["temp"] for p in forecast_points) / len(forecast_points), 1)
        max_risk = max(p["risk_index"] for p in forecast_points)

    return {
        "location": {
            "name": current_data.get("name", "Unknown"),
            "lat": lat,
            "lon": lon,
            "country": current_data.get("sys", {}).get("country", ""),
        },
        "current": {
            "temp": temp,
            "feels_like": feels_like,
            "temp_min": temp_min,
            "temp_max": temp_max,
            "humidity": humidity,
            "pressure": pressure,
            "wind_speed": wind_speed,
            "wind_deg": wind_deg,
            "cloud_pct": cloud_pct,
            "description": weather_desc.get("description", ""),
            "icon": weather_desc.get("icon", ""),
            "main": weather_desc.get("main", ""),
        },
        "pathogen_risk": {
            "risk_index": risk["risk_index"],
            "risk_level": risk["risk_level"],
            "leaf_wetness_hrs": risk["leaf_wetness_hrs"],
            "humidity_score": risk["h_score"],
            "temp_score": risk["t_score"],
            "wind_score": risk["w_score"],
        },
        "forecast_72h": {
            "avg_humidity": avg_humidity,
            "avg_temp": avg_temp,
            "max_risk_index": max_risk,
            "points": forecast_points,
        },
        "advisory": _generate_spray_advisory(risk["risk_level"], humidity, temp, risk["leaf_wetness_hrs"]),
    }


def _generate_spray_advisory(risk_level: str, humidity: float, temp: float, leaf_wetness: float) -> dict:
    """Generate actionable spray-timing advisory based on pathogen risk."""
    if risk_level == "CRITICAL":
        return {
            "action": "IMMEDIATE_SPRAY",
            "urgency": "critical",
            "message": f"🚨 CRITICAL: Humidity {humidity}%, Temp {temp}°C, Leaf Wetness {leaf_wetness}h. Conditions highly favorable for Blast spore germination. Apply Tricyclazole 75% WP @ 0.6g/L or Pseudomonas fluorescens immediately. Do not delay beyond 24 hours.",
            "products": ["Tricyclazole 75% WP", "Pseudomonas fluorescens 1.15% WP"],
        }
    elif risk_level == "HIGH":
        return {
            "action": "SCHEDULE_SPRAY",
            "urgency": "high",
            "message": f"⚠️ HIGH RISK: Humidity {humidity}%, Temp {temp}°C, Leaf Wetness {leaf_wetness}h. Schedule preventive spray within 48 hours. Inspect leaf tips for early spindle-shaped lesions.",
            "products": ["Tricyclazole 75% WP", "Carbendazim 50% WP"],
        }
    elif risk_level == "MODERATE":
        return {
            "action": "MONITOR",
            "urgency": "moderate",
            "message": f"🔍 MODERATE: Humidity {humidity}%, Temp {temp}°C. Continue field scouting every 3 days. Bio-fungicide application is optional at this stage.",
            "products": ["Pseudomonas fluorescens 1.15% WP"],
        }
    else:
        return {
            "action": "NO_ACTION",
            "urgency": "low",
            "message": f"✅ LOW RISK: Conditions unfavorable for blast pathogen. Maintain routine crop monitoring.",
            "products": [],
        }
