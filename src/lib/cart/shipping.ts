export interface ShippingFeeResult {
  fee: number;
  label: string;
  isFree: boolean;
  thresholdRemaining: number;
}

export function calculateShippingFee(
  subtotal: number,
  state?: string,
): ShippingFeeResult {
  const FREE_SHIPPING_THRESHOLD = 5000;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return {
      fee: 0,
      label: "FREE (Orders over ₹5,000)",
      isFree: true,
      thresholdRemaining: 0,
    };
  }

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  if (!state || !state.trim()) {
    return {
      fee: 0,
      label: "Select delivery address to calculate",
      isFree: false,
      thresholdRemaining: remaining,
    };
  }

  if (state.trim().toLowerCase() === "maharashtra") {
    return {
      fee: 99,
      label: "Flat ₹99 (Maharashtra)",
      isFree: false,
      thresholdRemaining: remaining,
    };
  }

  return {
    fee: 199,
    label: "Flat ₹199 (Pan-India)",
    isFree: false,
    thresholdRemaining: remaining,
  };
}
