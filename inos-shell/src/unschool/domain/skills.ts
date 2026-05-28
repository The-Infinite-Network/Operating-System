import type { SkillNode } from "./models";

export const SKILL_TAXONOMY: Array<Pick<SkillNode, "id" | "domain" | "label">> =
  [
    { id: "literacy.letter_names", domain: "Literacy", label: "Letter names" },
    { id: "literacy.letter_sounds", domain: "Literacy", label: "Letter sounds" },
    {
      id: "literacy.phonemic_awareness",
      domain: "Literacy",
      label: "Phonemic awareness",
    },
    { id: "literacy.cvc_decoding", domain: "Literacy", label: "CVC decoding" },
    {
      id: "literacy.blends_digraphs",
      domain: "Literacy",
      label: "Blends & digraphs",
    },
    { id: "literacy.fluency", domain: "Literacy", label: "Fluency" },
    {
      id: "literacy.comprehension",
      domain: "Literacy",
      label: "Comprehension",
    },
    {
      id: "literacy.encoding_spelling",
      domain: "Literacy",
      label: "Encoding & spelling",
    },
    { id: "math.number_id", domain: "Math", label: "Number ID" },
    {
      id: "math.counting_one_to_one",
      domain: "Math",
      label: "Counting one-to-one",
    },
    { id: "math.addition", domain: "Math", label: "Addition" },
    { id: "math.subtraction", domain: "Math", label: "Subtraction" },
    { id: "math.place_value", domain: "Math", label: "Place value" },
    { id: "math.patterns", domain: "Math", label: "Patterns" },
    {
      id: "life.kitchen_safety",
      domain: "Life Skills",
      label: "Kitchen safety",
    },
    { id: "life.hygiene", domain: "Life Skills", label: "Hygiene" },
    {
      id: "life.mise_en_place",
      domain: "Life Skills",
      label: "Mise en place",
    },
    {
      id: "life.cooking_steps",
      domain: "Life Skills",
      label: "Cooking steps",
    },
    {
      id: "life.cleanup_reset",
      domain: "Life Skills",
      label: "Cleanup & reset",
    },
    {
      id: "life.organization_belongs_where",
      domain: "Life Skills",
      label: "Organization (belongs-where)",
    },
    {
      id: "life.money_store_math",
      domain: "Life Skills",
      label: "Money & store math",
    },
    {
      id: "life.time_routines",
      domain: "Life Skills",
      label: "Time & routines",
    },
    {
      id: "exec.attention_stamina",
      domain: "Executive Function",
      label: "Attention stamina",
    },
    {
      id: "exec.directions_1_2_3_step",
      domain: "Executive Function",
      label: "Directions 1-2-3 step",
    },
    {
      id: "exec.task_initiation",
      domain: "Executive Function",
      label: "Task initiation",
    },
    {
      id: "exec.follow_through",
      domain: "Executive Function",
      label: "Follow-through",
    },
    {
      id: "social.frustration_tolerance",
      domain: "Social/Emotional",
      label: "Frustration tolerance",
    },
    {
      id: "social.communication_help_request",
      domain: "Social/Emotional",
      label: "Ask for help",
    },
    {
      id: "social.cooperative_play",
      domain: "Social/Emotional",
      label: "Cooperative play",
    },
  ];

export function createDefaultSkillNode(
  base: Pick<SkillNode, "id" | "domain" | "label">
): SkillNode {
  return {
    ...base,
    level: 0,
    mastery: 0,
    evidenceCount: 0,
  };
}
