import * as contentstack from "contentstack";

/**
 * Fetches entries from a specific Contentstack content type
 * @param {string} contentType - Content type UID
 * @returns {Promise<Array>} Array of entries
 */
async function fetchEntries(contentType) {
  const apiKey = process.env.CONTENTSTACK_API_KEY;
  const deliveryToken =
    process.env.CONTENTSTACK_DELIVERY_TOKEN ||
    process.env.CONTENTSTACK_MANAGEMENT_TOKEN;
  const environment = process.env.CONTENTSTACK_ENVIRONMENT || "production";

  if (!apiKey || !deliveryToken) {
    throw new Error(
      "Missing Contentstack configuration. Please set CONTENTSTACK_API_KEY and CONTENTSTACK_DELIVERY_TOKEN environment variables."
    );
  }

  try {
    const Stack = contentstack.Stack({
      api_key: apiKey,
      delivery_token: deliveryToken,
      environment: environment,
    });

    const Query = Stack.ContentType(contentType).Query();
    const result = await Query.toJSON().find();
    return result[0] || [];
  } catch (error) {
    console.error(
      `❌ Error fetching entries from content type "${contentType}":`,
      error
    );
    throw error;
  }
}

/**
 * Fetches redirect and rewrite rules from Contentstack
 * Supports separate content types for redirects and rewrites
 * @returns {Promise<Object>} Object with redirectRules and rewriteRules arrays
 */
export async function fetchRules() {
  const redirectCT = process.env.REDIRECT_CT || "redirects";
  const rewriteCT = process.env.REWRITE_CT || "rewrites";

  console.log("🚀 Fetching redirect and rewrite rules from Contentstack...");
  console.log(`   - Redirect content type: ${redirectCT}`);
  console.log(`   - Rewrite content type: ${rewriteCT}`);

  // Fetch both content types in parallel
  const [redirectEntries, rewriteEntries] = await Promise.all([
    fetchEntries(redirectCT).catch(() => []), // Return empty array on error
    fetchEntries(rewriteCT).catch(() => []), // Return empty array on error
  ]);

  // Transform redirect entries
  const redirectRules = redirectEntries.map((entry) => ({
    from: entry.url_from || entry.source || entry.from || entry.old_url,
    to: entry.url_to || entry.destination || entry.to || entry.new_url,
    type: entry.type || entry.status_code || 301, // Default to 301 (permanent redirect)
  }));

  // Transform rewrite entries
  const rewriteRules = rewriteEntries.map((entry) => ({
    from: entry.source_path || entry.source || entry.from || entry.old_url,
    to:
      entry.destination_path || entry.destination || entry.to || entry.new_url,
  }));

  console.log(
    `✅ Fetched ${redirectRules.length} redirects and ${rewriteRules.length} rewrites`
  );

  return { redirectRules, rewriteRules };
}
