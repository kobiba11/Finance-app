export type ParsedVoucherData = {
  title: string;
  brand: string;
  value: string;
  currency: string;
  expiresAt: string;
  code: string;
  redeemAt: string;
  redeemApp: string;
  directLink: string;
  notes: string;
  rawText: string;
};

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanValue(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function detectCurrency(text: string) {
  if (/₪|ש["״]?ח|שקל|שקלים|ILS/i.test(text)) return "ILS";
  if (/\$|USD|dollar/i.test(text)) return "USD";
  if (/€|EUR|euro/i.test(text)) return "EUR";
  return "ILS";
}

function tryMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractLink(text: string) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? "";
}

function normalizeVoucherCode(code: string) {
  const digits = code.replace(/[^\d]/g, "");
  if (digits.length === 16) {
    return digits.match(/.{1,4}/g)?.join(" - ") ?? code;
  }
  return code.trim();
}

function extractVoucherCode(text: string) {
  const directMatch =
    text.match(/\b\d{4}\s*-\s*\d{4}\s*-\s*\d{4}\s*-\s*\d{4}\b/) ||
    text.match(/\b\d{16}\b/);

  if (directMatch?.[0]) {
    return normalizeVoucherCode(directMatch[0]);
  }

  return normalizeVoucherCode(
    tryMatch(text, [
      /(?:קוד(?: שובר)?|code|voucher code|gift code)[:\s#-]*([A-Z0-9-]{6,})/i,
      /(?:מספר שובר|voucher no|serial|מספר)[:\s#-]*([A-Z0-9-]{6,})/i,
    ])
  );
}

function normalizeDateToISO(input: string) {
  const normalized = input.replace(/\./g, "/").replace(/-/g, "/").trim();

  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(normalized)) {
    const [y, m, d] = normalized.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parts = normalized.split("/");
  if (parts.length !== 3) return "";

  let [d, m, y] = parts;
  if (y.length === 2) y = `20${y}`;

  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function extractDate(text: string) {
  const direct = tryMatch(text, [
    /(?:בתוקף עד|תוקף עד|valid until|expires on|expiry|expiration date)[:\s-]*([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:20)?\d{2})/i,
    /(?:תוקף)[:\s-]*([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:20)?\d{2})/i,
  ]);

  if (direct) return normalizeDateToISO(direct);

  const buymeDate = text.match(/\b([0-3]?\d[./-][0-1]?\d[./-](?:20)?\d{2})\b/);
  if (buymeDate?.[1]) return normalizeDateToISO(buymeDate[1]);

  return "";
}

function extractAmount(text: string) {
  const buymePatterns = [
    /(?:יתרה\s*למימוש|למימוש)\s*(?:ב[-–]?\s*)?(?:₪\s*)?(\d+(?:[.,]\d{1,2})?)/i,
    /(?:₪\s*)(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*₪/,
  ];

  for (const pattern of buymePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return cleanValue(match[1].replace(",", "."));
    }
  }

  const genericPatterns = [
    /(?:שווי|ערך|value|amount|balance|יתרה)[:\s-]*([₪$€]?\s?\d+(?:[.,]\d{1,2})?)/i,
    /([₪$€]\s?\d+(?:[.,]\d{1,2})?)/,
    /(\d+(?:[.,]\d{1,2})?)\s?(?:₪|ש["״]?ח|ILS|USD|EUR|\$|€)/i,
  ];

  for (const pattern of genericPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return cleanValue(match[1].replace(",", "."));
    }
  }

  return "";
}

function extractBrand(text: string) {
  if (/buyme/i.test(text)) return "BUYME";

  const knownBrands = [
    "MAX",
    "תו הזהב",
    "FOX",
    "H&M",
    "ZARA",
    "AMAZON",
    "WOLT",
    "SHEIN",
    "GROO",
    "SHUFERSAL",
    "שופרסל",
    "רמי לוי",
    "סופר-פארם",
    "סופר פארם",
    "FOX HOME",
  ];

  for (const brand of knownBrands) {
    const regex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (regex.test(text)) return brand;
  }

  const line = text
    .split("\n")
    .map((x) => x.trim())
    .find((x) =>
      /(?:מותג|חנות|brand|store|merchant|למימוש ב|redeem at)/i.test(x)
    );

  if (!line) return "";
  return line
    .replace(/^(?:מותג|חנות|brand|store|merchant|למימוש ב|redeem at)[:\s-]*/i, "")
    .trim();
}

function extractRedeemAt(text: string, brand: string) {
  if (/buyme/i.test(text) || brand === "BUYME") {
    return "BUYME ALL";
  }

  return tryMatch(text, [
    /(?:למימוש ב|ניתן לממש ב|redeem at|usable at)[:\s-]*(.+)/i,
  ])
    .split("\n")[0]
    .trim();
}

function extractRedeemApp(text: string, link: string, brand: string) {
  if (/buyme/i.test(text) || /buyme/i.test(link) || brand === "BUYME") return "BUYME";
  if (/max/i.test(text) || /max/i.test(link)) return "MAX";
  if (/wolt/i.test(text) || /wolt/i.test(link)) return "Wolt";
  if (/amazon/i.test(text) || /amazon/i.test(link)) return "Amazon";
  return "";
}

function buildTitle(brand: string, text: string) {
  if (/buyme all/i.test(text)) return "שובר BUYME ALL";
  if (brand === "BUYME") return "שובר BUYME";
  if (brand) return `שובר ${brand}`;
  return "שובר חדש";
}

function cleanupRawText(text: string) {
  return text
    .replace(/[|]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseBuymeVoucher(text: string): ParsedVoucherData | null {
  if (!/buyme/i.test(text)) return null;

  const cleanedText = cleanupRawText(text);
  const brand = "BUYME";
  const code = extractVoucherCode(cleanedText);
  const value = extractAmount(cleanedText);
  const expiresAt = extractDate(cleanedText);
  const directLink = extractLink(cleanedText);
  const redeemApp = "BUYME";
  const redeemAt = /buyme all/i.test(cleanedText) ? "BUYME ALL" : "BUYME";
  const title = /buyme all/i.test(cleanedText) ? "שובר BUYME ALL" : "שובר BUYME";

  return {
    title,
    brand,
    value,
    currency: "ILS",
    expiresAt,
    code,
    redeemAt,
    redeemApp,
    directLink,
    notes: "",
    rawText: cleanedText,
  };
}

export function parseVoucherText(input: string): ParsedVoucherData {
  const text = cleanupRawText(normalizeText(input));

  const buymeParsed = parseBuymeVoucher(text);
  if (buymeParsed) {
    return buymeParsed;
  }

  const currency = detectCurrency(text);
  const value = extractAmount(text);
  const brand = extractBrand(text);
  const code = extractVoucherCode(text);
  const expiresAt = extractDate(text);
  const directLink = extractLink(text);
  const redeemAt = extractRedeemAt(text, brand);
  const redeemApp = extractRedeemApp(text, directLink, brand);

  const title = buildTitle(brand, text);

  return {
    title,
    brand,
    value,
    currency,
    expiresAt,
    code,
    redeemAt,
    redeemApp,
    directLink,
    notes: "",
    rawText: text,
  };
}