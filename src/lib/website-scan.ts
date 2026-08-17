// Free, no-API-key auto-fill: fetches the lead's website HTML directly and
// infers a few scorecard fields from it. Deliberately conservative — these
// are heuristics, not ground truth, and the scorecard fields they populate
// stay fully editable afterward.
import type { Scorecard } from "@/lib/types";

export interface WebsiteScanResult {
  website_exists: boolean;
  website_mobile_friendly: Scorecard["website_mobile_friendly"];
  website_has_contact_form: boolean;
  website_last_updated_signal: string | null;
}

const FAILED_SCAN: WebsiteScanResult = {
  website_exists: false,
  website_mobile_friendly: "red",
  website_has_contact_form: false,
  website_last_updated_signal: null,
};

export async function scanWebsite(rawUrl: string): Promise<WebsiteScanResult> {
  let url = rawUrl.trim();
  if (!url) return FAILED_SCAN;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadCallPrepBot/1.0)" },
    });
    if (!res.ok) return FAILED_SCAN;

    const html = await res.text();

    const hasViewportMeta = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);
    const hasResponsiveViewport =
      /<meta[^>]+name=["']viewport["'][^>]+content=["'][^"']*width=device-width/i.test(html);
    const mobileFriendly: Scorecard["website_mobile_friendly"] = hasResponsiveViewport
      ? "green"
      : hasViewportMeta
        ? "yellow"
        : "red";

    const hasForm = /<form[\s>]/i.test(html);
    const hasTelLink = /href=["']tel:/i.test(html);
    const hasContactForm = hasForm || hasTelLink;

    const copyrightMatch = html.match(/(?:©|&copy;|copyright)\s*(\d{4})/i);
    const lastUpdatedSignal = copyrightMatch ? `© ${copyrightMatch[1]}` : null;

    return {
      website_exists: true,
      website_mobile_friendly: mobileFriendly,
      website_has_contact_form: hasContactForm,
      website_last_updated_signal: lastUpdatedSignal,
    };
  } catch {
    return FAILED_SCAN;
  }
}
