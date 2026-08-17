// GBP star rating / review count / most-recent-review-date via the Google
// Places API. Gated on GOOGLE_PLACES_API_KEY — the fields this can populate
// stop at what Places exposes: it does NOT expose "claimed/verified" status
// or whether the owner replies to reviews (Google doesn't expose that for
// businesses you don't manage), so those two stay manual regardless.
export interface PlacesScanResult {
  configured: boolean;
  found: boolean;
  gbp_rating: number | null;
  gbp_review_count: number | null;
  gbp_last_review_date: string | null; // ISO date
  error?: string;
}

const NOT_CONFIGURED: PlacesScanResult = {
  configured: false,
  found: false,
  gbp_rating: null,
  gbp_review_count: null,
  gbp_last_review_date: null,
};

interface FindPlaceResponse {
  candidates?: { place_id: string }[];
  status: string;
}

interface PlaceDetailsResponse {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: { time: number }[];
  };
  status: string;
}

export async function scanGoogleBusinessProfile(
  query: string
): Promise<PlacesScanResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NOT_CONFIGURED;
  if (!query.trim()) return { ...NOT_CONFIGURED, configured: true };

  try {
    const findUrl = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
    findUrl.searchParams.set("input", query);
    findUrl.searchParams.set("inputtype", "textquery");
    findUrl.searchParams.set("fields", "place_id");
    findUrl.searchParams.set("key", apiKey);

    const findRes = await fetch(findUrl, { signal: AbortSignal.timeout(8000) });
    const findData = (await findRes.json()) as FindPlaceResponse;

    const placeId = findData.candidates?.[0]?.place_id;
    if (!placeId) {
      return { ...NOT_CONFIGURED, configured: true, error: "No matching Google Business Profile found" };
    }

    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set("fields", "rating,user_ratings_total,reviews");
    detailsUrl.searchParams.set("key", apiKey);

    const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(8000) });
    const detailsData = (await detailsRes.json()) as PlaceDetailsResponse;

    const reviews = detailsData.result?.reviews ?? [];
    const mostRecent = reviews.reduce<number | null>(
      (latest, r) => (latest === null || r.time > latest ? r.time : latest),
      null
    );

    return {
      configured: true,
      found: true,
      gbp_rating: detailsData.result?.rating ?? null,
      gbp_review_count: detailsData.result?.user_ratings_total ?? null,
      gbp_last_review_date: mostRecent ? new Date(mostRecent * 1000).toISOString().slice(0, 10) : null,
    };
  } catch (err) {
    return {
      ...NOT_CONFIGURED,
      configured: true,
      error: err instanceof Error ? err.message : "Google Places lookup failed",
    };
  }
}
