"""POST /generate-report — Generate a full structured AI risk report."""
import logging
from flask import Blueprint, request, jsonify
from services.ai_service import generate_report

logger = logging.getLogger(__name__)
report_bp = Blueprint("report", __name__)


@report_bp.post("/generate-report")
def generate_report_endpoint():
    data = request.get_json(silent=True) or {}

    risk_name = data.get("risk_name", "").strip()
    if not risk_name:
        return jsonify({"error": "risk_name is required"}), 400

    description          = data.get("description", "")
    category             = data.get("category", "OPERATIONAL")
    likelihood           = int(data.get("likelihood", 5))
    impact               = int(data.get("impact", 5))
    inherent_risk        = float(data.get("inherent_risk", likelihood * impact))
    control_effectiveness = int(data.get("control_effectiveness", 0))
    residual_risk        = float(data.get("residual_risk", inherent_risk))
    risk_level           = data.get("risk_level", "MEDIUM")
    status               = data.get("status", "OPEN")

    if not (1 <= likelihood <= 10) or not (1 <= impact <= 10):
        return jsonify({"error": "likelihood and impact must be between 1 and 10"}), 400
    if not (0 <= control_effectiveness <= 100):
        return jsonify({"error": "control_effectiveness must be 0-100"}), 400

    try:
        result = generate_report(
            risk_name, description, category,
            likelihood, impact, inherent_risk,
            control_effectiveness, residual_risk,
            risk_level, status
        )
        return jsonify({"report": result}), 200
    except ValueError as e:
        logger.warning("Rejected report request: %s", e)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error("generate_report error: %s", e)
        fallback = {
            "title": f"Risk Assessment Report: {risk_name}",
            "summary": "AI report generation temporarily unavailable. Manual review required.",
            "overview": "Please review this risk manually and complete the report.",
            "key_findings": ["Manual assessment required"],
            "recommendations": ["Conduct manual risk review and implement appropriate controls"],
        }
        return jsonify({"report": fallback}), 200
