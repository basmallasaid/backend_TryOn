const { getItemColors } = require("./normalizer.js");
const { weatherToSeasons } = require("./weather.js");
const OutfitUsage = require("../models/OutfitUsage");

const CATEGORY = Object.freeze({
  TOP: "top",
  BOTTOM: "bottom",
  SHOES: "footwear",
  OUTERWEAR: "outerwear",
  DRESS: "dress",
  ACCESSORY: "accessory",
});

const STYLE = Object.freeze({
  CASUAL: "casual",
  SMART_CASUAL: "smart-casual",
  FORMAL: "formal",
  STREETWEAR: "streetwear",
  SPORT: "sport",
});

const PATTERN = Object.freeze({
  SOLID: "solid",
  STRIPED: "striped",
  CHECKED: "checked",
  GRAPHIC: "graphic",
  FLORAL: "floral",
});

const SEASON = Object.freeze({
  SPRING: "spring",
  SUMMER: "summer",
  AUTUMN: "autumn",
  WINTER: "winter",
});

const GENDER = Object.freeze({
  MALE: "male",
  FEMALE: "female",
  UNISEX: "unisex",
});

const WEIGHTS = Object.freeze({
  COLOR: 0.35,
  STYLE: 0.25,
  SEASON: 0.15,
  PATTERN: 0.1,
  GENDER: 0.1,
  CATEGORY: 0.05,
  MAX_SCORE: 100,
});

const styleMatrix = (() => {
  const m = {};
  const data = {
    casual: {
      casual: 10,
      "smart-casual": 8,
      formal: 2,
      streetwear: 7,
      sport: 6,
    },
    "smart-casual": {
      casual: 8,
      "smart-casual": 10,
      formal: 8,
      streetwear: 5,
      sport: 3,
    },
    formal: {
      casual: 2,
      "smart-casual": 8,
      formal: 10,
      streetwear: 1,
      sport: 1,
    },
    streetwear: {
      casual: 7,
      "smart-casual": 5,
      formal: 1,
      streetwear: 10,
      sport: 4,
    },
    sport: {
      casual: 6,
      "smart-casual": 3,
      formal: 1,
      streetwear: 4,
      sport: 10,
    },
  };
  for (const [s1, row] of Object.entries(data)) {
    m[s1] = {};
    for (const [s2, val] of Object.entries(row)) m[s1][s2] = val;
  }
  return m;
})();

function scoreStyle(a, b) {
  return (styleMatrix[a] && styleMatrix[a][b]) || 0;
}

const patternMatrix = (() => {
  const m = {};
  const data = {
    solid: { solid: 10, striped: 8, checked: 7, graphic: 6, floral: 7 },
    striped: { solid: 8, striped: 5, checked: 4, graphic: 3, floral: 4 },
    checked: { solid: 7, striped: 4, checked: 5, graphic: 2, floral: 3 },
    graphic: { solid: 6, striped: 3, checked: 2, graphic: 6, floral: 4 },
    floral: { solid: 7, striped: 4, checked: 3, graphic: 4, floral: 8 },
  };
  for (const [p1, row] of Object.entries(data)) {
    m[p1] = {};
    for (const [p2, val] of Object.entries(row)) m[p1][p2] = val;
  }
  return m;
})();

function scorePattern(a, b) {
  return (patternMatrix[a] && patternMatrix[a][b]) || 0;
}

function scoreSeason(itemA, itemB) {
  if (!itemA.season.length || !itemB.season.length) return 5;
  const overlap = itemA.season.filter((s) => itemB.season.includes(s)).length;
  const union = new Set([...itemA.season, ...itemB.season]).size;
  return Math.round((overlap / union) * 10);
}

