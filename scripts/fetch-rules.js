/**
 * Fetch redirect/rewrite rules from Contentstack
 * Uses Contentstack REST API directly for reliability
 */

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
    process.env.NEXT_PUBLIC_CONTENTSTACK_APP_HOST ||
    "cdn.contentstack.io";

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
   - Host: ${host}`
  );

  try {
    // Use Contentstack REST API directly
    const url = `https://${host}/v3/content_types/${contentType}/entries?environment=${environment}`;

    console.log(`   - Fetching from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        api_key: apiKey,
        access_token: deliveryToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error(`❌ Failed to fetch entries from "${contentType}"`, {
      message: error.message,
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
