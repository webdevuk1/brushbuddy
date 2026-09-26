(function (root) {
  "use strict";

  // Paste your Amazon Associates tracking ID here before you publish, e.g. "brushbuddy-21".
  // Leave it empty while testing — links still open Amazon, they just won't pay commission.
  const AFFILIATE_TAG = "brushbuddy21-21";
  const STORE_SEARCH = "https://www.amazon.co.uk/s";

  const PRODUCTS = [
    {
      name: "Electric toothbrush",
      detail: "Runs a two-minute timer for you.",
      query: "electric toothbrush",
    },
    {
      name: "Fluoride toothpaste",
      detail: "The one dentists keep recommending.",
      query: "fluoride toothpaste",
    },
    {
      name: "Dental floss",
      detail: "The minute after you brush.",
      query: "dental floss",
    },
  ];

  function productUrl(query) {
    const url = new URL(STORE_SEARCH);
    url.searchParams.set("k", query);
    if (AFFILIATE_TAG) url.searchParams.set("tag", AFFILIATE_TAG);
    return url.toString();
  }

  root.BrushAffiliates = {
    tag: AFFILIATE_TAG,
    disclosure: AFFILIATE_TAG
      ? "We may earn a commission if you buy through these links, at no extra cost to you."
      : "These open Amazon. Add your Associates tag in lib/affiliates.js before you publish.",
    products: PRODUCTS.map(function (product) {
      return {
        name: product.name,
        detail: product.detail,
        url: productUrl(product.query),
      };
    }),
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
