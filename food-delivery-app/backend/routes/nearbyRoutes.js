const express = require("express");
const axios = require("axios");
const router = express.Router();

/**
 * GET /api/nearby?city=Jaipur
 *
 * Uses OpenStreetMap's free, keyless APIs:
 *  1. Nominatim - converts the city name into latitude/longitude
 *  2. Overpass API - finds real restaurants near that location
 *
 * No API key, no billing account, no signup required.
 * This is VIEW-ONLY data (name, address, map link) — no menus/prices,
 * so these results are for browsing, not ordering. Ordering happens
 * through your own seeded/owner-added restaurants.
 *
 * Reliability strategy for dense/large cities (Delhi, Mumbai, etc.):
 * Overpass servers can time out when a large radius covers a huge number
 * of restaurants. So we try a shrinking sequence of radii (3km -> 1.5km ->
 * 800m) across each mirror server, stopping at the first successful
 * response. This keeps big-city queries fast while still casting a wide
 * enough net for smaller towns.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const RADII_METERS = [3000, 1500, 800];

// Maps an OSM cuisine tag to good English search keywords for a food photo
// service. Falls back to a generic "restaurant food" search when the
// cuisine is missing or unrecognized.
const CUISINE_KEYWORDS = {
  pizza: "pizza",
  indian: "indian_food",
  chinese: "chinese_food",
  burger: "burger",
  cafe: "cafe,coffee",
  coffee_shop: "cafe,coffee",
  sweets: "dessert,sweets",
  thai: "thai_food",
  asian: "asian_food",
  italian: "italian_food",
  japanese: "sushi",
  chicken: "grilled_chicken",
  bakery: "bakery",
  seafood: "seafood",
  breakfast: "breakfast",
  regional: "indian_food",
};

// simple deterministic hash so the same restaurant always gets the same photo
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Uses LoremFlickr (free, keyword-based real photos, no API key) to get a
// food photo relevant to the restaurant's cuisine. The "lock" parameter
// pins a specific photo to a specific number, so the same restaurant id
// always shows the same photo instead of a different random one each load.
function pickPhoto(id, cuisine) {
  const cuisineKey = cuisine
    ? Object.keys(CUISINE_KEYWORDS).find((key) => cuisine.toLowerCase().includes(key))
    : null;
  const keyword = CUISINE_KEYWORDS[cuisineKey] || "restaurant_food";
  const lock = hashString(id) % 100; // 100 photo variations per keyword
  return `https://loremflickr.com/500/300/${keyword}?lock=${lock}`;
}

const axiosClient = axios.create({
  timeout: 20000, // per-attempt timeout; we retry with smaller radius/other mirrors on failure
  headers: {
    "User-Agent": "FoodExpress-Capstone-Project/1.0 (student project demo)",
  },
});

async function geocodeCity(city) {
  console.log(`[nearby] Geocoding "${city}" via Nominatim...`);
  const start = Date.now();
  const { data } = await axiosClient.get(NOMINATIM_URL, {
    params: { q: city, format: "json", limit: 1 },
  });
  console.log(`[nearby] Geocoding done in ${Date.now() - start}ms`);
  if (!data.length) return null;
  return { lat: data[0].lat, lon: data[0].lon, displayName: data[0].display_name };
}

function buildQuery(radius, lat, lon) {
  return `
    [out:json][timeout:20];
    (
      node["amenity"="restaurant"](around:${radius},${lat},${lon});
      way["amenity"="restaurant"](around:${radius},${lat},${lon});
    );
    out center 30;
  `;
}

async function queryOverpass(lat, lon) {
  let lastError;

  for (const radius of RADII_METERS) {
    for (const mirror of OVERPASS_MIRRORS) {
      console.log(`[nearby] Trying radius=${radius}m on ${mirror}...`);
      const start = Date.now();
      try {
        const { data } = await axiosClient.post(mirror, buildQuery(radius, lat, lon), {
          headers: { "Content-Type": "text/plain" },
        });
        console.log(`[nearby] Success (radius=${radius}m, ${mirror}) in ${Date.now() - start}ms`);
        return { data, radiusUsed: radius };
      } catch (err) {
        console.log(
          `[nearby] FAILED (radius=${radius}m, ${mirror}) after ${Date.now() - start}ms — ${err.code || err.message}`
        );
        lastError = err;
      }
    }
  }
  throw lastError || new Error("All Overpass attempts failed");
}

router.get("/", async (req, res) => {
  try {
    const { city } = req.query;
    if (!city || !city.trim()) {
      return res.status(400).json({ message: "city query parameter is required" });
    }

    const location = await geocodeCity(city.trim());
    if (!location) {
      return res.status(404).json({ message: `Could not find location for "${city}"` });
    }

    const { data: overpassData, radiusUsed } = await queryOverpass(location.lat, location.lon);

    const results = (overpassData.elements || [])
      .filter((el) => el.tags?.name)
      .slice(0, 30)
      .map((el) => {
        const elLat = el.lat || el.center?.lat;
        const elLon = el.lon || el.center?.lon;
        const addressParts = [
          el.tags["addr:housenumber"],
          el.tags["addr:street"],
          el.tags["addr:suburb"],
          el.tags["addr:city"],
        ].filter(Boolean);

        return {
          id: `${el.type}/${el.id}`,
          name: el.tags.name,
          cuisine: el.tags.cuisine ? el.tags.cuisine.replace(/_/g, " ") : null,
          address: addressParts.length ? addressParts.join(", ") : "Address not available",
          lat: elLat,
          lon: elLon,
          // OSM doesn't provide photos, so we assign a food-themed stock photo
          // matched to the restaurant's cuisine tag (falls back to a general
          // food/restaurant photo pool). Same restaurant always gets the same
          // photo since it's picked deterministically from its id.
          photoUrl: pickPhoto(`${el.type}${el.id}`, el.tags.cuisine),
          mapsUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${elLat},${elLon}`,
        };
      });

    res.json({
      city,
      resolvedLocation: location.displayName,
      searchRadiusMeters: radiusUsed,
      count: results.length,
      results,
    });
  } catch (err) {
    const detail = err.response
      ? `HTTP ${err.response.status} from upstream API`
      : err.code || err.message;
    console.error("Nearby restaurants error:", detail);
    res.status(500).json({
      message: `Couldn't fetch nearby restaurants right now (${detail}). Please try again — public map servers occasionally get overloaded for busy cities.`,
    });
  }
});

module.exports = router;
