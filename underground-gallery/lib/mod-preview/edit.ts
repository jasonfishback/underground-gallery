// lib/mod-preview/edit.ts
//
// Provider-agnostic, identity-preserving image editing for the mod preview
// tool. Two backends:
//   - fal.ai FLUX Kontext  — strong instruction editor (default for changes
//     that don't need a reference image, e.g. ride height, carbon).
//   - Google Nano Banana   — Gemini 2.5 Flash Image; best at edits conditioned
//     on a reference image (default once we add a real wheel-image catalog).
//
// The router prefers whichever fits the task and is actually configured, so
// you can run on one key or both. Every prompt is wrapped with guardrails so
// the model changes ONLY the requested mod and leaves the car itself alone.

export type EditProvider = 'fal' | 'google';

export type EditResult = {
  bytes: Buffer;
  contentType: string;
  provider: EditProvider;
};

const FAL_MODEL = process.env.FAL_KONTEXT_MODEL || 'fal-ai/flux-pro/kontext';
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

function falKey(): string | null {
  return process.env.FAL_KEY || process.env.FAL_API_KEY || null;
}
function googleKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
}

export function availableProviders(): EditProvider[] {
  const out: EditProvider[] = [];
  if (falKey()) out.push('fal');
  if (googleKey()) out.push('google');
  return out;
}

/** Wrap the raw change instruction with the "don't touch the car" guardrails. */
function buildPrompt(change: string): string {
  return (
    `Edit this photograph of a car: ${change}. ` +
    `CRITICAL CONSTRAINTS: do not change the car's make, model, or body shape; ` +
    `do not change the paint color or livery; do not change the background, the ` +
    `camera angle, the framing, or the lighting. Keep everything except the ` +
    `requested modification pixel-for-pixel identical to the original. The result ` +
    `must look like the exact same photo with only that one modification applied. ` +
    `Photorealistic, high detail.`
  );
}

async function fetchImageBytes(
  url: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch base image (${res.status}).`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, contentType };
}

// ── fal.ai FLUX Kontext ─────────────────────────────────────────────────────
async function editWithFal(baseImageUrl: string, prompt: string): Promise<EditResult> {
  const key = falKey();
  if (!key) throw new Error('FAL_KEY not configured.');

  const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: baseImageUrl,
      prompt,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: 'jpeg',
      safety_tolerance: '2',
    }),
  });
  if (!res.ok) {
    throw new Error(`fal edit failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { images?: { url: string }[] };
  const outUrl = data.images?.[0]?.url;
  if (!outUrl) throw new Error('fal returned no image.');
  const { bytes, contentType } = await fetchImageBytes(outUrl);
  return { bytes, contentType, provider: 'fal' };
}

// ── Google Nano Banana (Gemini 2.5 Flash Image) ─────────────────────────────
async function editWithGoogle(
  baseImageUrl: string,
  prompt: string,
): Promise<EditResult> {
  const key = googleKey();
  if (!key) throw new Error('GOOGLE_API_KEY not configured.');

  const { bytes: inBytes, contentType: inType } = await fetchImageBytes(baseImageUrl);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: inType, data: inBytes.toString('base64') } },
            ],
          },
        ],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini edit failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inline_data?: { data: string; mime_type?: string } }[] } }[];
  };
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inline_data);
  const b64 = part?.inline_data?.data;
  if (!b64) throw new Error('Gemini returned no image.');
  return {
    bytes: Buffer.from(b64, 'base64'),
    contentType: part?.inline_data?.mime_type || 'image/png',
    provider: 'google',
  };
}

/**
 * Run an identity-preserving mod edit. Picks a provider by task fit and which
 * keys are configured. `prefersReference` reserved for the wheel-catalog phase.
 */
export async function runModEdit(opts: {
  baseImageUrl: string;
  change: string;
  prefersReference?: boolean;
}): Promise<EditResult> {
  const prompt = buildPrompt(opts.change);
  const have = availableProviders();
  if (have.length === 0) {
    throw new Error(
      'No image-edit provider configured. Add a FAL_KEY (fal.ai) or GOOGLE_API_KEY (Gemini) env var.',
    );
  }

  // Reference-heavy tasks favour Google; instruction tasks favour fal Kontext.
  const order: EditProvider[] = opts.prefersReference
    ? ['google', 'fal']
    : ['fal', 'google'];

  let lastErr: unknown;
  for (const p of order) {
    if (!have.includes(p)) continue;
    try {
      return p === 'fal'
        ? await editWithFal(opts.baseImageUrl, prompt)
        : await editWithGoogle(opts.baseImageUrl, prompt);
    } catch (err) {
      lastErr = err;
      // fall through to the next available provider
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Mod edit failed.');
}
