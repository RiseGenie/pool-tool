import type { Lead, Scorecard } from "@/lib/types";
import type { WeakestArea } from "@/lib/scoring";

// Words the rendered script must never contain (per spec) — kept here as a
// single source of truth and checked by scriptContainsBannedWords() below,
// which the script-panel/tests can assert against.
export const BANNED_WORDS = ["AI", "automation", "GoHighLevel", "chatbot", "software platform"];

export interface Segment {
  text: string;
  highlight?: boolean;
}

export interface ObjectionRow {
  objection: string;
  response: string;
}

export interface ScriptModel {
  opener: Segment[];
  busyLine: string;
  purpose: string;
  discoveryQuestions: string[];
  bridge: string;
  softPitch: Segment[];
  objections: ObjectionRow[];
  close: Segment[];
}

function seg(text: string, highlight = false): Segment {
  return { text, highlight };
}

const OBJECTIONS: ObjectionRow[] = [
  {
    objection: `"We already have a website."`,
    response:
      "Good — this isn't about replacing it, it's about what happens after someone visits it. Most of the builders I talk to have a fine website but no fast follow-up behind it. That's the piece I focus on.",
  },
  {
    objection: `"Not interested / too busy for this."`,
    response:
      "Totally understand — that's actually the exact problem this solves, since it runs without needing your time. Can I just send over a 2-minute look at what I mean, no call required?",
  },
  {
    objection: `"How much does this cost?"`,
    response:
      "Depends on what you need — that's exactly what the 15-minute walkthrough is for, I'll show you what it'd look like for your business first before we talk numbers.",
  },
  {
    objection: `"We don't really need more leads."`,
    response:
      "Makes sense if referrals are strong — this isn't really about generating new leads, it's about not losing the ones already coming in and building up your reviews so referrals keep compounding.",
  },
  {
    objection: `"Send me something in writing."`,
    response:
      "Happy to — quick heads up, most people find it easier to just see it live for 10 minutes since it's more of a \"show than tell\" thing. Does {suggested day/time} work, or should I just email it over?",
  },
];

const DISCOVERY_QUESTIONS = [
  "When someone fills out a quote request on your site or messages you on Facebook, roughly how fast does someone get back to them?",
  "How are you currently getting reviews from happy customers — is that something you're actively asking for, or does it just happen?",
  "During peak season, is following up with every lead something you or your team have time to stay on top of?",
  "Are most of your jobs coming from referrals, or are new leads finding you online too?",
];

// Two concrete callback-time suggestions for the close. V2 hook: these could
// pull from a real calendar; for V1 they're just two distinct concrete slots
// so the close never says "whenever works."
function suggestedTimes(): { first: string; second: string } {
  return { first: "Tuesday at 10am", second: "Thursday at 2pm" };
}

function softPitchForAngle(angle: WeakestArea["angle"] | undefined): Segment[] {
  if (angle === "reviews") {
    return [
      seg("What I do is set up a "),
      seg("system", true),
      seg(
        " that automatically asks happy customers for a review right after the job's done, so your Google page keeps growing instead of going quiet — and it "
      ),
      seg("keeps working after hours", true),
      seg(
        " too, answering and following up with new inquiries within minutes, even nights and weekends. Builders I've worked with typically see "
      ),
      seg("more reviews coming in and faster response times", true),
      seg(" within the first couple months."),
    ];
  }

  if (angle === "followup_speed") {
    return [
      seg("What I do is set up a "),
      seg("system", true),
      seg(
        " that answers and follows up with every inquiry within minutes — even nights and weekends — so nothing sits waiting on you. It also "
      ),
      seg("automatically asks happy customers for a review", true),
      seg(
        " right after the job's done, so your Google page "
      ),
      seg("keeps working after hours", true),
      seg(
        " for you. Builders I've worked with typically see "
      ),
      seg("faster response times and more booked estimates", true),
      seg(" within the first couple months."),
    ];
  }

  // Generic / online_presence fallback
  return [
    seg("What I do is set up a "),
    seg("system", true),
    seg(
      " that answers and follows up with every inquiry within minutes — even nights and weekends — and automatically asks happy customers for a review right after the job's done, so your Google page "
    ),
    seg("keeps working after hours", true),
    seg(" instead of going quiet. Builders I've worked with typically see "),
    seg("more reviews, faster response, and more booked estimates", true),
    seg(" within the first couple months."),
  ];
}

export function buildScript(
  lead: Lead,
  scorecard: Scorecard | null,
  weakest: WeakestArea | null
): ScriptModel {
  const contactName = lead.contact_name?.trim() || "the owner";
  const city = lead.city?.trim() || "your area";
  const hook = scorecard?.hook?.trim() || "{hook — fill in the Hook field}";
  const businessName = lead.business_name || "{business name}";
  const { first, second } = suggestedTimes();

  const opener: Segment[] = [
    seg("Hi, is this "),
    seg(contactName, true),
    seg("? This is [Your Name] — I work with pool construction companies here in "),
    seg(city, true),
    seg(". Quick reason for the call: I was looking at "),
    seg(hook, true),
    seg(" and had a couple of ideas I wanted to run by you. Got 60 seconds?"),
  ];

  const busyLine =
    'If busy: "No problem — when\'s a better time, later today or tomorrow?" Get a specific callback time before hanging up.';

  const purpose =
    "I help pool builders like you turn more of the people who find you online into booked jobs — faster follow-up on quotes, more reviews coming in automatically, that kind of thing. I'm not selling anything on this call, I just had a couple of specific observations about your site/Google page and wanted your take.";

  const bridge =
    "That's really common — most builders I talk to are great at the actual work but the follow-up and review side falls through the cracks because there's just no time. That's exactly the gap I help close.";

  const softPitch = softPitchForAngle(weakest?.angle);

  const objections = OBJECTIONS.map((row) => ({
    ...row,
    response: row.response.replace("{suggested day/time}", first),
  }));

  const close: Segment[] = [
    seg("Sounds like there could be a good fit here. Let's do this — I'll grab 15 minutes on your calendar, show you exactly what this would look like for "),
    seg(businessName, true),
    seg(" using your own Google page and site, no obligation. Does "),
    seg(first, true),
    seg(" work, or is "),
    seg(second, true),
    seg(" better?"),
  ];

  return {
    opener,
    busyLine,
    purpose,
    discoveryQuestions: DISCOVERY_QUESTIONS,
    bridge,
    softPitch,
    objections,
    close,
  };
}

export function scriptContainsBannedWords(model: ScriptModel): string[] {
  const allText = [
    ...model.opener.map((s) => s.text),
    model.busyLine,
    model.purpose,
    ...model.discoveryQuestions,
    model.bridge,
    ...model.softPitch.map((s) => s.text),
    ...model.objections.flatMap((o) => [o.objection, o.response]),
    ...model.close.map((s) => s.text),
  ].join(" ");

  return BANNED_WORDS.filter((word) => allText.toLowerCase().includes(word.toLowerCase()));
}
