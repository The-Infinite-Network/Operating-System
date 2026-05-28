export const TWIN_PROFILE_FLOW = {
    "flow_name": "Fulcrum System Twin Profile Builder",
    "version": "1.0",
    "total_estimated_time": "45-60 minutes",
    "sections": [
        {
            "section_id": "foundation",
            "title": "Foundation — Who You Are",
            "estimated_time": "10 min",
            "questions": [
                {
                    "q_id": "F1",
                    "text": "What is your name? What do you prefer to be called?",
                    "maps_to": ["identity.human_name", "identity.preferred_name"],
                    "validation": "required"
                },
                {
                    "q_id": "F2",
                    "text": "What roles do you play? (e.g., Founder, Baker, Leader, Parent)",
                    "maps_to": ["identity.roles"],
                    "validation": "min_1"
                },
                {
                    "q_id": "F3",
                    "text": "What entities/organizations do you anchor? (businesses, teams, ventures)",
                    "maps_to": ["identity.entities"],
                    "validation": "min_1"
                },
                {
                    "q_id": "F4",
                    "text": "In one sentence: What drives you? What is your purpose?",
                    "maps_to": ["identity.driving_force"],
                    "validation": "required",
                    "example": "I help people bring their vision to life so they can live the life they envision."
                }
            ]
        },
        {
            "section_id": "values",
            "title": "Values — What You Stand For",
            "estimated_time": "15 min",
            "questions": [
                {
                    "q_id": "V1",
                    "text": "What are your core values? List 3-7 principles that guide your decisions.",
                    "maps_to": ["identity.core_values"],
                    "validation": "min_3_max_7",
                    "reference": "LDR's: Bold Authenticity, Purposeful Autonomy, Inventive Ingenuity, Unyielding Resolve, Unwavering Loyalty, Servant Leadership"
                },
                {
                    "q_id": "V2",
                    "text": "Define each value. Not dictionary definition — how YOU live it.",
                    "maps_to": ["identity.core_values_definitions"],
                    "validation": "required_if_V1"
                },
                {
                    "q_id": "V3",
                    "text": "Which value do you compromise FIRST under pressure?",
                    "maps_to": ["identity.value_priority"],
                    "purpose": "Ranks values by resilience"
                },
                {
                    "q_id": "V4",
                    "text": "What's the one behavior you'd fire your best performer for?",
                    "maps_to": ["guardrails.hard_nos"],
                    "validation": "required",
                    "example": "Concealing problems until crisis point"
                },
                {
                    "q_id": "V5",
                    "text": "Give me 2 more hard lines. Non-negotiables.",
                    "maps_to": ["guardrails.hard_nos"],
                    "validation": "min_2"
                }
            ]
        },
        {
            "section_id": "operations",
            "title": "Operations — How You Work Best",
            "estimated_time": "15 min",
            "questions": [
                {
                    "q_id": "O1",
                    "text": "When are you sharpest? (time of day, conditions)",
                    "maps_to": ["work_style.energy_pattern"],
                    "validation": "required"
                },
                {
                    "q_id": "O2",
                    "text": "What conditions produce your BEST work? (environment, support, structure)",
                    "maps_to": ["work_style.best_conditions"],
                    "validation": "min_3",
                    "reference": "Personal Identity Audit Q4"
                },
                {
                    "q_id": "O3",
                    "text": "What derails your focus? (meetings, interruptions, unclear goals)",
                    "maps_to": ["work_style.stressors"],
                    "validation": "min_2"
                },
                {
                    "q_id": "O4",
                    "text": "What calms you when stressed? (checklists, exercise, solitude)",
                    "maps_to": ["work_style.calmers"],
                    "validation": "min_2"
                },
                {
                    "q_id": "O5",
                    "text": "How much detail do you want in updates? (just bullets, full context, or somewhere in between)",
                    "maps_to": ["work_style.communication_protocol.detail_level"],
                    "validation": "required"
                },
                {
                    "q_id": "O6",
                    "text": "Any words or phrases that annoy you? (e.g., corporate jargon, buzzwords)",
                    "maps_to": ["work_style.communication_protocol.banned_language"],
                    "example": "LDR bans: foster, nurture, journey, landscape"
                },
                {
                    "q_id": "O7",
                    "text": "How do you want feedback delivered? (direct, sandwiched, Socratic)",
                    "maps_to": ["work_style.communication_protocol.feedback_format"],
                    "validation": "required"
                }
            ]
        },
        {
            "section_id": "skills",
            "title": "Skills — Strengths & Development",
            "estimated_time": "10 min",
            "questions": [
                {
                    "q_id": "S1",
                    "text": "What are you exceptional at? (tasks, skills, domains)",
                    "maps_to": ["skills.strengths"],
                    "validation": "min_3",
                    "reference": "Discovering Oneself Section A"
                },
                {
                    "q_id": "S2",
                    "text": "What are you actively working to improve?",
                    "maps_to": ["skills.growth_areas"],
                    "validation": "min_1"
                },
                {
                    "q_id": "S3",
                    "text": "What tasks should NEVER be delegated to you? (hard limits on your role)",
                    "maps_to": ["skills.off_limits"],
                    "example": "Detailed bookkeeping, cold calling, graphic design"
                }
            ]
        },
        {
            "section_id": "boundaries",
            "title": "Boundaries — Decision Rights",
            "estimated_time": "10 min",
            "questions": [
                {
                    "q_id": "B1",
                    "text": "What can your team do WITHOUT asking you first?",
                    "maps_to": ["guardrails.approval_rules.can_do_autonomously"],
                    "validation": "min_3",
                    "example": "Approve expenses <$500, schedule non-critical meetings, create draft documents"
                },
                {
                    "q_id": "B2",
                    "text": "What MUST come to you for approval?",
                    "maps_to": ["guardrails.approval_rules.must_get_approval"],
                    "validation": "min_3",
                    "example": "Hiring/firing, client contracts, pricing changes"
                },
                {
                    "q_id": "B3",
                    "text": "What can be logged publicly? (systems, decisions, operational patterns)",
                    "maps_to": ["guardrails.privacy_rules.log_ok"],
                    "validation": "min_2"
                },
                {
                    "q_id": "B4",
                    "text": "What should NEVER be logged? (personal conflicts, health, family)",
                    "maps_to": ["guardrails.privacy_rules.log_never"],
                    "validation": "min_1"
                }
            ]
        }
    ],
    "completion": {
        "message": "Twin Profile draft complete. Review, edit, and lock to activate TEAM AI integration.",
        "next_steps": [
            "Review extracted profile",
            "Edit any fields",
            "Lock profile (activates agents)",
            "Begin first mission"
        ]
    }
};
