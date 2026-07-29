import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const DEFAULT_BASE_URL = 'https://api.shuaiapi.com/v1';
const DEFAULT_OUTPUT = 'public/images/og/default.png';
const DEFAULT_PROMPT = [
  'Use case: stylized-concept',
  'Asset type: technical blog cover illustration',
  'Primary request: an editorial collage about building and learning with AI tools',
  'Scene/backdrop: an off-white paper workspace seen from directly above, with a charcoal notebook, a small black mechanical keyboard, a graphite pencil, translucent tracing-paper cards, and precise orange-red annotation marks connected by thin lines',
  'Style/medium: tactile editorial cut-paper collage with subtle screen-print grain, restrained geometric composition, contemporary technology magazine art direction',
  'Composition/framing: landscape 3:2, generous quiet negative space around the edges, objects concentrated slightly right of center',
  'Lighting/mood: soft late-afternoon window light with natural paper shadows',
  'Color palette: warm off-white, charcoal, muted brick red, pale sky blue, small ochre accents; deliberately avoid pine green, fog gray monochrome, cyan, purple gradients, and 3D isometric cubes',
  'Constraints: no people, no readable text, no logos, no watermark, no UI screenshot',
].join('\n');

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage() {
  console.log(`Usage: pnpm image:generate [options]

Options:
  --prompt <text>    Image prompt (uses the blog-cover prompt by default)
  --out <path>       Output image path (default: ${DEFAULT_OUTPUT})
  --size <WxH>       Image size (default: 1536x1024)
  --quality <level>  low, medium, high, or auto (default: medium)
  --force            Replace an existing output file
  --dry-run          Print the API request without calling the service
  --help             Show this message

Set SHUAIAPI_API_KEY before running. SHUAIAPI_BASE_URL defaults to ${DEFAULT_BASE_URL}.`);
}

if (hasFlag('--help')) {
  usage();
  process.exit(0);
}

const apiKey = process.env.SHUAIAPI_API_KEY;
const baseUrl = (process.env.SHUAIAPI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
const outputPath = resolve(option('--out', DEFAULT_OUTPUT));
const prompt = option('--prompt', DEFAULT_PROMPT);
const size = option('--size', '1536x1024');
const quality = option('--quality', 'medium');

if (hasFlag('--dry-run')) {
  console.log(JSON.stringify({
    endpoint: `${baseUrl}/images/generations`,
    body: { model: 'gpt-image-2', prompt, size, quality },
    outputPath,
  }, null, 2));
  process.exit(0);
}

if (!apiKey) {
  throw new Error('Missing SHUAIAPI_API_KEY. Set it in the shell before running this script.');
}

try {
  await stat(outputPath);
  if (!hasFlag('--force')) {
    throw new Error(`Output already exists: ${outputPath}. Choose --out <path> or pass --force.`);
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const generationResponse = await fetch(`${baseUrl}/images/generations`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-image-2',
    prompt,
    size,
    quality,
  }),
});

if (!generationResponse.ok) {
  throw new Error(`Image generation failed (${generationResponse.status}): ${await generationResponse.text()}`);
}

const generation = await generationResponse.json();
const imageData = Array.isArray(generation?.data) ? generation.data[0] : undefined;
const imageUrl = imageData?.url ?? imageData?.image_url ?? imageData?.imageUrl;
let bytes;
let contentType;
let deliveryMode;

if (typeof imageUrl === 'string' && /^https?:\/\//.test(imageUrl)) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Image download failed (${imageResponse.status}).`);
  }

  contentType = imageResponse.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Unexpected image download content type: ${contentType || 'unknown'}.`);
  }
  bytes = Buffer.from(await imageResponse.arrayBuffer());
  deliveryMode = 'downloaded returned image URL';
} else if (typeof imageData?.b64_json === 'string') {
  // Some OpenAI-compatible gateways still return inline data despite advertising URL output.
  bytes = Buffer.from(imageData.b64_json, 'base64');
  contentType = 'image/png';
  deliveryMode = 'decoded inline b64_json fallback';
} else {
  const responseShape = {
    topLevelKeys: Object.keys(generation ?? {}),
    dataIsArray: Array.isArray(generation?.data),
    imageKeys: imageData && typeof imageData === 'object' ? Object.keys(imageData) : [],
  };
  throw new Error(`No usable image URL or inline image data returned: ${JSON.stringify(responseShape)}.`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, bytes);
console.log(`Saved ${contentType} to ${outputPath} (${deliveryMode})`);
