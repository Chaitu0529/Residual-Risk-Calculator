"""
AI Service Layer — orchestrates prompt loading and GroqClient calls.
"""
import os
import json
import logging
from pathlib import Path
from services.groq_client import GroqClient, _sanitize_input

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt template not found: {filename}")
    return path.read_text(encoding="utf-8")


def _get_client() -> GroqClient:
    return GroqClient()


# ── Description ───────────────────────────────────────────────────────────────

def generate_description(risk_name: str, description: str,
                          category: str, likelihood: int, impact: int) -> str:
    """Generate a professional risk description using Llama-3.3-70B."""
    system_prompt = _load_prompt("risk_description.txt")
    user_message = (
        f"Risk Name: {_sanitize_input(risk_name)}\n"
        f"Current Description: {_sanitize_input(description)}\n"
        f"Category: {_sanitize_input(category)}\n"
        f"Likelihood: {likelihood}/10\n"
        f"Impact: {impact}/10\n\n"
        "Generate a comprehensive professional risk description."
    )

    cache_payload = {
        "risk_name": risk_name, "category": category,
        "likelihood": likelihood, "impact": impact
    }

    try:
        client = _get_client()
        return client.complete(system_prompt, user_message,
                               cache_key_payload=cache_payload,
                               endpoint="describe")
    except Exception as e:
        logger.error("generate_description error: %s", e)
        return _fallback_description(risk_name, category, likelihood, impact)


def _fallback_description(risk_name, category, likelihood, impact) -> str:
    return (
        f"**{risk_name}** is a {category.replace('_', ' ').lower()} risk with a likelihood "
        f"rating of {likelihood}/10 and an impact rating of {impact}/10. "
        "This risk requires formal assessment and appropriate mitigation controls to reduce "
        "potential exposure to the organisation. A comprehensive risk treatment plan should "
        "be developed and monitored on a regular basis to ensure residual risk remains "
        "within acceptable tolerance levels."
    )


# ── Recommendations ───────────────────────────────────────────────────────────

def generate_recommendations(risk_name: str, description: str, category: str,
                               likelihood: int, impact: int,
                               residual_risk: float, risk_level: str) -> list:
    """Generate structured mitigation recommendations (minimum 3)."""
    system_prompt = _load_prompt("risk_recommendation.txt")
    user_message = (
        f"Risk Name: {_sanitize_input(risk_name)}\n"
        f"Description: {_sanitize_input(description)}\n"
        f"Category: {_sanitize_input(category)}\n"
        f"Likelihood: {likelihood}/10\n"
        f"Impact: {impact}/10\n"
        f"Residual Risk Score: {residual_risk}\n"
        f"Risk Level: {_sanitize_input(risk_level)}\n\n"
        "Return a JSON array of at least 3 recommendations. "
        "Each must have: action_type, priority (HIGH/MEDIUM/LOW), and description."
    )

    cache_payload = {
        "risk_name": risk_name, "category": category,
        "likelihood": likelihood, "impact": impact, "risk_level": risk_level
    }

    try:
        client = _get_client()
        raw = client.complete(system_prompt, user_message,
                              cache_key_payload=cache_payload,
                              endpoint="recommend")
        # Extract JSON array from response
        return _parse_json_array(raw)
    except Exception as e:
        logger.error("generate_recommendations error: %s", e)
        return _fallback_recommendations(risk_level)


def _parse_json_array(text: str) -> list:
    """Robustly extract a JSON array from LLM output."""
    # Try direct parse
    text = text.strip()
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
    except json.JSONDecodeError:
        pass

    # Extract array between first [ and last ]
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        try:
            result = json.loads(text[start:end + 1])
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass

    # Return fallback
    return _fallback_recommendations("MEDIUM")


