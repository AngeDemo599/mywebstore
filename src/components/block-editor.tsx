"use client";

import { Extension } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImage } from "@/components/resizable-image";
import LinkExt from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useCallback, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Heading2,
  Heading3,
  Minus,
  Undo2,
  Redo2,
  Play,
  Highlighter,
  Palette,
  Type,
  ChevronDown,
} from "lucide-react";

/* ─── Custom Font Size Extension ─── */

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, string | null>) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "" },
  { label: "Large", value: "18px" },
  { label: "XL", value: "20px" },
  { label: "2XL", value: "24px" },
  { label: "3XL", value: "30px" },
  { label: "4XL", value: "36px" },
];

interface BlockEditorProps {
  content: string;
  onChange: (html: string) => void;
  isPro: boolean;
  onImageUpload: (file: File) => Promise<string | null>;
}

export default function BlockEditor({ content, onChange, isPro, onImageUpload }: BlockEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      UnderlineExt,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#005bd3] underline" },
      }),
      ResizableImage,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Start writing your product description...",
      }),
      Youtube.configure({
        HTMLAttributes: { class: "rounded-lg overflow-hidden mx-auto" },
        width: 0,
        height: 0,
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontSize,
    ],
    content: content || "",
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        if (files?.length) {
          const file = files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      const url = await onImageUpload(file);
      if (url) {
        editor.chain().focus().insertContent({ type: "image", attrs: { src: url } }).run();
      }
      setUploading(false);
    },
    [editor, onImageUpload]
  );

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const addYouTube = () => {
    const url = prompt("Paste a YouTube URL:");
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("Enter URL:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  if (!editor) return null;

  const colors = ["#000000", "#374151", "#dc2626", "#ea580c", "#d97706", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
  const highlightColors = ["#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fecdd3", "#fed7aa"];

  return (
    <div className="border border-[#e3e3e3] rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-[#e3e3e3] bg-[#f7f7f7] px-2 py-1.5 flex flex-wrap items-center gap-0.5">
        {/* Undo / Redo */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Text type */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph") && !editor.isActive("heading")}
          title="Normal text"
        >
          <Type className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Subheading"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>

        {/* Font size dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowFontSize(!showFontSize); setShowColorPicker(false); setShowHighlightPicker(false); }}
            title="Font size"
            className="flex items-center gap-0.5 px-1.5 py-1 rounded text-xs text-[#616161] hover:bg-[#f1f1f1] hover:text-[#303030] transition-colors"
          >
            {(() => {
              const currentSize = editor.getAttributes("textStyle").fontSize;
              const match = FONT_SIZES.find(s => s.value === currentSize);
              return match ? match.label : "Normal";
            })()}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFontSize && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e3e3e3] rounded-lg shadow-card py-1 min-w-[120px]">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => {
                    if (size.value) {
                      editor.chain().focus().setMark("textStyle", { fontSize: size.value }).run();
                    } else {
                      editor.chain().focus().unsetMark("textStyle").run();
                    }
                    setShowFontSize(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 transition-colors ${
                    (editor.getAttributes("textStyle").fontSize === size.value || (!editor.getAttributes("textStyle").fontSize && !size.value))
                      ? "bg-[#f1f1f1] text-[#303030] font-[550]"
                      : "text-[#303030]"
                  }`}
                  style={{ fontSize: size.value || "14px" }}
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Inline formatting */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Text color */}
        <div className="relative">
          <ToolbarBtn
            onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setShowFontSize(false); }}
            title="Text color"
          >
            <Palette className="w-4 h-4" />
          </ToolbarBtn>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e3e3e3] rounded-lg shadow-card p-2 flex gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                  className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                className="w-6 h-6 rounded-full border-2 border-dashed border-[#8a8a8a] text-[10px] text-[#616161] hover:border-[#303030]"
              >
                x
              </button>
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <ToolbarBtn
            onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setShowFontSize(false); }}
            active={editor.isActive("highlight")}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarBtn>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e3e3e3] rounded-lg shadow-card p-2 flex gap-1">
              {highlightColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightPicker(false); }}
                  className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                className="w-6 h-6 rounded-full border-2 border-dashed border-[#8a8a8a] text-[10px] text-[#616161] hover:border-[#303030]"
              >
                x
              </button>
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Link */}
        <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Add link">
          <Link className="w-4 h-4" />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link"
          >
            <Unlink className="w-4 h-4" />
          </ToolbarBtn>
        )}

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Divider */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          <Minus className="w-4 h-4" />
        </ToolbarBtn>

        {/* Image */}
        <ToolbarBtn onClick={addImage} disabled={uploading} title="Add image">
          {uploading ? (
            <div className="w-4 h-4 border-2 border-[#303030] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Image className="w-4 h-4" />
          )}
        </ToolbarBtn>

        {/* YouTube (PRO only) */}
        {isPro ? (
          <ToolbarBtn onClick={addYouTube} title="Embed YouTube video">
            <Play className="w-4 h-4" />
          </ToolbarBtn>
        ) : (
          <ToolbarBtn disabled title="YouTube (PRO only)">
            <Play className="w-4 h-4" />
          </ToolbarBtn>
        )}
      </div>

      {/* Bubble menu - appears on text selection */}
      {editor && (
        <BubbleMenu editor={editor} className="bg-gray-900 rounded-lg shadow-xl px-1 py-0.5 flex items-center gap-0.5">
          <BubbleBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
          >
            <Bold className="w-3.5 h-3.5" />
          </BubbleBtn>
          <BubbleBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
          >
            <Italic className="w-3.5 h-3.5" />
          </BubbleBtn>
          <BubbleBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
          >
            <Underline className="w-3.5 h-3.5" />
          </BubbleBtn>
          <BubbleBtn onClick={setLink} active={editor.isActive("link")}>
            <Link className="w-3.5 h-3.5" />
          </BubbleBtn>
        </BubbleMenu>
      )}

      {/* Editor area */}
      <div onClick={() => editor.chain().focus().run()} className="cursor-text">
        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageFile(f);
          e.target.value = "";
        }}
      />

      {/* Editor styles */}
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .tiptap {
          outline: none;
        }
        .tiptap h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .tiptap p {
          margin-bottom: 0.5rem;
        }
        .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap li {
          margin-bottom: 0.25rem;
        }
        .tiptap blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
        .tiptap hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1rem 0;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem auto;
          display: block;
        }
        .tiptap a {
          color: #005bd3;
          text-decoration: underline;
        }
        .tiptap mark {
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
        }
        .tiptap code {
          background-color: #f3f4f6;
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-size: 0.875rem;
        }
        .tiptap pre {
          background-color: #1f2937;
          color: #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 0.5rem;
          overflow-x: auto;
        }
        .tiptap pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .tiptap div[data-youtube-video] {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          margin: 0.5rem 0;
          border-radius: 0.5rem;
        }
        .tiptap div[data-youtube-video] iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}

/* ─── Toolbar Button ─── */
function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[#f1f1f1] text-[#303030]"
          : disabled
            ? "text-[#8a8a8a] cursor-not-allowed"
            : "text-[#616161] hover:bg-[#f1f1f1] hover:text-[#303030]"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Toolbar Divider ─── */
function ToolbarDivider() {
  return <div className="w-px h-5 bg-[#e3e3e3] mx-0.5" />;
}

/* ─── Bubble Menu Button ─── */
function BubbleBtn({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? "text-white bg-gray-700" : "text-gray-300 hover:text-white hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
