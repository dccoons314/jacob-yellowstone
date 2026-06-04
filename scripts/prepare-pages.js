import fs from 'node:fs/promises';

const BUILD_PLACEHOLDER = '__BUILD_VERSION__';
const INDEX_PATH = new URL('../index.html', import.meta.url);

export function applyBuildVersion(html, buildVersion) {
  if (!buildVersion) {
    return html;
  }

  return html.replaceAll(BUILD_PLACEHOLDER, buildVersion);
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  const buildVersion = process.env.GITHUB_SHA;
  if (!buildVersion) {
    throw new Error('GITHUB_SHA is required to prepare Pages output');
  }

  const html = await fs.readFile(INDEX_PATH, 'utf8');
  const output = applyBuildVersion(html, buildVersion);
  await fs.writeFile(INDEX_PATH, output);
}
