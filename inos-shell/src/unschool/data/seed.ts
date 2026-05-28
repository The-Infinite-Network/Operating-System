import { v4 as uuidv4 } from "uuid";
import { SKILL_TAXONOMY, createDefaultSkillNode } from "../domain/skills";
import type {
  ActivityTemplate,
  LifeSkillTemplate,
  Session,
  StudentProfile,
} from "../domain/models";
import { activityRepo, lifeSkillRepo, sessionRepo, skillRepo, studentRepo } from "./repositories";

const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: "activity-literacy-cvc",
    domain: "Literacy",
    skillIds: ["literacy.cvc_decoding", "literacy.phonemic_awareness"],
    title: "CVC Sprint + Phoneme Pop",
    durationMin: 10,
    materials: ["letter cards"],
    steps: ["Warm sound pop", "Blend 5 CVC words", "Quick win"],
    scoringType: "markSet",
    variants: { easy: "2-letter blends", hard: "digraph mix" },
  },
  {
    id: "activity-math-counting",
    domain: "Math",
    skillIds: ["math.counting_one_to_one", "math.number_id"],
    title: "Count & Match",
    durationMin: 10,
    materials: ["tokens", "number cards"],
    steps: ["Count objects", "Match to numeral", "Celebrate"],
    scoringType: "numericCount",
  },
  {
    id: "activity-life-organization",
    domain: "Life Skills",
    skillIds: ["life.organization_belongs_where", "life.cleanup_reset"],
    title: "Belongs-Where Sorting",
    durationMin: 6,
    materials: ["cards", "bins"],
    steps: ["Sort cards", "Explain why", "Reset bins"],
    scoringType: "checklist",
  },
];

const LIFE_SKILL_TEMPLATES: LifeSkillTemplate[] = [
  {
    id: "life-quesadilla",
    title: "Quesadilla (Supervised)",
    environment: "kitchen",
    safetyChecklist: ["Wash hands", "Check stove dial", "Adult nearby"],
    miseChecklist: ["Tortilla", "Cheese", "Spatula", "Plate"],
    stepsChecklist: ["Heat pan", "Add tortilla + cheese", "Flip safely", "Serve"],
    cleanupChecklist: ["Turn off burner", "Wipe surface", "Put tools away"],
    rubric: { safety: 3, independence: 3, followThrough: 3 },
    skillIds: [
      "life.kitchen_safety",
      "life.mise_en_place",
      "life.cooking_steps",
      "life.cleanup_reset",
    ],
  },
  {
    id: "life-hotel-library",
    title: "Hotel/Library Sorting Game",
    environment: "bedroom",
    safetyChecklist: ["Clear floor", "Focus zone ready"],
    miseChecklist: ["Sort bins", "Cards"],
    stepsChecklist: ["Sort items", "Explain belongs-where", "Reset area"],
    cleanupChecklist: ["Bins back", "Floor clear"],
    rubric: { safety: 3, independence: 3, followThrough: 3 },
    skillIds: ["life.organization_belongs_where", "life.cleanup_reset"],
  },
  {
    id: "life-store-trip",
    title: "Store Trip: Counting Money + Choices",
    environment: "store",
    safetyChecklist: ["Stay nearby", "Use indoor voice"],
    miseChecklist: ["Wallet", "List"],
    stepsChecklist: ["Count money", "Compare prices", "Make choice"],
    cleanupChecklist: ["Receipt in wallet", "Return cart"],
    rubric: { safety: 3, independence: 3, followThrough: 3 },
    skillIds: ["life.money_store_math", "life.time_routines"],
  },
  {
    id: "life-laundry",
    title: "Laundry Basics",
    environment: "bedroom",
    safetyChecklist: ["Detergent safety", "Hands dry"],
    miseChecklist: ["Clothes piles", "Detergent", "Basket"],
    stepsChecklist: ["Sort colors", "Load washer", "Add detergent"],
    cleanupChecklist: ["Wipe spills", "Close lid"],
    rubric: { safety: 3, independence: 3, followThrough: 3 },
    skillIds: ["life.cleanup_reset", "exec.follow_through"],
  },
];

export async function seedUnschoolV2() {
  let studentId = "";
  const students = await studentRepo.list();
  if (students.length === 0) {
    const student: StudentProfile = await studentRepo.create({
      name: "Athena",
      ageYears: 6,
      notes: "Seed profile",
    });
    studentId = student.id;
  } else {
    studentId = students[0].id;
  }

  const existingSkills = await skillRepo.list();
  if (existingSkills.length === 0) {
    const skills = SKILL_TAXONOMY.map((base) => createDefaultSkillNode(base));
    await skillRepo.bulkUpsert(skills);
  }

  const existingActivities = await activityRepo.list();
  if (existingActivities.length === 0) {
    await activityRepo.upsertMany(ACTIVITY_TEMPLATES);
  }

  const existingLifeSkills = await lifeSkillRepo.list();
  if (existingLifeSkills.length === 0) {
    await lifeSkillRepo.upsertMany(LIFE_SKILL_TEMPLATES);
  }

  const existingSessions = await sessionRepo.list();
  if (existingSessions.length === 0) {
    const sample: Session = {
      id: uuidv4(),
      studentId,
      title: "First Quesadilla (Supervised)",
      type: "life_skill",
      startedAt: new Date().toISOString(),
      durationMinutesPlanned: 25,
      durationMinutesActual: 25,
      endedEarly: false,
      emotionalTone: "positive",
      notes:
        "We covered safety, mise en place, cleanup. Planned sorting game “Hotel/Library” (belongs-where), paused.",
      activityIds: ["life-quesadilla", "life-hotel-library"],
    };
    await sessionRepo.create(sample);
  }
}
