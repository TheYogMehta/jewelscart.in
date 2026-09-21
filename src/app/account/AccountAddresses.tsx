"use client";

import { useState } from "react";
import type { AddressRecord, AddressInput } from "@/lib/addresses";

interface Props {
  initialAddresses: AddressRecord[];
  userEmail: string;
  userName: string;
  onAddressCountChange?: (count: number) => void;
}

export function AccountAddresses({
  initialAddresses,
  userName,
  onAddressCountChange,
}: Props) {
  const [addresses, setAddresses] = useState<AddressRecord[]>(initialAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [addressType, setAddressType] = useState<"home" | "work" | "other">(
    "home",
  );
  const [isDefault, setIsDefault] = useState(false);

  // Status & Feedback
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFullName("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setStateName("");
    setPostalCode("");
    setCountry("");
    setAddressType("home");
    setIsDefault(addresses.length === 0);
    setError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: AddressRecord) => {
    setEditingId(addr.id);
    setFullName(addr.full_name);
    setPhone(addr.phone);
    setAddressLine1(addr.address_line1);
    setAddressLine2(addr.address_line2 || "");
    setCity(addr.city);
    setStateName(addr.state);
    setPostalCode(addr.postal_code);
    setCountry(addr.country || "");
    setAddressType(addr.address_type || "home");
    setIsDefault(addr.is_default);
    setError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const payload: AddressInput = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || null,
      city: city.trim(),
      state: stateName.trim(),
      postal_code: postalCode.trim(),
      country: country.trim(),
      address_type: addressType,
      is_default: isDefault,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/account/addresses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update address");
        }

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingId) return data.address;
            if (payload.is_default) return { ...a, is_default: false };
            return a;
          }),
        );
        setSuccess("Address updated successfully.");
      } else {
        // Create new address
        const res = await fetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to save address");
        }

        const newAddrs = payload.is_default
          ? [
              data.address,
              ...addresses.map((a) => ({ ...a, is_default: false })),
            ]
          : [...addresses, data.address];

        setAddresses(newAddrs);
        onAddressCountChange?.(newAddrs.length);
        setSuccess("New address added successfully.");
      }

      handleCloseForm();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete address");
      }

      const updated = addresses.filter((a) => a.id !== id);
      if (
        addresses.find((a) => a.id === id)?.is_default &&
        updated.length > 0
      ) {
        updated[0].is_default = true;
      }
      setAddresses(updated);
      onAddressCountChange?.(updated.length);
      setSuccess("Address deleted successfully.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    setSettingDefaultId(id);
    setError(null);

    try {
      const res = await fetch(`/api/account/addresses/${id}/default`, {
        method: "PATCH",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to set default address");
      }

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === id,
        })),
      );
      setSuccess("Default delivery address updated.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update default address",
      );
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <span className="text-xs uppercase tracking-[0.15em] text-gold font-semibold">
            Delivery & Shipping
          </span>
          <h2 className="font-display mt-1 text-2xl font-semibold text-stone-900">
            Saved Addresses
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Manage your delivery destinations for handcrafted jewellery and
            bespoke bridal orders.
          </p>
        </div>

        {!isFormOpen && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-stone-800 cursor-pointer shrink-0"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 animate-in fade-in duration-150">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 animate-in fade-in duration-150">
          {success}
        </div>
      )}

      {/* Add / Edit Form Modal or Card */}
      {isFormOpen && (
        <div className="rounded-2xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-stone-900">
                {editingId ? "Edit Address" : "Add New Delivery Address"}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Please enter accurate contact and delivery information.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Address Type Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Address Type
              </label>
              <div className="mt-2 flex gap-3">
                {(["home", "work", "other"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressType(type)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-medium capitalize transition cursor-pointer ${
                      addressType === type
                        ? "border-gold bg-amber-50/70 text-gold font-semibold shadow-2xs"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Full Name & Phone Number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Recipient Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-stone-500">
                    +91
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-xl border border-stone-200 bg-white pl-11 pr-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label
                htmlFor="address_line1"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Flat, House No., Building, Apartment{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="address_line1"
                name="address_line1"
                type="text"
                required
                autoComplete="street-address"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label
                htmlFor="address_line2"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Street, Area, Landmark{" "}
                <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                id="address_line2"
                name="address_line2"
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* City, State, PIN Code, Country */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  autoComplete="address-level1"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="postal_code"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  PIN / Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  inputMode="numeric"
                  required
                  autoComplete="postal-code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  autoComplete="country-name"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="is_default"
                name="is_default"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-gold focus:ring-gold accent-gold"
              />
              <label
                htmlFor="is_default"
                className="text-xs text-stone-700 select-none cursor-pointer"
              >
                Set as my default delivery address
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-xl border border-stone-300 px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gold px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-gold-light transition disabled:opacity-50 cursor-pointer"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards Grid */}
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/60 text-gold">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="font-display mt-4 text-lg font-semibold text-stone-900">
            No Addresses Saved Yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-stone-500 leading-relaxed">
            Add a shipping address to enjoy swift checkout, insured jewellery
            deliveries, and custom bridal orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition shadow-xs ${
                addr.is_default
                  ? "border-gold/60 bg-amber-50/20 ring-1 ring-gold/30"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <div>
                {/* Badges Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-stone-700 border border-stone-200">
                    {addr.address_type || "Home"}
                  </span>
                  {addr.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-gold border border-amber-200/80">
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Default Delivery
                    </span>
                  )}
                </div>

                {/* Recipient Details */}
                <div className="mt-4">
                  <h4 className="font-display text-lg font-semibold text-stone-900">
                    {addr.full_name}
                  </h4>
                  <p className="mt-0.5 text-xs text-stone-600 flex items-center gap-1.5">
                    <svg
                      className="h-3.5 w-3.5 text-stone-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>+91 {addr.phone}</span>
                  </p>
                </div>

                {/* Formatted Address */}
                <div className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  <p>{addr.address_line1}</p>
                  {addr.address_line2 && <p>{addr.address_line2}</p>}
                  <p>
                    {addr.city}, {addr.state} -{" "}
                    <span className="font-medium text-stone-800">
                      {addr.postal_code}
                    </span>
                  </p>
                  {addr.country && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {addr.country}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4 text-xs">
                <div>
                  {!addr.is_default && (
                    <button
                      type="button"
                      disabled={settingDefaultId === addr.id}
                      onClick={() => handleSetDefault(addr.id)}
                      className="font-medium text-gold hover:text-gold-light hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {settingDefaultId === addr.id
                        ? "Setting..."
                        : "Set as Default"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    className="font-medium text-stone-700 hover:text-stone-900 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    type="button"
                    disabled={deletingId === addr.id}
                    onClick={() => handleDelete(addr.id)}
                    className="font-medium text-red-600 hover:text-red-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {deletingId === addr.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
