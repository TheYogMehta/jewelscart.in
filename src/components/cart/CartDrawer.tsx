"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useCartStore,
  useCartHydrated,
  CartItem,
  calculateShippingFee,
} from "@/lib/cart/useCartStore";
import { startRazorpayCheckout } from "@/lib/cart/razorpay";
import { isVideoMedia } from "@/lib/media";
import type { AddressRecord } from "@/lib/addresses";

export function CartDrawer() {
  const hydrated = useCartHydrated();
  const router = useRouter();
  const { data: session } = useSession();

  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const deliveryAddress = useCartStore((state) => state.deliveryAddress);
  const setDeliveryAddress = useCartStore((state) => state.setDeliveryAddress);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<AddressRecord[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPickerOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (session?.user) {
      fetch("/api/account/addresses")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load");
          return res.json();
        })
        .then((data) => {
          const addrs: AddressRecord[] = data.addresses || [];
          setSavedAddresses(addrs);

          if (!deliveryAddress && addrs.length > 0) {
            const def = addrs.find((a) => a.is_default) || addrs[0];
            setDeliveryAddress({
              fullName: def.full_name,
              phone: def.phone,
              addressLine1: def.address_line1,
              addressLine2: def.address_line2 || "",
              city: def.city,
              state: def.state,
              pincode: def.postal_code,
            });
          }
        })
        .catch((err) => {
          console.warn("Could not fetch addresses:", err);
        });
    }
  }, [isOpen, session, deliveryAddress, setDeliveryAddress]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!hydrated) return null;

  const subtotal = getSubtotal();
  const totalCount = getItemCount();
  const isFreeShipping = subtotal >= 5000;

  const shipping = calculateShippingFee(subtotal, deliveryAddress?.state);
  const shippingFee = isFreeShipping
    ? 0
    : deliveryAddress
      ? shipping.fee
      : null;
  const totalDue = subtotal + (shippingFee ?? 0);

  const handleSelectAddress = (addr: AddressRecord) => {
    setDeliveryAddress({
      fullName: addr.full_name,
      phone: addr.phone,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.postal_code,
    });
  };

  const handleRedirectToAddAddress = () => {
    closeCart();
    setIsPickerOpen(false);
    if (session?.user) {
      router.push("/account#addresses");
    } else {
      router.push("/login?callbackUrl=/account%23addresses");
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!deliveryAddress) {
      handleRedirectToAddAddress();
      return;
    }

    setIsCheckingOut(true);

    try {
      const amountInPaise = Math.round(totalDue * 100);

      await startRazorpayCheckout({
        amount: amountInPaise,
        currency: "INR",
        name: "JewelsCart",
        description: `Order of ${totalCount} item${totalCount > 1 ? "s" : ""} to ${deliveryAddress.city}`,
        prefill: {
          name: deliveryAddress.fullName,
          contact: deliveryAddress.phone,
        },
        notes: {
          delivery_name: deliveryAddress.fullName,
          delivery_phone: deliveryAddress.phone,
          delivery_address: `${deliveryAddress.addressLine1}${
            deliveryAddress.addressLine2
              ? ", " + deliveryAddress.addressLine2
              : ""
          }, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`,
          shipping_fee: String(shippingFee ?? 0),
        },
        handler: function (response) {
          alert(
            `Payment successful! Payment ID: ${response.razorpay_payment_id}`,
          );
          clearCart();
          closeCart();
        },
        modal: {
          ondismiss: () => {
            setIsCheckingOut(false);
          },
        },
      });
    } catch (error) {
      console.error("Razorpay checkout failed:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const isAddressRecordActive = (addr: AddressRecord) => {
    if (!deliveryAddress) return false;
    return (
      deliveryAddress.pincode === addr.postal_code &&
      deliveryAddress.addressLine1 === addr.address_line1 &&
      deliveryAddress.phone === addr.phone
    );
  };

  const hasDeliveryAddress = Boolean(
    deliveryAddress || savedAddresses.length > 0,
  );

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-stone-950/45 transition-opacity duration-300 ease-out ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over Drawer Panel */}
      <aside
        aria-label="Shopping Bag"
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with Title and Address Picker */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <h2 className="font-display text-lg font-semibold tracking-wide text-stone-900">
              Shopping Bag
            </h2>
            <span className="flex h-5 items-center justify-center rounded-full bg-stone-100 px-2 text-[11px] font-medium text-stone-600">
              {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {items.length > 0 && hasDeliveryAddress && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/80 px-2.5 py-1 text-xs text-stone-800 hover:bg-amber-100/80 transition max-w-42.5 sm:max-w-52.5 cursor-pointer"
                  title={
                    deliveryAddress
                      ? `${deliveryAddress.fullName}, ${deliveryAddress.city} - ${deliveryAddress.pincode}`
                      : "Choose delivery address"
                  }
                >
                  <svg
                    className="h-3.5 w-3.5 text-gold shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="truncate text-[11px] font-medium text-stone-800">
                    {deliveryAddress
                      ? `${deliveryAddress.city} (${deliveryAddress.pincode})`
                      : "Select Address"}
                  </span>
                  <svg
                    className={`h-3 w-3 text-stone-400 shrink-0 transition-transform ${isPickerOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* Dropdown Menu for Saved Addresses */}
                {isPickerOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-2.5 shadow-xl z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100 px-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                        Deliver To
                      </span>
                      <button
                        type="button"
                        onClick={handleRedirectToAddAddress}
                        className="text-[11px] font-medium text-gold hover:underline cursor-pointer"
                      >
                        + Manage / Add
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 py-1.5">
                      {savedAddresses.length > 0 ? (
                        savedAddresses.map((addr) => {
                          const active = isAddressRecordActive(addr);
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                handleSelectAddress(addr);
                                setIsPickerOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl text-xs transition flex items-start gap-2 cursor-pointer ${
                                active
                                  ? "bg-amber-50 border border-gold/40 text-stone-900"
                                  : "hover:bg-stone-50 text-stone-700 border border-transparent"
                              }`}
                            >
                              <input
                                type="radio"
                                name="header_address_picker"
                                checked={active}
                                readOnly
                                className="mt-0.5 accent-gold cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-stone-900 truncate">
                                    {addr.full_name}
                                  </span>
                                  {addr.address_type && (
                                    <span className="shrink-0 rounded bg-stone-100 px-1 py-0.5 text-[9px] uppercase font-medium text-stone-600">
                                      {addr.address_type}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                  {addr.address_line1}
                                </p>
                                <p className="text-[11px] font-medium text-stone-700">
                                  {addr.city}, {addr.state} &ndash;{" "}
                                  {addr.postal_code}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : deliveryAddress ? (
                        <div className="p-2 rounded-xl bg-stone-50 text-xs">
                          <p className="font-semibold text-stone-900">
                            {deliveryAddress.fullName}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {deliveryAddress.addressLine1}
                          </p>
                          <p className="text-[11px] font-medium text-stone-700">
                            {deliveryAddress.city}, {deliveryAddress.state}{" "}
                            &ndash; {deliveryAddress.pincode}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={closeCart}
              aria-label="Close bag"
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer shrink-0"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Free shipping threshold announcement */}
        {items.length > 0 && (
          <div className="border-b border-amber-100 bg-amber-50/60 px-6 py-2.5">
            {subtotal >= 5000 ? (
              <p className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                <span>🎉</span>
                <span>
                  You unlocked <strong>FREE Shipping</strong> across India!
                </span>
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-700">
                  <span>
                    Add{" "}
                    <strong>
                      ₹{(5000 - subtotal).toLocaleString("en-IN")}
                    </strong>{" "}
                    more for <strong>FREE Delivery</strong>
                  </span>
                  <span className="text-[11px] font-semibold text-gold">
                    {Math.round((subtotal / 5000) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-200/60">
                  <div
                    className="h-full bg-gold transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (subtotal / 5000) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {items.length === 0 ? (
            <div className="flex h-full min-h-75 flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-gold mb-4">
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="font-display text-lg font-medium text-stone-900">
                Your bag is empty
              </p>
              <p className="mt-1 max-w-xs text-xs text-stone-500">
                Explore our curated handcrafted jewellery catalogue and find
                something exquisite.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-6 inline-flex items-center rounded-full bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-gold-light transition cursor-pointer"
              >
                Discover Jewellery
              </button>
            </div>
          ) : (
            /* Product Items List */
            <ul className="divide-y divide-stone-100">
              {items.map((item: CartItem) => (
                <li key={item.id} className="flex gap-4 py-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                    {isVideoMedia(item.image) ? (
                      <video
                        src={item.image}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="font-medium text-xs text-stone-900 line-clamp-2 hover:text-gold transition"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="text-stone-400 hover:text-red-500 transition p-1 -mr-1 cursor-pointer"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>

                      {item.type && (
                        <p className="text-[11px] text-stone-400 capitalize mt-0.5">
                          {item.type}
                        </p>
                      )}

                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(item.options).map(([key, val]) => (
                            <span
                              key={key}
                              className="inline-block rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 capitalize"
                            >
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="flex h-7 w-7 items-center justify-center text-stone-600 hover:bg-stone-200/60 rounded-l-lg transition cursor-pointer"
                        >
                          &minus;
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            item.maxStock !== undefined &&
                            item.maxStock !== null &&
                            item.quantity >= item.maxStock
                          }
                          aria-label="Increase quantity"
                          className="flex h-7 w-7 items-center justify-center text-stone-600 hover:bg-stone-200/60 rounded-r-lg transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-display text-sm font-semibold text-stone-900">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Order Summary & Checkout Bottom Panel */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 bg-stone-50/90 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-medium text-stone-900">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600">
                <div className="flex flex-col">
                  <span>Shipping Fee</span>
                  {deliveryAddress && (
                    <span className="text-[10px] text-stone-400">
                      {shipping.label}
                    </span>
                  )}
                </div>
                {deliveryAddress ? (
                  <span
                    className={`font-medium ${shipping.fee === 0 ? "text-emerald-700" : "text-stone-900"}`}
                  >
                    {shipping.fee === 0 ? "FREE" : `₹${shipping.fee}`}
                  </span>
                ) : isFreeShipping ? (
                  <span className="font-medium text-emerald-700">FREE</span>
                ) : (
                  <span className="text-stone-400 text-xs font-normal">—</span>
                )}
              </div>

              {/* Total Amount Row */}
              <div className="flex items-center justify-between border-t border-stone-200/80 pt-2.5 text-sm font-semibold text-stone-900">
                <div className="flex flex-col">
                  <span>Total Amount</span>
                  {!deliveryAddress && !isFreeShipping && (
                    <span className="text-[10px] text-stone-400 font-normal">
                      (Excl. shipping until address is added)
                    </span>
                  )}
                </div>
                <span className="font-display text-xl text-stone-900">
                  ₹{totalDue.toLocaleString("en-IN")}
                </span>
              </div>

              <p className="text-[11px] text-stone-400">
                Inclusive of all taxes &amp; door-to-door transit insurance.
              </p>
            </div>

            <button
              type="button"
              onClick={
                deliveryAddress ? handleCheckout : handleRedirectToAddAddress
              }
              disabled={isCheckingOut}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-gold-light disabled:opacity-50 transition active:scale-98 cursor-pointer"
            >
              {isCheckingOut ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Preparing Gateway...</span>
                </>
              ) : !deliveryAddress ? (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Add Delivery Address to Proceed</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  <span>
                    Pay ₹{totalDue.toLocaleString("en-IN")} with Razorpay
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
