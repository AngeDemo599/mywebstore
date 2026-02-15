import { ContentBlock } from "@/types/content-blocks";

interface BlockRendererProps {
  blocks?: ContentBlock[];
  html?: string;
  textColor?: string;
  primaryColor?: string;
}

export default function BlockRenderer({ blocks, html, textColor, primaryColor }: BlockRendererProps) {
  // New format: HTML string from Tiptap
  if (html) {
    return (
      <div
        className="rich-content prose prose-sm sm:prose max-w-none"
        style={{ color: textColor }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Legacy format: ContentBlock array
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <RenderBlock key={block.id} block={block} textColor={textColor} primaryColor={primaryColor} />
      ))}
    </div>
  );
}

function RenderBlock({
  block,
  textColor,
  primaryColor,
}: {
  block: ContentBlock;
  textColor?: string;
  primaryColor?: string;
}) {
  switch (block.type) {
    case "text": {
      const Tag = block.heading || "p";
      const sizeClass =
        block.heading === "h2"
          ? "text-xl sm:text-2xl font-bold mb-1"
          : block.heading === "h3"
            ? "text-lg sm:text-xl font-semibold mb-1"
            : block.heading === "h4"
              ? "text-base sm:text-lg font-medium mb-0.5"
              : "text-sm sm:text-base";
      return (
        <Tag
          className={`${sizeClass} leading-relaxed`}
          style={{ textAlign: block.align || "left", color: textColor }}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    }

    case "image": {
      const widthClass =
        block.size === "small"
          ? "w-full sm:w-1/2"
          : block.size === "medium"
            ? "w-full sm:w-3/4"
            : "w-full";
      return (
        <figure className={`${widthClass} mx-auto`}>
          <img
            src={block.url}
            alt={block.alt || ""}
            className="rounded-lg w-full object-cover"
            loading="lazy"
          />
          {block.caption && (
            <figcaption
              className="text-xs sm:text-sm mt-2 text-center"
              style={{ opacity: 0.6, color: textColor }}
            >
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "list": {
      if (block.style === "numbered") {
        return (
          <ol className="list-decimal list-inside space-y-1.5 text-sm sm:text-base" style={{ color: textColor }}>
            {block.items.filter(Boolean).map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ol>
        );
      }
      if (block.style === "check") {
        return (
          <ul className="space-y-1.5 text-sm sm:text-base" style={{ color: textColor }}>
            {block.items.filter(Boolean).map((item, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill={primaryColor || "#10b981"}
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base" style={{ color: textColor }}>
          {block.items.filter(Boolean).map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      );
    }

    case "divider":
      return (
        <hr
          className={`border-t-2 my-2 ${
            block.style === "dashed"
              ? "border-dashed"
              : block.style === "dotted"
                ? "border-dotted"
                : ""
          }`}
          style={{ borderColor: primaryColor ? primaryColor + "30" : "#e5e7eb" }}
        />
      );

    case "spacer":
      return (
        <div
          style={{
            height: block.height === "small" ? 16 : block.height === "large" ? 48 : 32,
          }}
        />
      );

    case "video": {
      const ytId = getYouTubeId(block.url);
      if (!ytId) return null;
      return (
        <div>
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              className="w-full h-full"
              allowFullScreen
              loading="lazy"
              title={block.caption || "Video"}
            />
          </div>
          {block.caption && (
            <p className="text-xs sm:text-sm mt-2 text-center" style={{ opacity: 0.6, color: textColor }}>
              {block.caption}
            </p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