const baseColorScore = (() => {
  const s = {};
  const pairs = [
    ["black", "white", 10],
    ["black", "gray", 9],
    ["black", "charcoal", 9],
    ["black", "beige", 9],
    ["black", "cream", 9],
    ["black", "khaki", 8],
    ["black", "navy blue", 9],
    ["black", "red", 8],
    ["black", "burgundy", 9],
    ["black", "pink", 7],
    ["black", "green", 7],
    ["black", "teal", 8],
    ["black", "yellow", 7],
    ["black", "orange", 7],
    ["black", "purple", 7],
    ["black", "brown", 7],
    ["black", "maroon", 8],
    ["white", "gray", 9],
    ["white", "charcoal", 9],
    ["white", "beige", 9],
    ["white", "cream", 9],
    ["white", "khaki", 9],
    ["white", "navy blue", 10],
    ["white", "blue", 9],
    ["white", "light blue", 9],
    ["white", "red", 9],
    ["white", "burgundy", 9],
    ["white", "pink", 8],
    ["white", "green", 8],
    ["white", "olive green", 8],
    ["white", "yellow", 8],
    ["white", "orange", 8],
    ["white", "purple", 8],
    ["white", "brown", 8],
    ["white", "teal", 8],
    ["white", "maroon", 8],
    ["gray", "charcoal", 9],
    ["gray", "navy blue", 9],
    ["gray", "blue", 8],
    ["gray", "light blue", 8],
    ["gray", "red", 7],
    ["gray", "burgundy", 8],
    ["gray", "pink", 7],
    ["gray", "green", 7],
    ["gray", "teal", 7],
    ["gray", "beige", 8],
    ["gray", "cream", 8],
    ["gray", "brown", 7],
    ["gray", "maroon", 7],
    ["navy blue", "white", 10],
    ["navy blue", "gray", 9],
    ["navy blue", "light blue", 9],
    ["navy blue", "red", 9],
    ["navy blue", "pink", 8],
    ["navy blue", "beige", 9],
    ["navy blue", "khaki", 9],
    ["navy blue", "cream", 9],
    ["navy blue", "brown", 8],
    ["navy blue", "burgundy", 8],
    ["navy blue", "maroon", 8],
    ["navy blue", "green", 7],
    ["navy blue", "olive green", 7],
    ["navy blue", "yellow", 7],
    ["blue", "white", 9],
    ["blue", "gray", 8],
    ["blue", "light blue", 8],
    ["blue", "beige", 8],
    ["blue", "khaki", 8],
    ["blue", "cream", 8],
    ["blue", "brown", 7],
    ["blue", "navy blue", 7],
    ["blue", "yellow", 6],
    ["light blue", "white", 9],
    ["light blue", "gray", 8],
    ["light blue", "navy blue", 9],
    ["light blue", "beige", 8],
    ["light blue", "khaki", 8],
    ["light blue", "cream", 8],
    ["light blue", "brown", 7],
    ["light blue", "pink", 8],
    ["red", "black", 8],
    ["red", "white", 9],
    ["red", "gray", 7],
    ["red", "navy blue", 9],
    ["red", "beige", 7],
    ["red", "cream", 7],
    ["red", "charcoal", 7],
    ["burgundy", "black", 9],
    ["burgundy", "white", 9],
    ["burgundy", "gray", 8],
    ["burgundy", "navy blue", 8],
    ["burgundy", "beige", 7],
    ["burgundy", "cream", 8],
    ["burgundy", "pink", 7],
    ["burgundy", "charcoal", 7],
    ["pink", "white", 8],
    ["pink", "gray", 7],
    ["pink", "navy blue", 8],
    ["pink", "light blue", 8],
    ["pink", "burgundy", 7],
    ["pink", "beige", 7],
    ["pink", "cream", 7],
    ["pink", "teal", 7],
    ["pink", "charcoal", 7],
    ["green", "black", 7],
    ["green", "white", 8],
    ["green", "gray", 7],
    ["green", "beige", 7],
    ["green", "khaki", 7],
    ["green", "cream", 7],
    ["green", "brown", 7],
    ["green", "navy blue", 7],
    ["olive green", "black", 7],
    ["olive green", "white", 8],
    ["olive green", "beige", 8],
    ["olive green", "khaki", 8],
    ["olive green", "cream", 7],
    ["olive green", "brown", 7],
    ["olive green", "navy blue", 7],
    ["yellow", "black", 7],
    ["yellow", "white", 8],
    ["yellow", "gray", 7],
    ["yellow", "navy blue", 7],
    ["yellow", "blue", 6],
    ["yellow", "beige", 6],
    ["yellow", "brown", 6],
    ["orange", "black", 7],
    ["orange", "white", 8],
    ["orange", "gray", 7],
    ["orange", "navy blue", 7],
    ["orange", "beige", 6],
    ["orange", "brown", 6],
    ["orange", "cream", 6],
    ["purple", "black", 7],
    ["purple", "white", 8],
    ["purple", "gray", 7],
    ["purple", "beige", 6],
    ["purple", "cream", 6],
    ["purple", "pink", 6],
    ["purple", "charcoal", 6],
    ["beige", "black", 9],
    ["beige", "white", 9],
    ["beige", "navy blue", 9],
    ["beige", "blue", 8],
    ["beige", "light blue", 8],
    ["beige", "brown", 8],
    ["beige", "khaki", 8],
    ["beige", "cream", 8],
    ["beige", "burgundy", 7],
    ["beige", "maroon", 7],
    ["beige", "green", 7],
    ["beige", "olive green", 8],
    ["beige", "charcoal", 7],
    ["beige", "teal", 7],
    ["brown", "white", 8],
    ["brown", "beige", 8],
    ["brown", "khaki", 8],
    ["brown", "cream", 7],
    ["brown", "olive green", 7],
    ["brown", "navy blue", 8],
    ["brown", "light blue", 7],
    ["brown", "green", 7],
    ["khaki", "white", 9],
    ["khaki", "navy blue", 9],
    ["khaki", "blue", 8],
    ["khaki", "light blue", 8],
    ["khaki", "olive green", 8],
    ["khaki", "brown", 8],
    ["khaki", "cream", 8],
    ["khaki", "beige", 8],
    ["khaki", "burgundy", 7],
    ["khaki", "maroon", 7],
    ["cream", "white", 9],
    ["cream", "navy blue", 9],
    ["cream", "blue", 8],
    ["cream", "light blue", 8],
    ["cream", "pink", 7],
    ["cream", "beige", 8],
    ["cream", "brown", 7],
    ["cream", "khaki", 8],
    ["cream", "burgundy", 8],
    ["cream", "teal", 7],
    ["cream", "charcoal", 7],
    ["charcoal", "white", 9],
    ["charcoal", "black", 9],
    ["charcoal", "gray", 9],
    ["charcoal", "navy blue", 8],
    ["charcoal", "light blue", 7],
    ["charcoal", "pink", 7],
    ["charcoal", "red", 7],
    ["charcoal", "beige", 7],
    ["charcoal", "burgundy", 7],
    ["maroon", "black", 8],
    ["maroon", "white", 8],
    ["maroon", "gray", 7],
    ["maroon", "beige", 7],
    ["maroon", "cream", 7],
    ["maroon", "navy blue", 8],
    ["maroon", "khaki", 7],
    ["teal", "black", 8],
    ["teal", "white", 8],
    ["teal", "gray", 7],
    ["teal", "beige", 7],
    ["teal", "cream", 7],
    ["teal", "navy blue", 7],
    ["teal", "pink", 7],
    ["teal", "charcoal", 7],
  ];

  for (const [c1, c2, score] of pairs) {
    if (!s[c1]) s[c1] = {};
    if (!s[c2]) s[c2] = {};
    s[c1][c2] = score;
    s[c2][c1] = score;
  }
  return s;
})();

