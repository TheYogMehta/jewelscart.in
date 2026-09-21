import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-stone-600">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-gold px-6 py-3 text-sm font-medium text-white hover:bg-gold-light"
      >
        Back to home
      </Link>
    </div>
  );
}
