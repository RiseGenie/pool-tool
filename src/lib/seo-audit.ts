export type SeoImpact = "high" | "medium" | "low";
export type SeoStatus = "pass" | "issue";

export interface SeoFinding {
  id: string;
  title: string;
  status: SeoStatus;
  impact: SeoImpact;
  evidence: string;
  fix: string;
}

export interface SeoAuditResult {
  url: string;
  fetchedAt: string;
  responseTimeMs: number | null;
  score: number;
  findings: SeoFinding[];
  error?: string;
}

const IMPACT_WEIGHT: Record<SeoImpact, number> = { high: 3, medium: 2, low: 1 };

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

export async function runSeoAudit(rawUrl: string): Promise<SeoAuditResult> {
  let url = rawUrl.trim();
  if (!url) {
    return {
      url: rawUrl,
      fetchedAt: new Date().toISOString(),
      responseTimeMs: null,
      score: 0,
      findings: [],
      error: "No URL provided.",
    };
  }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const startedAt = Date.now();
  let html: string;
  let finalUrl = url;

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadCallPrepBot/1.0)" },
    });
    finalUrl = res.url || url;
    if (!res.ok) {
      return {
        url,
        fetchedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        score: 0,
        findings: [
          {
            id: "reachable",
            title: "Page is reachable",
            status: "issue",
            impact: "high",
            evidence: `Request returned HTTP ${res.status}.`,
            fix: "Confirm the URL is correct and the site is live before relying on this audit.",
          },
        ],
        error: `HTTP ${res.status}`,
      };
    }
    html = await res.text();
  } catch (err) {
    return {
      url,
      fetchedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      score: 0,
      findings: [
        {
          id: "reachable",
          title: "Page is reachable",
          status: "issue",
          impact: "high",
          evidence: err instanceof Error ? err.message : "Fetch failed.",
          fix: "Confirm the URL is correct and the site is publicly reachable.",
        },
      ],
      error: "Could not reach the page.",
    };
  }

  const responseTimeMs = Date.now() - startedAt;
  const findings: SeoFinding[] = [];

  findings.push({
    id: "https",
    title: "Served over HTTPS",
    status: finalUrl.startsWith("https://") ? "pass" : "issue",
    impact: "high",
    evidence: finalUrl.startsWith("https://") ? "URL uses HTTPS." : `Final URL is ${finalUrl}.`,
    fix: "Move the site to HTTPS — browsers flag HTTP sites as \"not secure,\" and it's a Google ranking signal.",
  });

  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  if (!title) {
    findings.push({
      id: "title",
      title: "Title tag present",
      status: "issue",
      impact: "high",
      evidence: "No <title> tag found.",
      fix: "Add a unique, descriptive <title> tag — it's the single most important on-page SEO element.",
    });
  } else {
    const len = title.length;
    findings.push({
      id: "title",
      title: "Title tag length",
      status: len >= 10 && len <= 60 ? "pass" : "issue",
      impact: "medium",
      evidence: `Title is ${len} characters: "${title}"`,
      fix: "Keep titles roughly 10-60 characters so they don't get truncated in search results.",
    });
  }

  const description = extractTag(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  if (!description) {
    findings.push({
      id: "meta_description",
      title: "Meta description present",
      status: "issue",
      impact: "medium",
      evidence: "No meta description found.",
      fix: "Add a meta description — Google often uses it for the search-result snippet, and it affects click-through rate.",
    });
  } else {
    const len = description.length;
    findings.push({
      id: "meta_description",
      title: "Meta description length",
      status: len >= 50 && len <= 160 ? "pass" : "issue",
      impact: "low",
      evidence: `Description is ${len} characters.`,
      fix: "Aim for roughly 50-160 characters so the snippet isn't truncated in search results.",
    });
  }

  const h1Matches = html.match(/<h1[\s>]/gi) ?? [];
  findings.push({
    id: "h1",
    title: "Exactly one H1 on the page",
    status: h1Matches.length === 1 ? "pass" : "issue",
    impact: "medium",
    evidence: `Found ${h1Matches.length} <h1> tag(s).`,
    fix:
      h1Matches.length === 0
        ? "Add one clear <h1> describing the page's main topic."
        : "Use a single <h1> per page — multiple H1s dilute the page's topical signal.",
  });

  const hasResponsiveViewport =
    /<meta[^>]+name=["']viewport["'][^>]+content=["'][^"']*width=device-width/i.test(html);
  findings.push({
    id: "mobile_friendly",
    title: "Mobile-responsive viewport",
    status: hasResponsiveViewport ? "pass" : "issue",
    impact: "high",
    evidence: hasResponsiveViewport
      ? "Responsive viewport meta tag found."
      : "No responsive viewport meta tag found.",
    fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> — mobile-friendliness is a core Google ranking factor.",
  });

  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  findings.push({
    id: "canonical",
    title: "Canonical tag present",
    status: hasCanonical ? "pass" : "issue",
    impact: "low",
    evidence: hasCanonical ? "Canonical link tag found." : "No canonical link tag found.",
    fix: "Add a self-referencing canonical tag to avoid duplicate-content ambiguity.",
  });

  const hasOgTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const hasOgDescription = /<meta[^>]+property=["']og:description["']/i.test(html);
  findings.push({
    id: "open_graph",
    title: "Open Graph tags for social sharing",
    status: hasOgTitle && hasOgDescription ? "pass" : "issue",
    impact: "low",
    evidence: `og:title ${hasOgTitle ? "present" : "missing"}, og:description ${hasOgDescription ? "present" : "missing"}.`,
    fix: "Add og:title and og:description so links look right when shared on Facebook/LinkedIn.",
  });

  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  findings.push({
    id: "structured_data",
    title: "Structured data (schema.org)",
    status: hasJsonLd ? "pass" : "issue",
    impact: "low",
    evidence: hasJsonLd ? "Found a JSON-LD script block." : "No JSON-LD structured data found.",
    fix: "Add LocalBusiness schema (JSON-LD) — it's what powers the map-pack-style rich results for local searches like \"pool builder near me.\"",
  });

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imgsWithAlt = imgTags.filter((tag) => /\balt=["'][^"']+["']/i.test(tag));
  const altCoverage = imgTags.length > 0 ? imgsWithAlt.length / imgTags.length : 1;
  findings.push({
    id: "image_alt",
    title: "Image alt text coverage",
    status: imgTags.length === 0 || altCoverage >= 0.8 ? "pass" : "issue",
    impact: "medium",
    evidence:
      imgTags.length === 0
        ? "No <img> tags found."
        : `${imgsWithAlt.length}/${imgTags.length} images have alt text.`,
    fix: "Add descriptive alt text to project photos — it's both an accessibility requirement and an image-search ranking signal.",
  });

  const robotsNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  findings.push({
    id: "indexable",
    title: "Page allows indexing",
    status: robotsNoindex ? "issue" : "pass",
    impact: "high",
    evidence: robotsNoindex
      ? "Found a robots meta tag with \"noindex\"."
      : "No noindex directive found.",
    fix: "Remove the noindex directive — the page currently tells Google not to show it in search results at all.",
  });

  const visibleText = stripTags(html);
  const wordCount = visibleText.split(/\s+/).filter(Boolean).length;
  findings.push({
    id: "content_length",
    title: "Enough content on the page",
    status: wordCount >= 300 ? "pass" : "issue",
    impact: "medium",
    evidence: `~${wordCount} words of visible text.`,
    fix: "Thin pages (under ~300 words) tend to rank poorly — add more substantive copy about services, service area, and process.",
  });

  const totalWeight = findings.reduce((sum, f) => sum + IMPACT_WEIGHT[f.impact], 0);
  const earnedWeight = findings.reduce(
    (sum, f) => sum + (f.status === "pass" ? IMPACT_WEIGHT[f.impact] : 0),
    0
  );
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    url: finalUrl,
    fetchedAt: new Date().toISOString(),
    responseTimeMs,
    score,
    findings,
  };
}