const positionColorModifier = {
  "top→bottom": 1.0,
  "bottom→top": 1.0,
  "top→shoes": 0.85,
  "dress→shoes": 0.85,
  "outerwear→top": 0.9,
};

function basePairScore(colorA, colorB) {
  return baseColorScore[colorA]?.[colorB] || 0;
}

function scoreColorCompatibility(itemA, itemB) {
  const key = `${itemA.category}→${itemB.category}`;
  const modifier = positionColorModifier[key] || 0.7;

  const colorsA = getItemColors(itemA);
  const colorsB = getItemColors(itemB);

  let totalScore = 0;
  let totalWeight = 0;

  for (const ca of colorsA) {
    for (const cb of colorsB) {
      const weight = (ca.percentage / 100) * (cb.percentage / 100);
      const pairScore = basePairScore(ca.color, cb.color);
      totalScore += pairScore * weight;
      totalWeight += weight;
    }
  }

  const avg = totalWeight > 0 ? totalScore / totalWeight : 0;
  return Math.round(Math.min(avg * modifier, 10));
}

function scoreColorPair(colorA, colorB) {
  return basePairScore(colorA, colorB);
}

function getTopMatchingColors(color, limit = 5) {
  const knownColors = Object.keys(baseColorScore);
  return knownColors
    .filter((c) => c !== color)
    .map((c) => ({ color: c, score: basePairScore(color, c) }))
    .filter((m) => m.score >= 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getGenderCompatibility(a, b) {
  if (a.gender === b.gender) return 10;
  if (a.gender === GENDER.UNISEX || b.gender === GENDER.UNISEX) return 8;
  return 0;
}

function categoriesCompatible(catA, catB) {
  if (
    catA === catB &&
    ![CATEGORY.OUTERWEAR, CATEGORY.ACCESSORY].includes(catA)
  ) {
    return false;
  }
  if (catA === CATEGORY.DRESS && catB === CATEGORY.BOTTOM) return false;
  if (catB === CATEGORY.DRESS && catA === CATEGORY.BOTTOM) return false;
  if (catA === CATEGORY.DRESS && catB === CATEGORY.TOP) return false;
  if (catB === CATEGORY.DRESS && catA === CATEGORY.TOP) return false;
  return true;
}

function validateOutfit(items) {
  const counts = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  const hasDress = (counts[CATEGORY.DRESS] || 0) >= 1;

  if (hasDress) {
    if (counts[CATEGORY.TOP])
      return { valid: false, reason: "Dress + top is invalid" };
    if (counts[CATEGORY.BOTTOM])
      return { valid: false, reason: "Dress + bottom is invalid" };
    if ((counts[CATEGORY.SHOES] || 0) > 1)
      return { valid: false, reason: "More than one pair of shoes" };
    return { valid: true };
  }

  if ((counts[CATEGORY.TOP] || 0) !== 1)
    return { valid: false, reason: "Must have exactly one top" };
  if ((counts[CATEGORY.BOTTOM] || 0) !== 1)
    return { valid: false, reason: "Must have exactly one bottom" };
  if ((counts[CATEGORY.SHOES] || 0) > 1)
    return { valid: false, reason: "More than one pair of shoes" };

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (!categoriesCompatible(items[i].category, items[j].category)) {
        return {
          valid: false,
          reason: `Incompatible categories: ${items[i].category} + ${items[j].category}`,
        };
      }
    }
  }

  return { valid: true };
}

