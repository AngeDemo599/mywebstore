"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Resizable Image Node View Component ─── */

function ResizableImageComponent({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const width = node.attrs.width || 0; // 0 means auto/100%

  const onResizeRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    startX.current = e.clientX;
    startWidth.current = containerRef.current?.offsetWidth || 300;
  }, []);

  useEffect(() => {
    if (!resizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(100, startWidth.current + diff);
      updateAttributes({ width: newWidth });
    };

    const onMouseUp = () => {
      setResizing(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizing, updateAttributes]);

  return (
    <NodeViewWrapper className="relative my-2">
      <div
        ref={containerRef}
        className={`group relative inline-block mx-auto ${selected ? "ring-2 ring-indigo-400 ring-offset-2" : ""}`}
        style={{
          width: width ? `${width}px` : "100%",
          maxWidth: "100%",
          display: "block",
          margin: "0 auto",
        }}
      >
        {/* Drag handle - visible on hover and when selected */}
        <div
          data-drag-handle
          draggable="true"
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] cursor-grab active:cursor-grabbing transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="4" cy="2" r="1" /><circle cx="8" cy="2" r="1" />
            <circle cx="4" cy="6" r="1" /><circle cx="8" cy="6" r="1" />
            <circle cx="4" cy="10" r="1" /><circle cx="8" cy="10" r="1" />
          </svg>
          Drag to move
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          title={node.attrs.title || undefined}
          className="rounded-lg w-full h-auto block"
          draggable={false}
        />

        {/* Resize handles - visible when selected */}
        {selected && (
          <>
            {/* Right edge handle */}
            <div
              onMouseDown={onResizeRight}
              className="absolute top-1/2 -right-2 -translate-y-1/2 w-1.5 h-12 bg-indigo-500 rounded-full cursor-ew-resize shadow-md z-10 hover:bg-indigo-600 hover:w-2 transition-all"
            />
            {/* Left edge handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setResizing(true);
                startX.current = e.clientX;
                startWidth.current = containerRef.current?.offsetWidth || 300;
                const onMouseMove = (ev: MouseEvent) => {
                  const diff = startX.current - ev.clientX;
                  const newWidth = Math.max(100, startWidth.current + diff);
                  updateAttributes({ width: newWidth });
                };
                const onMouseUp = () => {
                  setResizing(false);
                  document.removeEventListener("mousemove", onMouseMove);
                  document.removeEventListener("mouseup", onMouseUp);
                };
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
              }}
              className="absolute top-1/2 -left-2 -translate-y-1/2 w-1.5 h-12 bg-indigo-500 rounded-full cursor-ew-resize shadow-md z-10 hover:bg-indigo-600 hover:w-2 transition-all"
            />

            {/* Width indicator */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
              {width ? `${Math.round(width)}px` : "auto"}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/* ─── Custom Resizable Image Extension ─── */

export const ResizableImage = Node.create({
  name: "image",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: 0,
        parseHTML: (element) => {
          const width = element.getAttribute("data-width") || element.style.width;
          return width ? parseInt(width, 10) || 0 : 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            "data-width": attributes.width,
            style: `width: ${attributes.width}px`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes({ class: "rounded-lg max-w-full mx-auto" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

});
