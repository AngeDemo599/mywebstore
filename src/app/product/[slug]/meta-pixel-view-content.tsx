"use client";
import { useEffect, useRef } from "react";
import { trackPixelEvent } from "@/components/meta-pixel";

export default function MetaPixelViewContent({
  pixelId,
  contentName,
  contentId,
  contentCategory,
  value,
}: {
  pixelId: string | null;
  contentName: string;
  contentId: string;
  contentCategory: string | null;
  value: number | null;
}) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!pixelId || hasFired.current) return;
    hasFired.current = true;
    trackPixelEvent("ViewContent", {
      content_name: contentName,
      content_ids: [contentId],
      content_type: "product",
      ...(contentCategory ? { content_category: contentCategory } : {}),
      ...(value != null ? { value, currency: "DZD" } : {}),
    });
  }, [pixelId, contentName, contentId, contentCategory, value]);

  return null;
}