function scoreOutfit(items) {
  let colorSum = 0,
    styleSum = 0,
    seasonSum = 0,
    patternSum = 0,
    genderSum = 0;
  let pairs = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i],
        b = items[j];
      colorSum += scoreColorCompatibility(a, b);
      styleSum += scoreStyle(a.style, b.style);
      seasonSum += scoreSeason(a, b);
      patternSum += scorePattern(a.pattern, b.pattern);
      genderSum += getGenderCompatibility(a, b);
      pairs++;
    }
  }

  if (pairs === 0)
    return {
      color: 0,
      style: 0,
      season: 0,
      pattern: 0,
      gender: 0,
      category: 0,
    };

  const avg = (val) => Math.round((val / pairs) * 10);

  const colorScore = avg(colorSum);
  const styleScore = avg(styleSum);
  const seasonScore = avg(seasonSum);
  const patternScore = avg(patternSum);
  const genderScore = avg(genderSum);

  const categoryScore = validateOutfit(items).valid ? 10 : 0;

  return {
    color: colorScore,
    style: styleScore,
    season: seasonScore,
    pattern: patternScore,
    gender: genderScore,
    category: categoryScore,
  };
}

function computeWeightedScore(breakdown) {
  return Math.round(
    breakdown.color * 10 * WEIGHTS.COLOR +
      breakdown.style * 10 * WEIGHTS.STYLE +
      breakdown.season * 10 * WEIGHTS.SEASON +
      breakdown.pattern * 10 * WEIGHTS.PATTERN +
      breakdown.gender * 10 * WEIGHTS.GENDER +
      breakdown.category * 10 * WEIGHTS.CATEGORY,
  );
}

