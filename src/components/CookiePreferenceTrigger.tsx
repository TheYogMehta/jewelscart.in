"use client";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export function CookiePreferenceTrigger({
  className = "text-gold underline underline-offset-2 font-medium hover:text-gold-light cursor-pointer transition",
  children = "cookie preference modal",
}: Props) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jc:open-cookie-modal"));
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
