import type { APIRoute } from "astro";

// The method chooser is a plain GET form, so it works without JS; this just
// routes its choice to the matching payment page.
export const GET: APIRoute = ({ url, redirect }) =>
  redirect(url.searchParams.get("method") === "card" ? "/pay/card/" : "/pay/bank/", 303);