function evaluateOutfit(items) {
  const breakdown = scoreOutfit(items);
  const score = computeWeightedScore(breakdown);
  return { score, breakdown, items };
}

function generateOutfits(wardrobe) {
  const byCategory = {};
  for (const item of wardrobe) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  const tops = byCategory[CATEGORY.TOP] || [];
  const bottoms = byCategory[CATEGORY.BOTTOM] || [];
  const shoes = byCategory[CATEGORY.SHOES] || [];
  const dresses = byCategory[CATEGORY.DRESS] || [];
  const outerwears = byCategory[CATEGORY.OUTERWEAR] || [];
  const accessories = byCategory[CATEGORY.ACCESSORY] || [];

  const outfits = [];

  for (const dress of dresses) {
    for (const shoe of shoes) {
      if (outerwears.length) {
        for (const ow of outerwears) {
          const base = [dress, shoe, ow];
          if (validateOutfit(base).valid) outfits.push(evaluateOutfit(base));
          for (const acc of accessories) {
            const set = [dress, shoe, ow, acc];
            if (validateOutfit(set).valid) outfits.push(evaluateOutfit(set));
          }
        }
      } else {
        const base = [dress, shoe];
        if (validateOutfit(base).valid) outfits.push(evaluateOutfit(base));
        for (const acc of accessories) {
          const set = [dress, shoe, acc];
          if (validateOutfit(set).valid) outfits.push(evaluateOutfit(set));
        }
      }
    }
  }

  for (const top of tops) {
    for (const bottom of bottoms) {
      const shoeCombos = shoes.length ? shoes : [null];
      for (const shoe of shoeCombos) {
        const baseItems = shoe ? [top, bottom, shoe] : [top, bottom];
        if (outerwears.length) {
          for (const ow of outerwears) {
            const base = [...baseItems, ow];
            if (validateOutfit(base).valid) outfits.push(evaluateOutfit(base));
            for (const acc of accessories) {
              const set = [...base, acc];
              if (validateOutfit(set).valid) outfits.push(evaluateOutfit(set));
            }
          }
        } else {
          if (validateOutfit(baseItems).valid) outfits.push(evaluateOutfit(baseItems));
          for (const acc of accessories) {
            const set = [...baseItems, acc];
            if (validateOutfit(set).valid) outfits.push(evaluateOutfit(set));
          }
        }
      }
    }
  }

  return outfits;
}

function getMatchingBottoms(topItem, wardrobe) {
  const candidates = wardrobe.filter((i) => i.category === CATEGORY.BOTTOM);
  return candidates
    .map((bottom) => evaluateOutfit([topItem, bottom]))
    .sort((a, b) => b.score - a.score);
}

function getMatchingTops(bottomItem, wardrobe) {
  const candidates = wardrobe.filter(
    (i) => i.category === CATEGORY.TOP || i.category === CATEGORY.DRESS,
  );
  return candidates
    .map((top) => evaluateOutfit([top, bottomItem]))
    .sort((a, b) => b.score - a.score);
}

