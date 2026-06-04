const categoryMap = {
  top: "top", shirt: "top", "t-shirt": "top", tshirt: "top",
  blouse: "top", hoodie: "top", sweatshirt: "top", sweater: "top",
  pullover: "top", "tank top": "top", "crop top": "top",
  bodysuit: "top", polo: "top", tunic: "top", "polo shirt": "top",
  bottom: "bottom", pants: "bottom", jeans: "bottom", shorts: "bottom",
  trousers: "bottom", chinos: "bottom", leggings: "bottom",
  joggers: "bottom", "cargo pants": "bottom", sweatpants: "bottom",
  skirt: "bottom", "mini skirt": "bottom",
  outerwear: "outerwear", jacket: "outerwear", blazer: "outerwear",
  coat: "outerwear", cardigan: "outerwear", vest: "outerwear",
  bomber: "outerwear", parka: "outerwear", raincoat: "outerwear",
  windbreaker: "outerwear", "trench coat": "outerwear",
  dress: "dress", gown: "dress", "maxi dress": "dress",
  sundress: "dress", jumpsuit: "dress", romper: "dress",
  overalls: "dress",
  footwear: "footwear", shoes: "footwear", boots: "footwear",
  sneakers: "footwear", sandals: "footwear", heels: "footwear",
  loafers: "footwear", flats: "footwear", trainers: "footwear",
  oxfords: "footwear", moccasins: "footwear", "high heels": "footwear",
  accessory: "accessory", hat: "accessory", cap: "accessory",
  scarf: "accessory", belt: "accessory", bag: "accessory",
  watch: "accessory", jewelry: "accessory", gloves: "accessory",
  sunglasses: "accessory", tie: "accessory", wallet: "accessory",
  backpack: "accessory", necklace: "accessory", earrings: "accessory",
  bracelet: "accessory", ring: "accessory",
};

const styleMap = {
  casual: "casual", "smart-casual": "smart-casual", formal: "formal",
  streetwear: "streetwear", sport: "sport", athleisure: "sport",
  business: "formal", "business casual": "smart-casual",
  "semi-formal": "smart-casual", bohemian: "casual", vintage: "casual",
  punk: "streetwear", edgy: "streetwear", minimalist: "smart-casual",
  elegant: "formal", chic: "smart-casual", beach: "casual", party: "formal",
  preppy: "smart-casual", grunge: "streetwear",
};

const patternMap = {
  solid: "solid", striped: "striped", stripes: "striped",
  checked: "checked", checkered: "checked", plaid: "checked",
  tartan: "checked", graphic: "graphic", print: "graphic",
  floral: "floral", "floral print": "floral", camouflage: "graphic",
  "polka dot": "graphic", geometric: "graphic", "animal print": "graphic",
  "tie-dye": "graphic", ombre: "graphic", "color-block": "graphic",
  colorblock: "graphic", embroidered: "graphic", lace: "graphic",
  pinstripe: "striped", herringbone: "checked", houndstooth: "checked",
  argyle: "graphic", "fair isle": "graphic",
};

const seasonAliases = {
  spring: "spring", summer: "summer",
  autumn: "autumn", fall: "autumn",
  winter: "winter",
};

const genderMap = {
  male: "male", man: "male", men: "male", masculine: "male",
  female: "female", woman: "female", women: "female", feminine: "female",
  unisex: "unisex", neutral: "unisex", androgynous: "unisex",
};

function bestMatch(value, map, defaultValue) {
  if (!value) return defaultValue;
  const v = String(value).toLowerCase().trim();
  if (map[v]) return map[v];
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (v.includes(key)) return map[key];
  }
  return defaultValue;
}

function normalizeCategory(raw) {
  return bestMatch(raw, categoryMap, "top");
}

function normalizeStyle(raw) {
  return bestMatch(raw, styleMap, "casual");
}

function normalizePattern(raw) {
  return bestMatch(raw, patternMap, "solid");
}

function normalizeSeasons(raw) {
  if (!raw) return ["spring", "summer"];
  const input = Array.isArray(raw) ? raw : [raw];
  const seasons = input.map((s) => seasonAliases[String(s).toLowerCase().trim()]).filter(Boolean);
  return seasons.length ? [...new Set(seasons)] : ["spring", "summer"];
}

function normalizeGender(raw) {
  return bestMatch(raw, genderMap, "unisex");
}

function normalizeColors(colors) {
  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    return [{ color: "unknown", percentage: 100 }];
  }
  return colors.map((c) => ({
    color: String(c.color || "unknown").toLowerCase().trim(),
    percentage: Math.round(Math.min(Math.max(Number(c.percentage) || 0, 0), 100)),
  }));
}

function normalizeGarment(raw) {
  const category = normalizeCategory(raw.category || raw.type || "");
  const specificType = raw.specificType || raw.type || "garment";
  const colors = normalizeColors(
    raw.colors || (raw.color ? [{ color: raw.color, percentage: 100 }] : null)
  );
  return {
    category,
    specificType: String(specificType).toLowerCase().trim(),
    confidence: Math.min(Math.max(Number(raw.confidence) || 1, 0), 1),
    colors,
    style: normalizeStyle(raw.style),
    pattern: normalizePattern(raw.pattern),
    season: normalizeSeasons(raw.season),
    gender: normalizeGender(raw.gender),
  };
}

function extractBracketed(text, open, close) {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === open) {
      if (start === -1) start = i;
      depth++;
    } else if (text[i] === close) {
      depth--;
      if (depth === 0 && start !== -1) return text.slice(start, i + 1);
    }
  }
  return null;
}

function extractJsonObject(text) {
  return extractBracketed(text, "{", "}");
}

function extractJsonArray(text) {
  return extractBracketed(text, "[", "]");
}

function tryParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseGarments(rawContent) {
  if (!rawContent) return [];
  const trimmed = rawContent.trim();
  let garmentsArray = [];

  const obj = extractJsonObject(trimmed);
  if (obj) {
    const parsed = tryParse(obj);
    if (parsed) {
      if (parsed.garments && Array.isArray(parsed.garments)) {
        garmentsArray = parsed.garments;
      } else if (parsed.category || parsed.type) {
        garmentsArray = [parsed];
      }
    }
  }

  if (!garmentsArray.length) {
    const arr = extractJsonArray(trimmed);
    if (arr) {
      const parsed = tryParse(arr);
      if (Array.isArray(parsed)) garmentsArray = parsed;
    }
  }

  if (!garmentsArray.length) {
    const found = trimmed.match(/["']?garments["']?\s*:\s*\[([\s\S]*?)\]/i);
    if (found) {
      const fallback = tryParse(`[${found[1]}]`);
      if (Array.isArray(fallback)) garmentsArray = fallback;
    }
  }

  return garmentsArray.map(normalizeGarment);
}

function getDetectionType(garments) {
  if (!garments || garments.length === 0) return "unknown";
  if (garments.length === 1) return "single";
  const cats = garments.map((g) => g.category);
  const unique = new Set(cats);
  if (unique.size >= 2) return "outfit";
  return "multiple";
}

function getItemColors(item) {
  if (item.colors && Array.isArray(item.colors) && item.colors.length > 0) {
    return item.colors;
  }
  if (item.color) {
    return [{ color: item.color, percentage: 100 }];
  }
  return [{ color: "unknown", percentage: 100 }];
}

module.exports = {
  normalizeCategory,
  normalizeStyle,
  normalizePattern,
  normalizeSeasons,
  normalizeGender,
  normalizeColors,
  normalizeGarment,
  parseGarments,
  getDetectionType,
  getItemColors,
};
