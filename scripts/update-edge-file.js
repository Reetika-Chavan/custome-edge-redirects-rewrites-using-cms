import * as fs from "fs";
import * as path from "path";
import { fetchRules } from "./fetch-rules.js";


export async function updateEdgeFile() {
  const { redirectRules, rewriteRules } = await fetchRules();

  const edgeFile = path.join(process.cwd(), "functions", "[proxy].edge.js");
  const functionsDir = path.dirname(edgeFile);

  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const edgeCode = `// Auto-generated - Do not edit manually
// Generated: ${timestamp} | Redirects: ${redirectRules.length} | Rewrites: ${
    rewriteRules.length
  }

export default async function handler(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const redirects = ${JSON.stringify(redirectRules, null, 2)};
  const rewrites = ${JSON.stringify(rewriteRules, null, 2)};

  // Handle redirects
  const redirect = redirects.find(
    (r) => pathname === r.from || pathname.startsWith(r.from + "/") || matchPattern(pathname, r.from)
  );

  if (redirect) {
    const destination = redirect.to.startsWith("http") ? redirect.to : \`\${url.origin}\${redirect.to}\`;
    const headers = new Headers({ Location: destination, ...redirect.headers });
    return new Response(null, { status: redirect.type || 301, headers });
  }

  // Handle rewrites
  const rewrite = rewrites.find(
    (r) => pathname === r.from || pathname.startsWith(r.from + "/") || matchPattern(pathname, r.from)
  );

  if (rewrite) {
    const destination = rewrite.to.startsWith("http") ? rewrite.to : \`\${url.origin}\${rewrite.to}\`;
    const requestHeaders = new Headers(request.headers);
    Object.entries(rewrite.requestHeaders || {}).forEach(([k, v]) => requestHeaders.set(k, v));

    const response = await fetch(destination, {
      method: request.method,
      headers: requestHeaders,
      body: request.body,
    });

    const responseHeaders = new Headers(response.headers);
    Object.entries(rewrite.responseHeaders || {}).forEach(([k, v]) => responseHeaders.set(k, v));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }

  // Pass through to origin
  const cleanHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!key.toLowerCase().startsWith('rsc') && !key.toLowerCase().startsWith('next-router')) {
      cleanHeaders.set(key, value);
    }
  });

  return fetch(request.url, {
    method: request.method,
    headers: cleanHeaders,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });
}

function matchPattern(pathname, pattern) {
  if (!pattern.includes("*")) return pathname === pattern;
  const regexPattern = pattern.replace(/\\*/g, ".*").replace(/\\//g, "\\\\/");
  return new RegExp(\`^\${regexPattern}$\`).test(pathname);
}
`;

  fs.writeFileSync(edgeFile, edgeCode, "utf-8");
  console.log(
    `✅ Edge function updated: ${redirectRules.length} redirects, ${rewriteRules.length} rewrites`
  );

  return { redirectRules, rewriteRules, timestamp };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateEdgeFile().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
