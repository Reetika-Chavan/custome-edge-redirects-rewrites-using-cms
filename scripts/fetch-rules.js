/**
 * Fetch redirect/rewrite rules from Contentstack
 * Used during build time to generate Edge redirects/rewrites
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use require for contentstack since it's a CommonJS module
const contentstack = require("contentstack");

async function fetchEntries(contentType) {
  const apiKey =
    process.env.CONTENTSTACK_API_KEY ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;

  const deliveryToken =
    process.env.CONTENTSTACK_DELIVERY_TOKEN ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;

  const environment =
    process.env.CONTENTSTACK_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT ||
    "development";

  const host =
    process.env.CONTENTSTACK_APP_HOST ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_APP_HOST;

  if (!apiKey || !deliveryToken) {
    throw new Error(
      "❌ Missing Contentstack configuration (API key or Delivery token)"
    );
  }

  console.log(
    `📋 Contentstack configuration:
   - API Key: ✓
   - Delivery Token: ✓
   - Environment: ${environment}
   - Host: ${host || "default (cdn.contentstack.io)"}`
  );

  try {
    // Initialize Stack using the contentstack instance
    const Stack = contentstack.Stack({
      api_key: apiKey,
      delivery_token: deliveryToken,
      environment,
    });

    if (host) {
      Stack.setHost(host);
      console.log(`   - Using custom host: ${host}`);
    }

    const Query = Stack.ContentType(contentType).Query();
    const result = await Query.find();

    if (Array.isArray(result)) return result;
    if (result?.items) return result.items;
    if (Array.isArray(result?.[0])) return result[0];

    return [];
  } catch (error) {
    console.error(`❌ Failed to fetch entries from "${contentType}"`, {
      message: error.message,
      code: error.error_code,
      status: error.status,
    });
    throw error;
  }
}

/**
 * Parse redirect entries from Contentstack
 * Expected fields in content type: source, destination, statuscode, response.headers
 */
function parseRedirectEntry(entry) {
  return {
    from: entry.source,
    to: entry.destination,
    type: entry.statuscode || entry.status_code || 301,
    headers:
      entry.response?.headers?.header_pairs?.reduce((acc, pair) => {
        if (pair.key && pair.value) acc[pair.key] = pair.value;
        return acc;
      }, {}) ||
      entry.headers?.reduce((acc, pair) => {
        if (pair.key && pair.value) acc[pair.key] = pair.value;
        return acc;
      }, {}) ||
      {},
  };
}

/**
 * Parse rewrite entries from Contentstack
 * Expected fields: source, destination, request_headers, response_headers
 */
function parseRewriteEntry(entry) {
  return {
    from: entry.source,
    to: entry.destination,
    requestHeaders:
      entry.request_headers?.reduce((acc, pair) => {
        if (pair.key && pair.value) acc[pair.key] = pair.value;
        return acc;
      }, {}) || {},
    responseHeaders:
      entry.response_headers?.reduce((acc, pair) => {
        if (pair.key && pair.value) acc[pair.key] = pair.value;
        return acc;
      }, {}) || {},
  };
}

/**
 * Main function to fetch all rules from Contentstack
 * Fetches both redirects and rewrites based on content type configuration
 */
export async function fetchRules() {
  const redirectCT = process.env.REDIRECT_CT || "redirect";
  const rewriteCT = process.env.REWRITE_CT || "rewrite";

  console.log("🚀 Fetching redirect/rewrite rules from Contentstack...");
  console.log(`   - Redirect Content Type: ${redirectCT}`);
  console.log(`   - Rewrite Content Type: ${rewriteCT}`);

  let redirectRules = [];
  let rewriteRules = [];

  // Fetch redirects
  try {
    const redirectEntries = await fetchEntries(redirectCT);
    redirectRules = redirectEntries
      .filter((entry) => entry.source && entry.destination)
      .map(parseRedirectEntry);
    console.log(`✅ Successfully fetched ${redirectRules.length} redirects`);
  } catch (error) {
    console.warn(
      `⚠️ Could not fetch redirects from "${redirectCT}":`,
      error.message
    );
  }

  // Fetch rewrites
  try {
    const rewriteEntries = await fetchEntries(rewriteCT);
    rewriteRules = rewriteEntries
      .filter((entry) => entry.source && entry.destination)
      .map(parseRewriteEntry);
    console.log(`✅ Successfully fetched ${rewriteRules.length} rewrites`);
  } catch (error) {
    console.warn(
      `⚠️ Could not fetch rewrites from "${rewriteCT}":`,
      error.message
    );
  }

  return { redirectRules, rewriteRules };
}