function getMatchingShoes(partialOutfit, wardrobe) {
  const shoes = wardrobe.filter((i) => i.category === CATEGORY.SHOES);
  return shoes
    .map((shoe) => evaluateOutfit([...partialOutfit, shoe]))
    .sort((a, b) => b.score - a.score);
}

function getCompatibleCategories(category) {
  switch (category) {
    case CATEGORY.TOP:
      return [
        CATEGORY.BOTTOM,
        CATEGORY.SHOES,
        CATEGORY.OUTERWEAR,
        CATEGORY.ACCESSORY,
      ];
    case CATEGORY.BOTTOM:
      return [CATEGORY.TOP, CATEGORY.SHOES, CATEGORY.ACCESSORY];
    case CATEGORY.SHOES:
      return [
        CATEGORY.TOP,
        CATEGORY.BOTTOM,
        CATEGORY.DRESS,
        CATEGORY.ACCESSORY,
      ];
    case CATEGORY.DRESS:
      return [CATEGORY.SHOES, CATEGORY.OUTERWEAR, CATEGORY.ACCESSORY];
    case CATEGORY.OUTERWEAR:
      return [
        CATEGORY.TOP,
        CATEGORY.BOTTOM,
        CATEGORY.DRESS,
        CATEGORY.SHOES,
        CATEGORY.ACCESSORY,
      ];
    case CATEGORY.ACCESSORY:
      return [
        CATEGORY.TOP,
        CATEGORY.BOTTOM,
        CATEGORY.DRESS,
        CATEGORY.SHOES,
        CATEGORY.OUTERWEAR,
      ];
    default:
      return [];
  }
}

function scoreItemPair(item1, item2, precomputedGender) {
  const colorRaw = scoreColorCompatibility(item1, item2);
  const styleRaw = scoreStyle(item1.style, item2.style);
  const seasonRaw = scoreSeason(item1, item2);
  const patternRaw = scorePattern(item1.pattern, item2.pattern);
  const genderRaw = precomputedGender !== undefined ? precomputedGender : getGenderCompatibility(item1, item2);

  const catsOk = categoriesCompatible(item1.category, item2.category);
  const categoryRaw = catsOk ? 10 : 0;

  const raw = {
    color: colorRaw,
    style: styleRaw,
    season: seasonRaw,
    pattern: patternRaw,
    gender: genderRaw,
    category: categoryRaw,
  };

  const reason = {
    color: Math.round(colorRaw * 10 * WEIGHTS.COLOR),
    style: Math.round(styleRaw * 10 * WEIGHTS.STYLE),
    season: Math.round(seasonRaw * 10 * WEIGHTS.SEASON),
    pattern: Math.round(patternRaw * 10 * WEIGHTS.PATTERN),
    gender: Math.round(genderRaw * 10 * WEIGHTS.GENDER),
    category: Math.round(categoryRaw * 10 * WEIGHTS.CATEGORY),
  };

  const total =
    reason.color +
    reason.style +
    reason.season +
    reason.pattern +
    reason.gender +
    reason.category;

  return { total, reason, raw };
}

