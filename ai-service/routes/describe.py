"""POST /describe — Generate a professional AI risk description."""
import logging
from flask import Blueprint, request, jsonify
from services.ai_service import generate_description

logger = logging.getLogger(__name__)
describe_bp = Blueprint("describe", __name__)


@describe_bp.post("/describe")
def describe():
    data = request.get_json(silent=True) or {}

    risk_name = data.get("risk_name", "").strip()
    if not risk_name:
        return jsonify({"error": "risk_name is required"}), 400

    description = data.get("description", "")
    category    = data.get("category", "OPERATIONAL")
    likelihood  = int(data.get("likelihood", 5))
    impact      = int(data.get("impact", 5))

    if not (1 <= likelihood <= 10) or not (1 <= impact <= 10):
        return jsonify({"error": "likelihood and impact must be between 1 and 10"}), 400

    try:
        result = generate_description(risk_name, description, category, likelihood, impact)
        return jsonify({"description": result}), 200
    except ValueError as e:
        logger.warning("Rejected describe request: %s", e)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error("describe error: %s", e)
        return jsonify({"error": "AI service error", "description": _fallback(risk_name)}), 200


def _fallback(risk_name: str) -> str:
    return (
        f"{risk_name} represents a significant organisational risk that requires "
        "formal assessment and structured mitigation planning. Stakeholders should "
        "review the risk register and ensure appropriate controls are in place."
    )
