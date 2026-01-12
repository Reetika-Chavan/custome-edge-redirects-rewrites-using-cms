let contentstack;

/**
 * Fetches entries from a specific Contentstack content type
 * @param {string} contentType - Content type UID
 * @returns {Promise<Array>} Array of entries
 */
async function fetchEntries(contentType) {
  // Try both prefixed and non-prefixed environment variables for compatibility
  const apiKey =
    process.env.CONTENTSTACK_API_KEY ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
  const deliveryToken =
    process.env.CONTENTSTACK_DELIVERY_TOKEN ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN ||
    process.env.CONTENTSTACK_MANAGEMENT_TOKEN ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_MANAGEMENT_TOKEN;
  const environment =
    process.env.CONTENTSTACK_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT ||
    "devlopment";
  const host =
    process.env.CONTENTSTACK_APP_HOST ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_APP_HOST ||
    process.env.CONTENTSTACK_LIVE_PREVIEW_HOST ||
    process.env.NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_HOST;

  if (!apiKey || !deliveryToken) {
    const missing = [];
    if (!apiKey) {
      missing.push("CONTENTSTACK_API_KEY or NEXT_PUBLIC_CONTENTSTACK_API_KEY");
    }
    if (!deliveryToken) {
      missing.push(
        "CONTENTSTACK_DELIVERY_TOKEN or NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN (or MANAGEMENT_TOKEN variants)"
      );
    }
    throw new Error(
      `❌ Missing Contentstack configuration. Please set the following environment variables: ${missing.join(
        ", "
      )}`
    );
  }

  // Log configuration status (without exposing secrets)
  const apiKeySource = process.env.CONTENTSTACK_API_KEY
    ? "CONTENTSTACK_API_KEY"
    : "NEXT_PUBLIC_CONTENTSTACK_API_KEY";
  const tokenSource = process.env.CONTENTSTACK_DELIVERY_TOKEN
    ? "CONTENTSTACK_DELIVERY_TOKEN"
    : process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN
    ? "NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN"
    : process.env.CONTENTSTACK_MANAGEMENT_TOKEN
    ? "CONTENTSTACK_MANAGEMENT_TOKEN"
    : "NEXT_PUBLIC_CONTENTSTACK_MANAGEMENT_TOKEN";
  const envSource = process.env.CONTENTSTACK_ENVIRONMENT
    ? "CONTENTSTACK_ENVIRONMENT"
    : process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT
    ? "NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT"
    : "default (development)";

  const hostSource = process.env.CONTENTSTACK_APP_HOST
    ? "CONTENTSTACK_APP_HOST"
    : process.env.NEXT_PUBLIC_CONTENTSTACK_APP_HOST
    ? "NEXT_PUBLIC_CONTENTSTACK_APP_HOST"
    : process.env.CONTENTSTACK_LIVE_PREVIEW_HOST
    ? "CONTENTSTACK_LIVE_PREVIEW_HOST"
    : process.env.NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_HOST
    ? "NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_HOST"
    : "default (cdn.contentstack.io)";

  console.log(
    `📋 Contentstack configuration:\n` +
      `   - API Key: ${apiKey ? "✓" : "✗"} (from ${apiKeySource})\n` +
      `   - Delivery Token: ${
        deliveryToken ? "✓" : "✗"
      } (from ${tokenSource})\n` +
      `   - Environment: ${environment} (from ${envSource})\n` +
      `   - Host: ${host || "default"} (from ${hostSource})`
  );

  try {
    if (!contentstack) {
      // Import Contentstack SDK - use dynamic import
      const contentstackModule = await import("contentstack");

      // The module might export Stack directly or via default
      // Try to find Stack in various locations
      if (contentstackModule.Stack) {
        // Stack is directly on the module
        contentstack = { Stack: contentstackModule.Stack };
      } else if (contentstackModule.default) {
        // Check if default has Stack
        if (contentstackModule.default.Stack) {
          contentstack = contentstackModule.default;
        } else if (typeof contentstackModule.default === "function") {
          // Default itself might be Stack
          contentstack = { Stack: contentstackModule.default };
        } else {
          // Default might be the contentstack namespace
          contentstack = contentstackModule.default;
        }
      } else {
        // Fallback to the module itself
        contentstack = contentstackModule;
      }
    }

    // Access Stack - should now be at contentstack.Stack
    const StackFn = contentstack.Stack;

    if (!StackFn) {
      // Log available keys for debugging
      const availableKeys = Object.keys(contentstack);
      throw new Error(
        `Contentstack.Stack is not available. Available keys: ${JSON.stringify(
          availableKeys
        )}. ` +
          `Try checking: contentstack.default?.Stack or contentstack.default`
      );
    }

    // Use Contentstack SDK to create Stack instance
    // Wrap in try-catch to handle "Cannot call a class as a function" error
    let Stack;
    const stackConfig = {
      api_key: apiKey,
      delivery_token: deliveryToken,
      environment: environment,
    };

    try {
      // Try calling as function first (matches lib/contentstack.ts)
      if (typeof StackFn === "function") {
        Stack = StackFn(stackConfig);
      } else if (StackFn.Stack && typeof StackFn.Stack === "function") {
        // If Stack is nested, try that
        Stack = StackFn.Stack(stackConfig);
      } else {
        throw new Error("StackFn is not a callable function");
      }
    } catch (stackError) {
      // If it's a class, use constructor pattern
      if (
        stackError.message?.includes("class") ||
        stackError.message?.includes("Cannot call a class as a function") ||
        stackError.message?.includes("is not a callable")
      ) {
        try {
          Stack = new StackFn(stackConfig);
        } catch (constructorError) {
          // If new also fails, try accessing Stack property
          if (StackFn.Stack) {
            Stack = new StackFn.Stack(stackConfig);
          } else {
            throw constructorError;
          }
        }
      } else {
        // Re-throw if it's a different error
        throw stackError;
      }
    }

    // Set custom host if provided (for non-production environments)
    if (host) {
      Stack.setHost(host);
      console.log(`   - Using custom host: ${host}`);
    }

    const Query = Stack.ContentType(contentType).Query();
    const result = await Query.find();

    // Contentstack returns { items: [...], count: ... } or just an array
    // Handle both cases
    if (Array.isArray(result)) {
      return result;
    } else if (result && Array.isArray(result.items)) {
      return result.items;
    } else if (result && Array.isArray(result[0])) {
      return result[0];
    }

    return [];
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      error_message: error.error_message || error.message,
      error_code: error.error_code,
      errors: error.errors,
      status: error.status,
      statusText: error.statusText,
    };

    console.error(
      `❌ Error fetching entries from "${contentType}":`,
      errorDetails
    );

    // Provide helpful troubleshooting info
    if (error.error_code === 109 || error.status === 412) {
      console.error(
        `💡 Troubleshooting: This error usually means:\n` +
          `   - The API key doesn't match any Contentstack stack\n` +
          `   - The environment "${environment}" doesn't exist in your stack\n` +
          `   - The delivery token doesn't have access to this environment\n` +
          `   - Check that your environment variables are set correctly in your deployment platform`
      );
    }

    throw error;
  }
}

export async function fetchRules() {
  const redirectCT = process.env.REDIRECT_CT || "redirect";

  console.log("🚀 Fetching redirect rules from Contentstack...");
  console.log(`   - Redirect CT: ${redirectCT}`);

  const redirectEntries = await fetchEntries(redirectCT).catch(() => []);

  //Redirect Entries
  const redirectRules = redirectEntries.map((entry) => ({
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
