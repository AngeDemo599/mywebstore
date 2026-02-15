export type BlockType = "text" | "image" | "list" | "divider" | "spacer" | "video";

export interface TextBlock {
  id: string;
  type: "text";
  content: string; // HTML content with formatting
  align?: "left" | "center" | "right";
  heading?: "h2" | "h3" | "h4";
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  caption?: string;
  alt?: string;
  size?: "small" | "medium" | "full"; // small=50%, medium=75%, full=100%
}

export interface ListBlock {
  id: string;
  type: "list";
  style: "bullet" | "numbered" | "check";
  items: string[];
}

export interface DividerBlock {
  id: string;
  type: "divider";
  style?: "solid" | "dashed" | "dotted";
}

export interface SpacerBlock {
  id: string;
  type: "spacer";
  height: "small" | "medium" | "large"; // 16px, 32px, 48px
}

export interface VideoBlock {
  id: string;
  type: "video";
  url: string; // YouTube or direct URL
  caption?: string;
}

export type ContentBlock =
  | TextBlock
  | ImageBlock
  | ListBlock
  | DividerBlock
  | SpacerBlock
  | VideoBlock;

export function generateBlockId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function createDefaultBlock(type: BlockType): ContentBlock {
  const id = generateBlockId();
  switch (type) {
    case "text":
      return { id, type: "text", content: "" };
    case "image":
      return { id, type: "image", url: "", caption: "" };
    case "list":
      return { id, type: "list", style: "bullet", items: [""] };
    case "divider":
      return { id, type: "divider", style: "solid" };
    case "spacer":
      return { id, type: "spacer", height: "medium" };
    case "video":
      return { id, type: "video", url: "", caption: "" };
  }
}

// FREE users can use these block types
export const FREE_BLOCK_TYPES: BlockType[] = ["text", "image", "list", "divider", "spacer"];

// PRO users get all block types
export const PRO_BLOCK_TYPES: BlockType[] = ["text", "image", "list", "divider", "spacer", "video"];

export const BLOCK_LABELS: Record<BlockType, string> = {
  text: "Text",
  image: "Image",
  list: "List",
  divider: "Divider",
  spacer: "Spacer",
  video: "Video",
};

export const BLOCK_ICONS: Record<BlockType, string> = {
  text: "Type",
  image: "Image",
  list: "List",
  divider: "Minus",
  spacer: "MoveVertical",
  video: "Play",
};
