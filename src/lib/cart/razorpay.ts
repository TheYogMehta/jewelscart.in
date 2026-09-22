export interface RazorpayOptions {
  key?: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayPaymentSuccessResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
  onPaymentFailed?: (response: unknown) => void;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export async function startRazorpayCheckout(
  options: Omit<RazorpayOptions, "key"> & { key?: string },
): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    alert(
      "Unable to load Razorpay payment gateway. Please check your internet connection.",
    );
    return false;
  }

  const razorpayKey =
    options.key ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "rzp_test_placeholder";

  const checkoutOptions: RazorpayOptions = {
    ...options,
    key: razorpayKey,
    currency: options.currency || "INR",
    name: options.name || "JewelsCart",
    description: options.description || "Jewellery Purchase",
    theme: {
      color: "#b8860b",
      ...options.theme,
    },
  };

  try {
    const rzp = new window.Razorpay(checkoutOptions);
    if (options.onPaymentFailed) {
      rzp.on("payment.failed", options.onPaymentFailed);
    }
    rzp.open();
    return true;
  } catch (err) {
    console.error("Error opening Razorpay modal:", err);
    alert("Error initializing payment modal. Please try again.");
    return false;
  }
}
