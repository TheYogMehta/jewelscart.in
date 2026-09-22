import { Country, State, City } from "country-state-city";

export interface PostalLookupResult {
  success: boolean;
  city?: string;
  state?: string;
  country?: string;
  district?: string;
  areaNames?: string[];
  error?: string;
}

export interface LocationOption {
  name: string;
  isoCode: string;
}

export function getAllCountries(): LocationOption[] {
  return Country.getAllCountries().map((c) => ({
    name: c.name,
    isoCode: c.isoCode,
  }));
}

export function getIndianStates(): LocationOption[] {
  return State.getStatesOfCountry("IN").map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
  }));
}

export function getCitiesForIndianState(stateNameOrCode: string): string[] {
  if (!stateNameOrCode || !stateNameOrCode.trim()) return [];
  const states = State.getStatesOfCountry("IN");
  let stateCode = stateNameOrCode.trim();
  if (stateCode.length > 2) {
    const match = states.find(
      (s) => s.name.toLowerCase() === stateNameOrCode.trim().toLowerCase(),
    );
    if (match) stateCode = match.isoCode;
  }
  return City.getCitiesOfState("IN", stateCode).map((c) => c.name);
}

export function searchIndianCities(
  query: string,
  _stateName?: string,
): Array<{ name: string; stateName: string }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const states = State.getStatesOfCountry("IN");
  const stateCodeMap = new Map(states.map((s) => [s.isoCode, s.name]));
  const allCities = City.getCitiesOfCountry("IN") || [];

  const results: Array<{ name: string; stateName: string }> = [];
  const seen = new Set<string>();

  for (const c of allCities) {
    const cLower = c.name.toLowerCase();
    if (cLower.startsWith(q)) {
      const stateOfCity = stateCodeMap.get(c.stateCode) || "";
      const key = `${c.name}__${stateOfCity}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          name: c.name,
          stateName: stateOfCity,
        });
      }
      if (results.length >= 25) break;
    }
  }

  if (results.length < 25) {
    for (const c of allCities) {
      const cLower = c.name.toLowerCase();
      if (!cLower.startsWith(q) && cLower.includes(q)) {
        const stateOfCity = stateCodeMap.get(c.stateCode) || "";
        const key = `${c.name}__${stateOfCity}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            name: c.name,
            stateName: stateOfCity,
          });
        }
        if (results.length >= 25) break;
      }
    }
  }

  return results;
}

export function findStateForCity(cityName: string): string | null {
  if (!cityName || !cityName.trim()) return null;
  const q = cityName.trim().toLowerCase();
  const cities = City.getCitiesOfCountry("IN") || [];
  const matched = cities.find((c) => c.name.toLowerCase() === q);
  if (!matched) return null;

  const states = State.getStatesOfCountry("IN");
  const s = states.find((x) => x.isoCode === matched.stateCode);
  return s ? s.name : null;
}

export async function lookupPostalCode(
  postalCode: string,
): Promise<PostalLookupResult> {
  const cleanCode = postalCode.trim().replace(/\D/g, "");
  if (!cleanCode || cleanCode.length !== 6) {
    return {
      success: false,
      error: "Please enter a valid 6-digit Indian PIN code",
    };
  }

  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${cleanCode}`,
    );
    if (!res.ok) throw new Error("Postal lookup service unavailable");
    const data = await res.json();
    const first = data?.[0];

    if (first?.Status === "Success" && first?.PostOffice?.length > 0) {
      const po = first.PostOffice[0];
      const areaNames = Array.from(
        new Set(
          first.PostOffice.map((p: { Name: string }) => p.Name).filter(Boolean),
        ),
      ) as string[];

      let detectedState = po.State || "";
      const states = State.getStatesOfCountry("IN");
      const matchedState = states.find(
        (s) => s.name.toLowerCase() === detectedState.trim().toLowerCase(),
      );
      if (matchedState) {
        detectedState = matchedState.name;
      }

      return {
        success: true,
        city: po.District || po.Name || "",
        state: detectedState,
        country: "India",
        district: po.District || "",
        areaNames,
      };
    }
  } catch (err) {
    console.warn("India Post lookup failed:", err);
  }

  return { success: false, error: "Invalid PIN code or location not found" };
}

function normalizeStateString(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

export interface PostalValidationResult {
  valid: boolean;
  error?: string;
  detectedState?: string;
}

export async function validatePostalCodeMatch(
  postalCode: string,
  stateName: string,
  country: string = "India",
): Promise<PostalValidationResult> {
  const isIndia =
    !country ||
    country.trim().toLowerCase() === "india" ||
    country.trim().toLowerCase() === "in";
  if (!isIndia) return { valid: true };

  const clean = (postalCode || "").trim().replace(/\D/g, "");
  if (clean.length !== 6) {
    return {
      valid: false,
      error: "PIN code must be a 6-digit number",
    };
  }

  if (!stateName || !stateName.trim()) {
    return {
      valid: false,
      error: "Please select a state for this address",
    };
  }

  const userStateNorm = normalizeStateString(stateName);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const first = data?.[0];
      if (first?.Status === "Error") {
        return {
          valid: false,
          error: `PIN code ${clean} is invalid or does not exist in postal records`,
        };
      }
      if (first?.Status === "Success" && first?.PostOffice?.length > 0) {
        const poState = first.PostOffice[0].State || "";
        if (poState && normalizeStateString(poState) !== userStateNorm) {
          return {
            valid: false,
            error: `PIN code ${clean} belongs to ${poState}, not ${stateName}.`,
            detectedState: poState,
          };
        }
        return { valid: true, detectedState: poState };
      }
    }
  } catch (err) {
    console.warn("India Post verification request warning:", err);
  }

  return { valid: true };
}
