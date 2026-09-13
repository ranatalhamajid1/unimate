import React from "react";
import Image from "next/image";
import Link from "next/link";

export type BrandLogoVariant = "full" | "horizontal" | "icon" | "lockup";
export type BrandLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  alt?: string;
  href?: string;
}

const SIZES = {
  icon: {
    xs: { width: 22, height: 22 },
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  },
  lockup: {
    xs: { iconSize: 22, textClass: "text-[14px]" },
    sm: { iconSize: 28, textClass: "text-[16px]" },
    md: { iconSize: 36, textClass: "text-[18px]" },
    lg: { iconSize: 44, textClass: "text-[22px]" },
    xl: { iconSize: 56, textClass: "text-[28px]" },
  },
  horizontal: {
    xs: { width: 70, height: 24 },
    sm: { width: 85, height: 29 },
    md: { width: 105, height: 36 },
    lg: { width: 130, height: 44 },
    xl: { width: 165, height: 56 },
  },
  full: {
    xs: { width: 48, height: 48 },
    sm: { width: 64, height: 64 },
    md: { width: 96, height: 96 },
    lg: { width: 128, height: 128 },
    xl: { width: 160, height: 160 },
  },
};

export function BrandLogo({
  variant = "lockup",
  size = "sm",
  className = "",
  priority = false,
  alt = "UniMate",
  href,
}: BrandLogoProps) {
  let content: React.ReactNode;

  if (variant === "lockup") {
    const config = SIZES.lockup[size];
    content = (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <span
          className="relative inline-flex items-center justify-center shrink-0"
          style={{ width: config.iconSize, height: config.iconSize }}
        >
          <Image
            src="/brand/icon-mark-transparent.png"
            alt=""
            width={config.iconSize}
            height={config.iconSize}
            priority={priority}
            className="h-full w-full object-contain"
          />
        </span>
        <span className={`font-semibold tracking-tight text-[var(--color-text)] ${config.textClass}`}>
          UniMate
        </span>
      </span>
    );
  } else {
    const dims = SIZES[variant][size];
    let src = "/brand/logo-horizontal-transparent.png";
    if (variant === "icon") {
      src = "/brand/icon-mark-transparent.png";
    } else if (variant === "full") {
      src = "/brand/logo-full-transparent.png";
    }

    content = (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: dims.width, height: dims.height }}
      >
        <Image
          src={src}
          alt={alt}
          width={dims.width}
          height={dims.height}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
