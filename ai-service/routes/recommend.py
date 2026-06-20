"""POST /recommend — Generate structured AI mitigation recommendations."""
import logging
from flask import Blueprint, request, jsonify
from services.ai_service import generate_recommendations

logger = logging.getLogger(__name__)
recommend_bp = Blueprint("recommend", __name__)


@recommend_bp.post("/recommend")
def recommend():
    data = request.get_json(silent=True) or {}

    risk_name = data.get("risk_name", "").strip()
    if not risk_name:
        return jsonify({"error": "risk_name is required"}), 400

    description    = data.get("description", "")
    category       = data.get("category", "OPERATIONAL")
    likelihood     = int(data.get("likelihood", 5))
    impact         = int(data.get("impact", 5))
    residual_risk  = float(data.get("residual_risk", 0.0))
    risk_level     = data.get("risk_level", "MEDIUM")

    if not (1 <= likelihood <= 10) or not (1 <= impact <= 10):
        return jsonify({"error": "likelihood and impact must be between 1 and 10"}), 400

    try:
        result = generate_recommendations(
            risk_name, description, category,
            likelihood, impact, residual_risk, risk_level
        )
        return jsonify({"recommendations": result}), 200
    except ValueError as e:
        logger.warning("Rejected recommend request: %s", e)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error("recommend error: %s", e)
        fallback = [
            {"action_type": "PREVENTIVE", "priority": "HIGH",
             "description": "Implement comprehensive controls to reduce the likelihood of this risk."},
            {"action_type": "DETECTIVE", "priority": "HIGH",
             "description": "Establish monitoring to detect early warning signs of this risk."},
            {"action_type": "CORRECTIVE", "priority": "MEDIUM",
             "description": "Develop incident response procedures for when this risk materialises."},
        ]
        return jsonify({"recommendations": fallback}), 200
