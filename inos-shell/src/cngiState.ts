export type CngiRole = "ADMIN" | "EDITOR" | "VIEWER";

export type CngiUser = {
  id: string;
  email: string;
  role: CngiRole;
  createdAt: string;
};

export type MenuSeasonStatus = "Draft" | "Published" | "Archived";

export type MenuSeason = {
  id: string;
  name: string;
  status: MenuSeasonStatus;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuItemStatus = "Draft" | "Published" | "Archived";

export type MenuItem = {
  id: string;
  seasonId: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  status: MenuItemStatus;
  sortOrder: number;
  imageUrl?: string | null;
  tags?: string[];
  allergens?: string[];
  availabilityNote?: string | null;
  updatedAt: string;
};

export type ChangeLogEntry = {
  id: string;
  actorUserId: string | null;
  entityType: "MenuSeason" | "MenuItem" | "MenuCategory";
  entityId: string;
  action: string;
  timestamp: string;
  diffJson?: unknown;
};

export type CngiState = {
  users: CngiUser[];
  seasons: MenuSeason[];
  categories: MenuCategory[];
  items: MenuItem[];
  changeLog: ChangeLogEntry[];
};

const STORAGE_KEY = "cngi_menu_state_v1";
const CURRENT_USER_KEY = "cngi_current_user_v1";

function nowIso(): string {
  return new Date().toISOString();
}

function seedInitialState(): CngiState {
  const adminUser: CngiUser = {
    id: "seed_admin",
    email: "admin@cngi.test",
    role: "ADMIN",
    createdAt: nowIso(),
  };

  const yearRoundSeason: MenuSeason = {
    id: "season_year_round",
    name: "Year-Round Menu",
    status: "Published",
    active: false,
    startsAt: null,
    endsAt: null,
    createdAt: nowIso(),
  };

  const winterSeason: MenuSeason = {
    id: "season_winter_2024",
    name: "Winter 2024",
    status: "Published",
    active: true,
    startsAt: "2024-12-01",
    endsAt: "2025-02-13",
    createdAt: nowIso(),
  };

  const valentineSeason: MenuSeason = {
    id: "season_valentine_2025",
    name: "Valentine's 2025",
    status: "Draft",
    active: false,
    startsAt: "2025-02-14",
    endsAt: "2025-02-28",
    createdAt: nowIso(),
  };

  const categories: MenuCategory[] = [
    { id: "cat_cookies", name: "Cookies", sortOrder: 1 },
    { id: "cat_brownies", name: "Brownies & Bars", sortOrder: 2 },
    { id: "cat_holiday", name: "Holiday & Seasonal Treats", sortOrder: 3 },
    { id: "cat_breakfast", name: "Breakfast Bakes & Bagels", sortOrder: 4 },
    { id: "cat_boxes", name: "Boxes & Trays", sortOrder: 5 },
    { id: "cat_pies", name: "Pies (9\")", sortOrder: 6 },
    { id: "cat_cupcakes", name: "Cupcakes", sortOrder: 7 },
    { id: "cat_breads", name: "Breads & Loaves", sortOrder: 8 },
    { id: "cat_pastries", name: "Pastries", sortOrder: 9 },
    { id: "cat_schmear", name: "Cream Cheese", sortOrder: 10 },
    { id: "cat_add_ons", name: "Add-Ons & Gifting", sortOrder: 11 },
    // Seasonal Lens Categories
    { id: "cat_val_cookies", name: "Valentine Cookies", sortOrder: 20 },
    { id: "cat_val_boxes", name: "Gift Boxes", sortOrder: 21 },
    { id: "cat_val_specials", name: "Valentine Specials", sortOrder: 22 },
  ];

  const items: MenuItem[] = [
    // WINTER 2024 (ACTIVE)
    {
      id: "w24_cookie_choc",
      seasonId: winterSeason.id,
      categoryId: "cat_cookies",
      name: "Chocolate Chip",
      description: "Classic bakery style chocolate chip cookies.",
      priceCents: 1600,
      status: "Published",
      sortOrder: 1,
      tags: ["/ doz", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_cookie_snicker",
      seasonId: winterSeason.id,
      categoryId: "cat_cookies",
      name: "Snickerdoodles",
      description: "Soft and chewy cinnamon sugar cookies.",
      priceCents: 1600,
      status: "Published",
      sortOrder: 2,
      tags: ["/ doz", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_cookie_blue",
      seasonId: winterSeason.id,
      categoryId: "cat_cookies",
      name: "Blueberry Lemon",
      description: "Refreshing zesty lemon with real blueberries.",
      priceCents: 1800,
      status: "Published",
      sortOrder: 3,
      tags: ["/ doz", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_cookie_sugar_bc",
      seasonId: winterSeason.id,
      categoryId: "cat_cookies",
      name: "Decorated Sugar Cookies (Buttercream)",
      description: "Soft sugar cookies with creamy buttercream icing.",
      priceCents: 2000,
      status: "Published",
      sortOrder: 4,
      tags: ["/ doz", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_cookie_sugar_ri",
      seasonId: winterSeason.id,
      categoryId: "cat_cookies",
      name: "Decorated Sugar Cookies (Royal Icing)",
      description: "Beautifully detailed cookies with royal icing.",
      priceCents: 2400,
      status: "Published",
      sortOrder: 5,
      tags: ["/ doz", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_bundle_classic",
      seasonId: winterSeason.id,
      categoryId: "cat_boxes",
      name: "2 Dozen Classic Cookies",
      description: "Choose 2 flavors of classic cookies.",
      priceCents: 3000,
      status: "Published",
      sortOrder: 6,
      tags: ["/ bundle", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_bundle_sig",
      seasonId: winterSeason.id,
      categoryId: "cat_boxes",
      name: "2 Dozen Signature Cookies",
      description: "Choose 2 flavors of signature cookies.",
      priceCents: 3400,
      status: "Published",
      sortOrder: 7,
      tags: ["/ bundle", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_pie_pumpkin",
      seasonId: winterSeason.id,
      categoryId: "cat_pies",
      name: "Pumpkin Pie",
      description: "Classic 9\" spiced pumpkin pie.",
      priceCents: 2600,
      status: "Published",
      sortOrder: 8,
      tags: ["/ 9\"", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_bread_sourdough",
      seasonId: winterSeason.id,
      categoryId: "cat_breads",
      name: "Sourdough Loaf",
      description: "Freshly baked artisanal sourdough.",
      priceCents: 800,
      status: "Published",
      sortOrder: 9,
      tags: ["/ loaf", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_pastry_plain",
      seasonId: winterSeason.id,
      categoryId: "cat_pastries",
      name: "Plain Croissant",
      description: "Buttery, flaky classic croissant.",
      priceCents: 300,
      status: "Published",
      sortOrder: 10,
      tags: ["/ each", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_pastry_choc",
      seasonId: winterSeason.id,
      categoryId: "cat_pastries",
      name: "Chocolate Croissant",
      description: "Flaky croissant filled with rich chocolate.",
      priceCents: 350,
      status: "Published",
      sortOrder: 11,
      tags: ["/ each", "Winter"],
      updatedAt: nowIso(),
    },
    {
      id: "w24_add_giftbox",
      seasonId: winterSeason.id,
      categoryId: "cat_add_ons",
      name: "Gift Box & Ribbon",
      description: "Perfect for gifting your treats.",
      priceCents: 300,
      status: "Published",
      sortOrder: 12,
      tags: ["/ each"],
      updatedAt: nowIso(),
    },

    // VALENTINE 2025 (DRAFT)
    {
      id: "v25_cookie_heart",
      seasonId: valentineSeason.id,
      categoryId: "cat_val_cookies",
      name: "Heart Sugar Cookies",
      description: "Heart-shaped sugar cookies with festive icing.",
      priceCents: 2400,
      status: "Draft",
      sortOrder: 1,
      tags: ["/ doz", "Valentine"],
      updatedAt: nowIso(),
    },
    {
      id: "v25_cookie_dipped",
      seasonId: valentineSeason.id,
      categoryId: "cat_val_cookies",
      name: "Chocolate Dipped Sugar Cookies",
      description: "Sugar cookies dipped in high-quality chocolate.",
      priceCents: 2600,
      status: "Draft",
      sortOrder: 2,
      tags: ["/ doz", "Valentine"],
      updatedAt: nowIso(),
    },
    {
      id: "v25_brownie_straw",
      seasonId: valentineSeason.id,
      categoryId: "cat_brownies",
      name: "Chocolate Strawberry Brownies",
      description: "Rich chocolate brownies topped with strawberry.",
      priceCents: 2200,
      status: "Draft",
      sortOrder: 3,
      tags: ["/ pan", "Valentine"],
      updatedAt: nowIso(),
    },
    {
      id: "v25_box_valentine",
      seasonId: valentineSeason.id,
      categoryId: "cat_val_boxes",
      name: "Valentine Cookie Box (Assorted)",
      description: "A lovely assortment of our best Valentine treats.",
      priceCents: 3500,
      status: "Draft",
      sortOrder: 4,
      tags: ["/ box", "Valentine"],
      updatedAt: nowIso(),
    },
    {
      id: "v25_box_sweetheart",
      seasonId: valentineSeason.id,
      categoryId: "cat_val_boxes",
      name: "Sweetheart Sampler Box",
      description: "Extensive sampler box for your sweetheart.",
      priceCents: 4500,
      status: "Draft",
      sortOrder: 5,
      tags: ["/ box", "Valentine"],
      updatedAt: nowIso(),
    },
    {
      id: "v25_special_be_mine",
      seasonId: valentineSeason.id,
      categoryId: "cat_val_specials",
      name: "\"Be Mine\" Mini Cookie Set",
      description: "Adorable mini cookies with sweet messages.",
      priceCents: 1500,
      status: "Draft",
      sortOrder: 6,
      tags: ["/ set", "Valentine"],
      updatedAt: nowIso(),
    },

    // YEAR-ROUND CATALOG
    {
      id: "yr_cookie_choc",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_cookies",
      name: "Chocolate Chip",
      description: "Classic bakery style chocolate chip cookies.",
      priceCents: 1600,
      status: "Published",
      sortOrder: 1,
      tags: ["/ doz"],
      updatedAt: nowIso(),
    },
    {
      id: "yr_cookie_oat",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_cookies",
      name: "Oatmeal Cran Orange",
      description: "Zesty orange and chewy cranberries in oatmeal.",
      priceCents: 1600,
      status: "Published",
      sortOrder: 2,
      tags: ["/ doz"],
      updatedAt: nowIso(),
    },
    {
      id: "yr_bagel_each",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_breakfast",
      name: "Bagel (Each)",
      description: "Plain, Everything, Blueberry, Cranberry Orange, or Cinnamon Raisin.",
      priceCents: 225,
      status: "Published",
      sortOrder: 3,
      tags: ["/ each"],
      updatedAt: nowIso(),
    },
    {
      id: "yr_bagel_half",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_breakfast",
      name: "Bagels (Half Dozen)",
      description: "Mix and match any of our fresh flavors.",
      priceCents: 1200,
      status: "Published",
      sortOrder: 4,
      tags: ["/ half-doz"],
      updatedAt: nowIso(),
    },
    {
      id: "yr_bagel_doz",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_breakfast",
      name: "Bagels (Dozen)",
      description: "A full dozen of our fresh bakery bagels.",
      priceCents: 2200,
      status: "Published",
      sortOrder: 5,
      tags: ["/ doz"],
      updatedAt: nowIso(),
    },
    {
      id: "yr_schmear_plain",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_schmear",
      name: "Plain Schmear",
      description: "Classic cream cheese spread.",
      priceCents: 75,
      status: "Published",
      sortOrder: 6,
      tags: ["/ smear"],
      updatedAt: nowIso(),
    },
    {
      id: "yr_tub_plain",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_schmear",
      name: "Plain Cream Cheese (8oz Tub)",
      description: "Family size plain cream cheese.",
      priceCents: 400,
      status: "Published",
      sortOrder: 7,
      tags: ["/ tub"],
      updatedAt: nowIso(),
    },
    {
      id: "yr_add_mix",
      seasonId: yearRoundSeason.id,
      categoryId: "cat_add_ons",
      name: "Mix 2 Flavors",
      description: "Applies per dozen when mixing flavors.",
      priceCents: 100,
      status: "Published",
      sortOrder: 8,
      tags: ["/ doz"],
      updatedAt: nowIso(),
    }
    ,
  ];

  return {
    users: [adminUser],
    seasons: [yearRoundSeason, winterSeason, valentineSeason],
    categories,
    items,
    changeLog: [],
  };
}

export function loadCngiState(): CngiState {
  if (typeof window === "undefined") {
    return seedInitialState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as CngiState;
    if (!parsed.users || !parsed.seasons || !parsed.categories || !parsed.items) {
      throw new Error("Incomplete CNGI state in storage");
    }
    return parsed;
  } catch {
    const seeded = seedInitialState();
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      }
    } catch {
      // ignore storage errors
    }
    return seeded;
  }
}

export function saveCngiState(next: CngiState): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best-effort persistence only
  }
}

export function appendChangeLog(
  state: CngiState,
  entry: Omit<ChangeLogEntry, "id" | "timestamp">
): CngiState {
  const fullEntry: ChangeLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: nowIso(),
  };
  return {
    ...state,
    changeLog: [fullEntry, ...state.changeLog].slice(0, 200),
  };
}

export function getCurrentUser(): CngiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CngiUser;
    return parsed || null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: CngiUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore
  }
}