def _fallback_recommendations(risk_level: str) -> list:
    return [
        {
            "action_type": "PREVENTIVE",
            "priority": "HIGH",
            "description": "Implement a comprehensive risk treatment plan with clearly defined "
                           "ownership, milestones, and KPIs to reduce the likelihood of this risk."
        },
        {
            "action_type": "DETECTIVE",
            "priority": "HIGH",
            "description": "Establish continuous monitoring and alerting mechanisms to detect "
                           "early warning indicators associated with this risk materialising."
        },
        {
            "action_type": "CORRECTIVE",
            "priority": "MEDIUM",
            "description": "Develop and test an incident response plan and business continuity "
                           "procedure to minimise impact if this risk event occurs."
        },
        {
            "action_type": "ADMINISTRATIVE",
            "priority": "MEDIUM",
            "description": "Conduct regular staff awareness training and communicate risk "
                           "policies to all relevant stakeholders on a quarterly basis."
        },
        {
            "action_type": "TECHNICAL",
            "priority": "MEDIUM" if risk_level in ("LOW", "MEDIUM") else "HIGH",
            "description": "Deploy technical controls including access restrictions, encryption, "
                           "and automated compliance checks to reduce the residual risk exposure."
        },
    ]


# ── Report ────────────────────────────────────────────────────────────────────

def generate_report(risk_name: str, description: str, category: str,
                     likelihood: int, impact: int, inherent_risk: float,
                     control_effectiveness: int, residual_risk: float,
                     risk_level: str, status: str) -> dict:
    """Generate a full structured risk report."""
    system_prompt = _load_prompt("risk_report.txt")
    user_message = (
        f"Risk Name: {_sanitize_input(risk_name)}\n"
        f"Description: {_sanitize_input(description)}\n"
        f"Category: {_sanitize_input(category)}\n"
        f"Likelihood: {likelihood}/10\n"
        f"Impact: {impact}/10\n"
        f"Inherent Risk Score: {inherent_risk}\n"
        f"Control Effectiveness: {control_effectiveness}%\n"
        f"Residual Risk Score: {residual_risk}\n"
        f"Risk Level: {_sanitize_input(risk_level)}\n"
        f"Status: {_sanitize_input(status)}\n\n"
        "Return a JSON object with: title, summary, overview, "
        "key_findings (array), recommendations (array)."
    )

    cache_payload = {
        "risk_name": risk_name, "category": category,
        "likelihood": likelihood, "impact": impact,
        "inherent_risk": inherent_risk, "control_effectiveness": control_effectiveness,
        "residual_risk": residual_risk
    }

    try:
        client = _get_client()
        raw = client.complete(system_prompt, user_message,
                              cache_key_payload=cache_payload,
                              endpoint="report")
        return _parse_json_object(raw)
    except Exception as e:
        logger.error("generate_report error: %s", e)
        return _fallback_report(risk_name, risk_level, residual_risk)


def _parse_json_object(text: str) -> dict:
    """Robustly extract a JSON object from LLM output."""
    text = text.strip()
    try:
        result = json.loads(text)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        try:
            result = json.loads(text[start:end + 1])
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass

    return _fallback_report("Unknown Risk", "MEDIUM", 0.0)


def _fallback_report(risk_name: str, risk_level: str, residual_risk: float) -> dict:
    return {
        "title": f"Risk Assessment Report: {risk_name}",
        "summary": (
            f"This report provides a formal assessment of '{risk_name}', currently classified "
            f"as {risk_level} with a residual risk score of {residual_risk:.2f}."
        ),
        "overview": (
            "The risk has been evaluated based on likelihood, impact, and existing control "
            "effectiveness. The assessment identifies areas requiring immediate attention "
            "and provides actionable recommendations to reduce residual exposure."
        ),
        "key_findings": [
            f"Risk classified as {risk_level} with residual score {residual_risk:.2f}",
            "Current controls provide partial mitigation but further improvements are needed",
            "Immediate management attention and resource allocation is recommended",
        ],
        "recommendations": [
            "Strengthen existing controls and implement additional preventive measures",
            "Assign dedicated risk owner with clear accountability and reporting lines",
            "Schedule quarterly risk reviews to track mitigation progress",
            "Conduct tabletop exercises to test incident response readiness",
        ],
    }
