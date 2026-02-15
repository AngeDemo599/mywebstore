"use client";

import { useState, useEffect } from "react";

interface ShareButtonsProps {
  title: string;
  primaryColor: string;
}

export default function ShareButtons({ title, primaryColor }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const href = window.location.href;
    // Use requestAnimationFrame to avoid direct setState in effect body
    requestAnimationFrame(() => setUrl(href));
  }, []);

  const text = encodeURIComponent(`Check out: ${title}`);
  const encodedUrl = encodeURIComponent(url);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${text}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#25D366" }}
          title="Share on WhatsApp"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#1877F2" }}
          title="Share on Facebook"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>

        {/* Messenger */}
        <a
          href={`https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=0&redirect_uri=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#0099FF" }}
          title="Send via Messenger"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/>
          </svg>
        </a>

        {/* QR Code */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#333" }}
          title="Show QR Code"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="3" height="3" />
            <path d="M21 14h-3v3h3v4h-4v-4h-3v4" />
          </svg>
        </button>

        {/* Copy Link */}
        <button
          onClick={copyLink}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: primaryColor }}
          title={copied ? "Copied!" : "Copy link"}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          )}
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900 mb-1">Scan to view product</h3>
            <p className="text-xs text-gray-500 mb-4">{title}</p>
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-lg"
            />
            <p className="text-xs text-gray-400 mt-3">Point your camera at this code</p>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
