import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Review the terms of service, custom ordering guidelines, and conditions for JewelsCart.",
  path: "/terms-of-service",
});

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-8">
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">
          Compliance
        </span>
        <h1 className="font-display mt-2 text-4xl font-semibold text-stone-900 md:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-stone-500">
          Last Updated: July 2, 2026
        </p>
      </div>

      {/* Content */}
      <div className="mt-10 space-y-10 text-stone-700 leading-relaxed text-sm md:text-base">
        <section>
          <p>
            Welcome to <strong>JewelsCart</strong> (operating under{" "}
            <strong>jewelscart.in</strong>). These terms of service outline the
            rules and regulations for the use of JewelsCart&apos;s website,
            located at{" "}
            <a href={SITE_URL} className="text-gold hover:underline">
              {SITE_URL}
            </a>
            .
          </p>
          <p className="mt-4">
            By accessing this website and placing orders, you accept these terms
            of service in full. Do not continue to use JewelsCart if you do not
            agree to all of the terms and conditions stated on this page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
            1. Intellectual Property Rights
          </h2>
          <p>
            Other than the content you own, under these terms, JewelsCart and/or
            its licensors own all the intellectual property rights and materials
            contained in this website. All our unique handmade jewellery
            designs, product photographs, styling guides, graphics, website
            layout, and branding assets are protected by copyright and trade
            laws.
          </p>
          <p>
            You are granted a limited license only for purposes of viewing the
            material contained on this website for personal browsing or
            purchasing considerations. You must not:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>
              Republish, duplicate, or redistribute material from our website
              without prior written authorization.
            </li>
            <li>
              Sell, sub-license, or commercially exploit any website content or
              proprietary jewelry designs.
            </li>
            <li>
              Copy, reproduce, or reverse-engineer our handcrafted jewelry
              patterns or branding assets.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
            2. Permitted Use & User Conduct
          </h2>
          <p>
            You agree to use JewelsCart solely for lawful purposes and in a
            manner that does not infringe the rights of, restrict, or inhibit
            the use and enjoyment of this site by any third party. Specifically,
            you agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>
              Engage in data scraping, crawling, harvesting, or automated data
              extraction without our express consent.
            </li>
            <li>
              Attempt to bypass site security, probe system vulnerabilities, or
              interfere with the proper working of our services.
            </li>
            <li>
              Transmit fraudulent orders or misrepresent identity or payment
              information.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
            3. Orders & Commercial Store Policies
          </h2>
          <p>
            All products offered on JewelsCart are made-to-order and handcrafted
            by skilled artisans. By placing an order, you acknowledge that your
            purchase is governed by our dedicated customer policies:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>
              <strong>Return, Refund & Cancellation Policy:</strong> Because
              every piece is made-to-order, all sales are strictly final upon
              payment. We do not accept returns, exchanges, or cancellations.
              Please review our comprehensive{" "}
              <Link
                href="/policy#refund"
                className="text-gold hover:underline font-medium"
              >
                Return & Refund Policy
              </Link>
              .
            </li>
            <li>
              <strong>Shipping & Delivery Policy:</strong> Crafting lead times,
              domestic express shipping, international delivery, and customs/tax
              obligations are governed by our{" "}
              <Link
                href="/policy#shipping"
                className="text-gold hover:underline font-medium"
              >
                Shipping & Delivery Policy
              </Link>
              .
            </li>
            <li>
              <strong>Pre-Order Assistance:</strong> For custom requests, sizing
              questions, or pre-order inquiries, our team is available via our{" "}
              <Link href="/contact" className="text-gold hover:underline">
                Contact Page
              </Link>
              .
            </li>
            <li>
              <strong>Pricing & Product Accuracy:</strong> Prices are displayed
              in Indian Rupees (INR) and are subject to change without notice.
              We reserve the right to correct any unintended typographical or
              pricing errors prior to dispatch.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
            4. Limitation of Liability
          </h2>
          <p>
            In no event shall JewelsCart, nor any of its officers, directors,
            and employees, be held liable for anything arising out of or in any
            way connected with your use of this website or purchases of our
            jewelry, whether such liability is under contract. JewelsCart,
            including its officers, directors, and employees, shall not be held
            liable for any indirect, consequential, or special liability arising
            out of or in any way related to your use of this website.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
            5. Indemnification
          </h2>
          <p>
            You hereby indemnify to the fullest extent JewelsCart from and
            against any and/or all liabilities, costs, demands, causes of
            action, damages, and expenses arising in any way related to your
            breach of any of the provisions of these terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
            6. Governing Law & Jurisdiction
          </h2>
          <p>
            These terms will be governed by and interpreted in accordance with
            the laws of India. Any disputes arising out of or related to these
            terms, the website, or transactions through JewelsCart shall be
            subject to the exclusive jurisdiction of the competent courts in{" "}
            <strong>Mumbai, Maharashtra, India</strong>.
          </p>
        </section>

        <section className="border-t border-stone-200 pt-8 space-y-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 md:text-2xl lining-nums">
            7. Inquiries & Legal Notices
          </h2>
          <p>
            If you have questions regarding these Terms of Service or need
            assistance with an order, please visit our{" "}
            <Link href="/contact" className="text-gold hover:underline">
              Contact Page
            </Link>
            .
          </p>
          <p className="text-stone-600 text-sm">
            For statutory consumer grievance escalations under the Consumer
            Protection (E-Commerce) Rules, 2020, please refer to our Grievance
            Officer details on our{" "}
            <Link
              href="/policy"
              className="text-gold hover:underline font-medium"
            >
              Policies Page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
