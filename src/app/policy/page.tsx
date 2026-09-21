import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { CookiePreferenceTrigger } from "@/components/CookiePreferenceTrigger";
import { SITE_URL } from "@/lib/env";

export const metadata = buildMetadata({
  title: "Policies — Privacy, Return & Refund, Shipping",
  description:
    "Review JewelsCart policies: Data privacy & protection, 15-20 days handcrafted shipping timeline, and all sales strictly final policy.",
  path: "/policy",
});

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-8">
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">
          Legal & Compliance
        </span>
        <h1 className="font-display mt-2 text-4xl font-semibold text-stone-900 md:text-5xl">
          JewelsCart Policies
        </h1>
        <p className="mt-4 text-sm text-stone-500">
          Last Updated: July 2, 2026
        </p>

        {/* Quick Jump Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 sm:gap-3">
          <a
            href="#privacy"
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-xs font-medium text-stone-700 transition hover:border-gold hover:bg-gold/10 hover:text-stone-900"
          >
            Privacy Policy &rarr;
          </a>
          <a
            href="#refund"
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-xs font-medium text-stone-700 transition hover:border-gold hover:bg-gold/10 hover:text-stone-900"
          >
            Return & Refund Policy &rarr;
          </a>
          <a
            href="#shipping"
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-xs font-medium text-stone-700 transition hover:border-gold hover:bg-gold/10 hover:text-stone-900"
          >
            Shipping & Delivery Policy &rarr;
          </a>
        </div>
      </div>

      {/* 1. PRIVACY POLICY */}
      <section
        id="privacy"
        className="scroll-mt-12 pt-12 border-b border-stone-200 pb-16"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            Section 1
          </span>
          <h2 className="font-display text-2xl font-semibold text-stone-900 md:text-3xl">
            Privacy Policy
          </h2>
        </div>

        <div className="mt-8 space-y-8 text-stone-700 leading-relaxed text-sm md:text-base">
          <div>
            <p>
              At <strong>JewelsCart</strong> (operating under{" "}
              <strong>jewelscart.in</strong>), accessible from{" "}
              <a href={SITE_URL} className="text-gold hover:underline">
                {SITE_URL}
              </a>
              , one of our main priorities is the privacy of our visitors. This
              Privacy Policy document contains types of information that is
              collected and recorded by JewelsCart and how we use it.
            </p>
            <p className="mt-4">
              If you have additional questions or require more information about
              our Privacy Policy, do not hesitate to reach out to us through our{" "}
              <Link href="/contact" className="text-gold hover:underline">
                Contact Page
              </Link>
              .
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              1. Information We Collect
            </h3>
            <p>
              We collect personal information that you voluntarily provide to us
              when you express an interest in obtaining information about us or
              our products, place an order, make inquiries, request
              customization, or contact us:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-stone-600">
              <li>
                <strong>Contact Data:</strong> Name, email address, phone number
                (including WhatsApp contact details), and
                mailing/billing/shipping address.
              </li>
              <li>
                <strong>Order & Customization Data:</strong> Specifics regarding
                your custom jewellery designs, color preferences, quantities,
                catalog selections, and shipping destinations.
              </li>
              <li>
                <strong>Communication History:</strong> Record of conversations,
                enquiries, or quotes exchanged over email or WhatsApp.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              2. How We Use Your Information
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-stone-600">
              <li>Provide, operate, and maintain our website services.</li>
              <li>Process and fulfill your custom and handcrafted orders.</li>
              <li>
                Coordinate the 15-20 days custom crafting process with our
                artisans.
              </li>
              <li>
                Communicate with you regarding order specifications, updates,
                and draft design proofs.
              </li>
              <li>
                Arrange global export logistics, shipping, customs clearances,
                and deliveries.
              </li>
              <li>Prevent fraudulent transactions and secure our system.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              3. Log Files and Cookies
            </h3>
            <p>
              JewelsCart uses essential and preference cookies to maintain your
              shopping cart, remember your cookie consent preferences,
              deduplicate visitor counts without storing raw personal
              information, and analyze site traffic trends.
            </p>
            <p>
              The information collected automatically includes anonymized IP
              hashes, browser types, device categories, referring pages, and
              session duration. You can accept or decline non-essential
              analytics tracking at any time via your{" "}
              <Link
                href="/account#privacy"
                className="text-gold underline underline-offset-2 font-medium hover:text-gold-light"
              >
                Account Privacy Settings
              </Link>{" "}
              or by opening our <CookiePreferenceTrigger />.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              4. Sharing Your Data
            </h3>
            <p>
              We do not sell, rent, or lease your personal information to third
              parties. We share information only with trusted service providers
              necessary to operate:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-stone-600">
              <li>
                <strong>Logistics & Shipping Partners:</strong> To dispatch,
                ship, and export handcrafted jewelry to your destination
                address.
              </li>
              <li>
                <strong>Payment Gateway (Razorpay):</strong> Payments are
                processed securely through Razorpay Software Private Limited
                adhering to PCI-DSS Level 1 standards with 256-bit SSL
                encryption. We never view or store debit/credit card numbers or
                UPI PINs.
              </li>
              <li>
                <strong>Compliance & Legal:</strong> If required by law, court
                order, or government authority to clear customs or comply with
                regulatory audits.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              5. Data Storage, Security & Retention Timelines
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li>
                <strong>Financial & Invoicing Records (8 Years):</strong>{" "}
                Mandated under Section 44AA of the Income Tax Act, 1961 for
                commercial bookkeeping and tax filing.
              </li>
              <li>
                <strong>Active Accounts:</strong> Maintained for the lifetime of
                your account. Inactive profiles with no orders are archived
                after 3 consecutive years.
              </li>
              <li>
                <strong>Custom Crafting Inquiries (180 Days):</strong> Design
                chats and notes not resulting in a purchase are purged after 180
                days.
              </li>
              <li>
                <strong>Technical Server Logs (180 Days):</strong> Stored for
                180 days in compliance with Indian cyber-security guidelines
                (CERT-In).
              </li>
            </ul>
          </div>

          <div id="erasure" className="scroll-mt-12 space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              6. Your Privacy Rights & Erasure Requests
            </h3>
            <p>
              You have the right to access, correct, or request deletion of your
              account. To submit a data erasure request, email our Grievance
              Desk at{" "}
              <a
                href="mailto:jewelscart2@gmail.com?subject=Data%20Privacy%20Request"
                className="text-gold hover:underline font-medium"
              >
                jewelscart2@gmail.com
              </a>{" "}
              from your registered email. In accordance with statutory
              guidelines, requests are acknowledged within{" "}
              <strong>48 hours</strong> and fulfilled within{" "}
              <strong>30 days</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* 2. RETURN & REFUND POLICY */}
      <section
        id="refund"
        className="scroll-mt-12 pt-12 border-b border-stone-200 pb-16"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            Section 2
          </span>
          <h2 className="font-display text-2xl font-semibold text-stone-900 md:text-3xl">
            Return, Refund & Cancellation Policy
          </h2>
        </div>

        <div className="mt-8 space-y-8 text-stone-700 leading-relaxed text-sm md:text-base">
          <p>
            At <strong>JewelsCart</strong>, every piece of jewellery in our
            catalogue is artisan-crafted and made-to-order by skilled karigars.
            Because each piece requires dedicated craftsmanship, hand-setting,
            and materials allocated specifically for each customer upon
            confirmation, we operate under a strict and transparent policy:
          </p>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              1. All Sales Strictly Final (No Returns or Refunds in Any Case)
            </h3>
            <p>
              <strong>
                All sales are strictly final. We do not accept returns or issue
                refunds under any circumstances.
              </strong>
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-stone-600">
              <li>
                <strong>No Returns or Refunds:</strong> We do not accept product
                returns, nor do we issue monetary or bank refunds in any case.
              </li>
              <li>
                <strong>No Exchanges:</strong> We do not offer product, design,
                or color exchanges. Please review product dimensions and
                specifications before ordering.
              </li>
              <li>
                <strong>No Cancellations:</strong> Because orders immediately
                enter the artisan workshop upon payment, orders cannot be
                cancelled or altered once placed.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              2. Handcrafted Variations
            </h3>
            <p>
              Because each jewellery piece is handmade by artisans, subtle
              natural variations in stone texture, shade, cut, or polish reflect
              authentic artisan craftsmanship rather than defects. These natural
              variations do not constitute grounds for return, exchange, or
              cancellation.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              3. Payment Methods & No Cash on Delivery (COD)
            </h3>
            <p>
              All orders on JewelsCart must be 100% prepaid through our secure
              Razorpay gateway. We do not offer Cash on Delivery (COD) services.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SHIPPING & DELIVERY POLICY */}
      <section id="shipping" className="scroll-mt-12 pt-12 pb-16">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            Section 3
          </span>
          <h2 className="font-display text-2xl font-semibold text-stone-900 md:text-3xl">
            Shipping & Delivery Policy
          </h2>
        </div>

        <div className="mt-8 space-y-8 text-stone-700 leading-relaxed text-sm md:text-base">
          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              1. Custom Crafting Timelines (15–20 Business Days)
            </h3>
            <p>
              Unlike mass-produced commercial jewellery, each piece is
              handcrafted upon order by skilled karigars and women artisans.
              Each piece undergoes dedicated stone setting, bead work, and
              meticulous bench finishing:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-stone-600">
              <li>
                <strong>Custom Crafting Window:</strong> Custom and
                made-to-order pieces require{" "}
                <strong>15 to 20 business days</strong> for crafting, setting,
                and final quality inspection before dispatch.
              </li>
              <li>
                <strong>Dispatch Location:</strong> All orders are dispatched
                securely from our central workshop and display shop in{" "}
                <strong>Mumbai, Maharashtra, India</strong>.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              2. Domestic Shipping Rates & Delivery (2–4 Business Days)
            </h3>
            <p>
              Once crafting is complete and your order is dispatched from
              Mumbai:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-stone-600">
              <li>
                <strong>Free Delivery in India:</strong> We offer{" "}
                <strong>
                  100% Free Express Delivery across India on all orders above
                  ₹5,000
                </strong>
                .
              </li>
              <li>
                <strong>Orders Under ₹5,000:</strong> Flat ₹99 within
                Maharashtra, and flat ₹200 for the rest of India.
              </li>
              <li>
                <strong>Domestic Delivery Timeline:</strong> Typically{" "}
                <strong>2 to 4 business days</strong> post-dispatch via express
                couriers.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              3. International Shipping (8–10 Business Days)
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-stone-600">
              <li>
                <strong>International Delivery Timeline:</strong> Global
                shipments typically arrive within{" "}
                <strong>8 to 10 business days</strong> post-dispatch via DHL
                Express, FedEx, or international postal networks.
              </li>
              <li>
                <strong>Customs & Import Duties:</strong> Any customs
                clearances, destination VAT, or tariffs levied by destination
                countries are the responsibility of the customer.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
              4. Order Tracking & Packaging
            </h3>
            <p>
              As soon as your parcel is dispatched, tracking details (AWB number
              and tracking link) are shared via Email or WhatsApp. Every piece
              is encased in reinforced packaging with protective cushion wraps.
            </p>
          </div>
        </div>
      </section>

      {/* GRIEVANCE & CONTACT FOOTER */}
      <section className="border-t border-stone-200 pt-8 space-y-4">
        <h3 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
          Contact & Grievance Officer
        </h3>
        <p className="text-stone-600 text-sm">
          In accordance with Rule 5(4) of the Consumer Protection (E-Commerce)
          Rules, 2020 and the Information Technology Act, 2000, grievances will
          be acknowledged within <strong>48 hours</strong> and resolved within{" "}
          <strong>1 month (30 days)</strong>:
        </p>
        <div className="space-y-2 text-stone-600 text-sm">
          <p>
            <strong className="text-stone-800">Brand:</strong> JewelsCart
            (Operating under jewelscart.in)
          </p>
          <p>
            <strong className="text-stone-800">Direct Phone:</strong>{" "}
            <a
              href="tel:+919920685652"
              className="text-gold hover:underline font-medium"
            >
              +91 99206 85652
            </a>
          </p>
          <p>
            <strong className="text-stone-800">Official Support Email:</strong>{" "}
            <a
              href="mailto:jewelscart2@gmail.com"
              className="text-gold hover:underline font-medium"
            >
              jewelscart2@gmail.com
            </a>
          </p>
          <p>
            <strong className="text-stone-800">
              Dispatch & Display Location:
            </strong>{" "}
            Mumbai, Maharashtra, India
          </p>
          <p>
            <strong className="text-stone-800">Direct Inquiries:</strong>{" "}
            <Link href="/contact" className="text-gold hover:underline">
              Visit our Contact Page
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