function findMatchesForItem(uploadedItem, wardrobe) {
  const compatibleCats = getCompatibleCategories(uploadedItem.category);
  const catSet = new Set(compatibleCats);
  const results = [];

  for (let i = 0; i < wardrobe.length; i++) {
    const w = wardrobe[i];
    if (!catSet.has(w.category)) continue;
    if (w.id === uploadedItem.id) continue;
    const genderScore = getGenderCompatibility(uploadedItem, w);
    if (genderScore < 2) continue;

    const { total, reason, raw } = scoreItemPair(uploadedItem, w, genderScore);
    results.push({
      item: w,
      score: total,
      reason,
      raw,
      explanation: generateMatchExplanation(uploadedItem, w, reason, raw),
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

function getTopMatches(uploadedItem, wardrobe, limit = 8) {
  return findMatchesForItem(uploadedItem, wardrobe).slice(0, limit);
}

function generateMatchExplanation(uploaded, matched, reason, raw) {
  const parts = [];

  const maxColor = Math.round(10 * 10 * WEIGHTS.COLOR);
  const colorPct = reason.color / maxColor;
  if (colorPct >= 0.9)
    parts.push("the color combination is classic and highly complementary");
  else if (colorPct >= 0.7) parts.push("the colors complement each other well");
  else if (colorPct >= 0.5) parts.push("the colors are reasonably compatible");
  else parts.push("the color pairing is neutral");

  if (raw.style >= 9) {
    parts.push(`both items share a ${uploaded.style} style`);
  } else if (raw.style >= 6) {
    parts.push(`the styles blend well (${uploaded.style} + ${matched.style})`);
  } else {
    parts.push(
      `the styles have some contrast (${uploaded.style} + ${matched.style})`,
    );
  }

  if (raw.season >= 8) parts.push("they are suitable for the same seasons");
  else if (raw.season >= 5) parts.push("they have partial season overlap");
  else parts.push("their season ranges differ");

  if (raw.pattern >= 8) parts.push("the patterns work perfectly together");
  else if (raw.pattern >= 5) parts.push("the patterns are acceptable together");
  else parts.push("the patterns contrast");

  if (raw.gender >= 8) parts.push("they share a compatible gender fit");
  else parts.push("the gender fit is neutral");

  const intro = `${matched.name || matched.type} pairs well with your ${uploaded.name || uploaded.type}`;

  return `${intro} — ${parts.join("; ")}.`;
}

function rankOutfits(outfits, limit = 10) {
  return [...outfits].sort((a, b) => b.score - a.score).slice(0, limit);
}

function getRecommendations(wardrobe, limit = 10) {
  const outfits = generateOutfits(wardrobe);
  return rankOutfits(outfits, limit);
}

function getWeatherBasedItemScore(item, weatherData) {
  const { temperature, condition } = weatherData;
  const relevantSeasons = weatherToSeasons(temperature);

  const itemSeasons = item.season || [];
  if (!itemSeasons.length) return 5;

  const overlap = itemSeasons.filter((s) => relevantSeasons.includes(s)).length;
  let score = overlap >= 2 ? 10 : overlap === 1 ? 8 : 3;

  if (["rain", "drizzle", "rain_showers", "thunderstorm", "snow"].includes(condition)) {
    if (item.category === "outerwear") score = Math.min(score + 3, 10);
    if (item.category === "footwear" && condition === "snow") score = Math.min(score + 2, 10);
  }

  if (condition === "thunderstorm" || condition === "snow") {
    if (item.category === "accessory" || item.category === "dress") score = Math.max(score - 2, 0);
  }

  return score;
}

function buildCombinationKey(topId, bottomId) {
  return `${String(topId)}_${String(bottomId)}`;
}

async function getUsageMap(userId) {
  const usageRecords = await OutfitUsage.find({ user_id: userId }).lean();
  const map = new Map();
  for (const record of usageRecords) {
    const key = buildCombinationKey(record.top_id, record.bottom_id);
    map.set(key, record);
  }
  return map;
}

async function getItemUsageCounts(userId) {
  const usageRecords = await OutfitUsage.find({ user_id: userId }).lean();
  const topCounts = new Map();
  const bottomCounts = new Map();

  for (const record of usageRecords) {
    const topKey = String(record.top_id);
    const bottomKey = String(record.bottom_id);
    topCounts.set(topKey, (topCounts.get(topKey) || 0) + record.usage_count);
    bottomCounts.set(bottomKey, (bottomCounts.get(bottomKey) || 0) + record.usage_count);
  }

  return { topCounts, bottomCounts };
}

async function getRotatedRecommendations(wardrobe, weatherData, userId, limit = 10) {
  if (!wardrobe || wardrobe.length === 0) return [];

  const tops = wardrobe.filter((i) => i.category === CATEGORY.TOP);
  const bottoms = wardrobe.filter((i) => i.category === CATEGORY.BOTTOM);

  if (tops.length === 0 || bottoms.length === 0) return [];

  const usageMap = await getUsageMap(userId);
  const { topCounts, bottomCounts } = await getItemUsageCounts(userId);

  const candidateOutfits = [];

  for (const top of tops) {
    const topWeatherScore = weatherData ? getWeatherBasedItemScore(top, weatherData) : 5;

    if (weatherData && topWeatherScore < 3) continue;

    for (const bottom of bottoms) {
      const bottomWeatherScore = weatherData ? getWeatherBasedItemScore(bottom, weatherData) : 5;

      if (weatherData && bottomWeatherScore < 3) continue;

      if (!categoriesCompatible(top.category, bottom.category)) continue;

      const comboKey = buildCombinationKey(top._id, bottom._id);
      const usageRecord = usageMap.get(comboKey);

      const breakdown = scoreOutfit([top, bottom]);
      const compatibilityScore = computeWeightedScore(breakdown);
      const avgWeatherScore = Math.round((topWeatherScore + bottomWeatherScore) / 2);

      let rotationScore;
      let rotationGroup;

      if (!usageRecord) {
        rotationScore = 1000;
        rotationGroup = 0;
      } else {
        const daysSinceLastUse = (Date.now() - new Date(usageRecord.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
        rotationScore = Math.max(0, 100 - daysSinceLastUse);
        rotationGroup = 1;
      }

      const topItemUsage = topCounts.get(String(top._id)) || 0;
      const bottomItemUsage = bottomCounts.get(String(bottom._id)) || 0;
      const itemDiversityBonus = Math.max(0, 50 - (topItemUsage * 5 + bottomItemUsage * 5));

      const totalScore = compatibilityScore + rotationScore + itemDiversityBonus;

      candidateOutfits.push({
        score: compatibilityScore,
        totalScore,
        rotationScore,
        itemDiversityBonus,
        breakdown,
        items: [
          { ...top.toObject(), weatherScore: topWeatherScore },
          { ...bottom.toObject(), weatherScore: bottomWeatherScore },
        ],
        weatherScore: avgWeatherScore,
        _comboKey: comboKey,
        _usageRecord: usageRecord,
        _rotationGroup: rotationGroup,
        _topWeatherScore: topWeatherScore,
        _bottomWeatherScore: bottomWeatherScore,
      });
    }
  }

  candidateOutfits.sort((a, b) => {
    if (a._rotationGroup !== b._rotationGroup) {
      return a._rotationGroup - b._rotationGroup;
    }
    if (a._rotationGroup === 1 && b._rotationGroup === 1) {
      const aTime = a._usageRecord ? new Date(a._usageRecord.last_used_at).getTime() : 0;
      const bTime = b._usageRecord ? new Date(b._usageRecord.last_used_at).getTime() : 0;
      return aTime - bTime;
    }
    return b.totalScore - a.totalScore;
  });

  const result = candidateOutfits.slice(0, limit);

  return result.map((o) => ({
    score: o.score,
    breakdown: o.breakdown,
    items: o.items,
    weather: {
      avgWeatherScore: o.weatherScore,
    },
  }));
}

module.exports = {
  CATEGORY,
  STYLE,
  PATTERN,
  SEASON,
  GENDER,
  WEIGHTS,
  scoreStyle,
  scorePattern,
  scoreSeason,
  scoreColorCompatibility,
  scoreColorPair,
  getTopMatchingColors,
  getGenderCompatibility,
  categoriesCompatible,
  validateOutfit,
  scoreOutfit,
  computeWeightedScore,
  evaluateOutfit,
  generateOutfits,
  getMatchingBottoms,
  getMatchingTops,
  getMatchingShoes,
  getCompatibleCategories,
  scoreItemPair,
  findMatchesForItem,
  getTopMatches,
  generateMatchExplanation,
  rankOutfits,
  getRecommendations,
  getRotatedRecommendations,
  getWeatherBasedItemScore,
};
