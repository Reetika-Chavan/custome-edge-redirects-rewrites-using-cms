/**
 * Fetch redirect rules from Contentstack
 * Used during build time to generate Edge redirects
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
    // Import Contentstack SDK - use dynamic import
    // The module exports Stack, but the structure depends on how it's imported
    const contentstackModule = await import("contentstack");

    // Try to find Stack in different locations
    // Pattern 1: contentstackModule.Stack (named export)
    // Pattern 2: contentstackModule.default.Stack (default export has Stack)
    // Pattern 3: contentstackModule.default is Stack itself
    let StackFn;

    if (contentstackModule.Stack) {
      StackFn = contentstackModule.Stack;
    } else if (contentstackModule.default?.Stack) {
      StackFn = contentstackModule.default.Stack;
    } else if (
      contentstackModule.default &&
      typeof contentstackModule.default === "object"
    ) {
      // If default is an object, check if it has Stack
      StackFn = contentstackModule.default.Stack;
    }

    if (!StackFn || typeof StackFn !== "function") {
      const availableKeys = Object.keys(contentstackModule);
      const defaultKeys = contentstackModule.default
        ? Object.keys(contentstackModule.default)
        : [];
      throw new Error(
        `Contentstack.Stack not found as a function. ` +
          `Module keys: ${availableKeys.join(", ")}. ` +
          `Default keys: ${defaultKeys.join(", ")}`
      );
    }

    // Call Stack as a function (not constructor) - matches lib/contentstack.ts pattern
    const Stack = StackFn({
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

export async function fetchRules() {
  const redirectCT = process.env.REDIRECT_CT || "redirect";

  console.log("🚀 Fetching redirect rules from Contentstack...");
  console.log(`   - Redirect Content Type: ${redirectCT}`);

  const entries = await fetchEntries(redirectCT);

  const redirectRules = entries.map((entry) => ({
    from: entry.source,
    to: entry.destination,
    type: entry.statuscode || 301,
    headers:
      entry.response?.headers?.header_pairs?.reduce((acc, pair) => {
        if (pair.key && pair.value) acc[pair.key] = pair.value;
        return acc;
      }, {}) || {},
  }));

  console.log(`✅ Successfully fetched ${redirectRules.length} redirects`);

  return { redirectRules };
}
