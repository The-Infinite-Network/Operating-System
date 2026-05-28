from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json

class CommunicationProtocol(BaseModel):
    banned_language: List[str] = []
    required_tone: Optional[str] = None
    feedback_format: Optional[str] = None
    detail_level: Optional[str] = None

class WorkStyle(BaseModel):
    communication_protocol: CommunicationProtocol = Field(default_factory=CommunicationProtocol)
    energy_pattern: Optional[str] = None
    best_conditions: List[str] = []
    stressors: List[str] = []
    calmers: List[str] = []

class Identity(BaseModel):
    human_name: Optional[str] = None
    preferred_name: Optional[str] = None
    roles: List[str] = []
    entities: List[str] = []
    core_values: List[str] = []
    leadership_pillars: List[str] = []
    moral_compass: Optional[str] = None
    driving_force: Optional[str] = None
    identity_statement: Optional[str] = None

class ApprovalRules(BaseModel):
    can_do_autonomously: List[str] = []
    must_get_approval: List[str] = []

class PrivacyRules(BaseModel):
    log_ok: List[str] = []
    log_never: List[str] = []

class Guardrails(BaseModel):
    hard_nos: List[str] = []
    approval_rules: ApprovalRules = Field(default_factory=ApprovalRules)
    privacy_rules: PrivacyRules = Field(default_factory=PrivacyRules)

class CognitiveProfile(BaseModel):
    working_genius: Optional[Dict[str, str]] = None
    other_traits: List[str] = []

class Skills(BaseModel):
    strengths: List[str] = []
    edge_strengths: List[str] = []
    growth_areas: List[str] = []
    blind_spots: List[str] = []
    off_limits: List[str] = []

class Narrative(BaseModel):
    origin_story: Optional[str] = None
    future_vision: Optional[str] = None
    key_themes: List[str] = []

class TransformationLayer(BaseModel):
    aspirational_goals: List[str] = []
    behavioral_shifts: List[str] = []

class DiscoveryMetadata(BaseModel):
    aspirational_archetypes: List[str] = []
    extraction_date: Optional[str] = None
    source_documents: List[str] = []

class ConfidenceScores(BaseModel):
    identity: float = 0.0
    work_style: float = 0.0
    skills: float = 0.0
    guardrails: float = 0.0
    cognitive: float = 0.0

class TwinProfileV3(BaseModel):
    identity: Identity = Field(default_factory=Identity)
    work_style: WorkStyle = Field(default_factory=WorkStyle)
    cognitive_profile: CognitiveProfile = Field(default_factory=CognitiveProfile)
    skills: Skills = Field(default_factory=Skills)
    guardrails: Guardrails = Field(default_factory=Guardrails)
    narrative: Narrative = Field(default_factory=Narrative)
    transformation_layer: TransformationLayer = Field(default_factory=TransformationLayer)
    discovery_metadata: DiscoveryMetadata = Field(default_factory=DiscoveryMetadata)
    confidence_scores: ConfidenceScores = Field(default_factory=ConfidenceScores)
    gaps: List[str] = []
    machine_notes: Optional[str] = None

    @classmethod
    def get_schema_json(cls):
        return json.dumps(cls.model_json_schema(), indent=2)
