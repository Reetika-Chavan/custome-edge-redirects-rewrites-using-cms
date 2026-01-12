
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
    throw new Error("Missing Contentstack API key or Delivery token");
  }

  const url = `https://${host}/v3/content_types/${contentType}/entries?environment=${environment}`;

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
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.entries || [];
}

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

export async function fetchRules() {
  const redirectCT = process.env.REDIRECT_CT || "redirect";
  const rewriteCT = process.env.REWRITE_CT || "rewrite";

  let redirectRules = [];
  let rewriteRules = [];

  try {
    const redirectEntries = await fetchEntries(redirectCT);
    redirectRules = redirectEntries
      .filter((entry) => entry.source && entry.destination)
      .map(parseRedirectEntry);
    console.log(`✅ Fetched ${redirectRules.length} redirects`);
  } catch (error) {
    console.warn(`⚠️ Could not fetch redirects: ${error.message}`);
  }

  try {
    const rewriteEntries = await fetchEntries(rewriteCT);
    rewriteRules = rewriteEntries
      .filter((entry) => entry.source && entry.destination)
      .map(parseRewriteEntry);
    console.log(`✅ Fetched ${rewriteRules.length} rewrites`);
  } catch (error) {
    console.warn(`⚠️ Could not fetch rewrites: ${error.message}`);
  }

  return { redirectRules, rewriteRules };
}
