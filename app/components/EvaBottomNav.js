"use client";

// EVA Bottom Nav - ONLY Discover + Chat
// Discover LEFT = we dey build am now
// Chat RIGHT = placeholder for connect like WhatsApp, coming soon

export default function EvaBottomNav({ onOpenDiscover, onOpenChat }) {
  return (
    <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between items-center z-30 pointer-events-none">
      
      {/* LEFT - DISCOVER */}
      <button
        onClick={onOpenDiscover}
        className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur border border-white/20 text-white text-[13px] px-4 py-2 rounded-full"
      >
        ✨ Discover
      </button>

      {/* RIGHT - CHAT (placeholder for now) */}
      <button
        onClick={onOpenChat}
        className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur border border-white/20 text-white text-[13px] px-4 py-2 rounded-full"
      >
        💬 Chat
      </button>

    </div>
  );
}
