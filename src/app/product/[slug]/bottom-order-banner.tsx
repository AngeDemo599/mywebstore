"use client";

import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StoreStyle } from "@/types/store";
import { getStyleClasses } from "@/lib/theme";

interface BottomOrderBannerProps {
  primaryColor: string;
  borderColor: string;
  price: number | null;
  storeStyle?: StoreStyle;
}

export default function BottomOrderBanner({ primaryColor, borderColor, price, storeStyle }: BottomOrderBannerProps) {
  const styleClasses = storeStyle ? getStyleClasses(storeStyle) : null;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mobileForm = document.getElementById("order-form-section");
    const desktopForm = document.getElementById("order-form-section-desktop");

    const observer = new IntersectionObserver(
      (entries) => {
        // Show banner when NONE of the form sections are visible
        const anyVisible = entries.some((entry) => entry.isIntersecting);
        setVisible(!anyVisible);
      },
      { threshold: 0.1 }
    );

    if (mobileForm) observer.observe(mobileForm);
    if (desktopForm) observer.observe(desktopForm);
    return () => observer.disconnect();
  }, []);

  const scrollToForm = () => {
    const formEl =
      document.getElementById("order-form-section") ||
      document.getElementById("order-form-section-desktop");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "rgba(0, 0, 0, 0.1) 0px -4px 30px 0px",
        borderTop: `1px solid ${borderColor}`,
        transition: "opacity 0.35s, visibility 0.35s",
      }}
    >
      <button
        type="button"
        onClick={scrollToForm}
        style={{
          width: "100%",
          maxWidth: 400,
          textAlign: "center" as const,
          height: 52,
          fontSize: 15,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          transition: "0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          ...(styleClasses ? {
            ...styleClasses.buttonStyle,
            fontWeight: 700,
          } : {
            backgroundColor: primaryColor,
            border: `2px solid ${borderColor}`,
            color: "#ffffff",
            borderRadius: 10,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.45px",
            boxShadow: "rgba(0, 0, 0, 0.14) 0px 6px 18px 0px",
          }),
        }}
      >
        <ShoppingBag size={18} />
        {price != null ? `Order Now - ${formatPrice(price)}` : "Order Now"}
      </button>
    </div>
  );
}
