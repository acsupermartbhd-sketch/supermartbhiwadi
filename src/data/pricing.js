export function isPartnerUser(customerSession) {
  return customerSession?.role === "partner";
}

export function getProductPrice(product, customerSession) {
  const isPartner = isPartnerUser(customerSession);

  if (isPartner) {
    // Use explicit partnerPrice if set, otherwise apply 12% wholesale discount
    const explicitPartner =
      product.partnerPrice != null && Number(product.partnerPrice) > 0
        ? Number(product.partnerPrice)
        : null;
    if (explicitPartner) return explicitPartner;

    // Fallback: auto 12% wholesale discount off retail price
    const base = Number(product.customerPrice || product.price || 0);
    return base > 0 ? Math.round(base * 0.88) : 0;
  }

  // Regular customer: customerPrice or price
  return Number(product.customerPrice || product.price || 0);
}

export function getProductOldPrice(product, customerSession) {
  // For partners, old price = retail/customer price (to show savings)
  if (isPartnerUser(customerSession)) {
    return Number(product.customerPrice || product.price || 0);
  }
  const price = getProductPrice(product, customerSession);
  return Number(product.oldPrice || price);
}
