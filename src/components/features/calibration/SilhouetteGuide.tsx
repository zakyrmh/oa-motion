export function SilhouetteGuide() {
  return (
    <div className="relative w-64 h-80 rounded-[32px] border-4 border-dashed border-[#d1ffca] flex flex-col items-center justify-center p-4 bg-[#d1ffca]/5 backdrop-blur-[2px] animate-pulse">
      {/* Side-Profile SVG Silhouette Graphic */}
      <svg
        viewBox="0 0 100 160"
        fill="none"
        stroke="#d1ffca"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-36 h-56 opacity-80"
        aria-hidden="true"
      >
        {/* Head */}
        <circle cx="50" cy="22" r="12" className="fill-[#d1ffca]/20" />
        {/* Torso Side View */}
        <path d="M48 34 C44 50, 42 75, 46 95" />
        {/* Front Leg & Knee */}
        <path d="M46 95 L56 125 L50 152" />
        {/* Back Leg */}
        <path d="M46 95 L40 125 L44 152" strokeDasharray="3 3" />
        {/* Arm Side Bend */}
        <path d="M48 42 L58 60 L48 78" />
        {/* Knee Landmark Highlight */}
        <circle cx="56" cy="125" r="5" fill="#fff100" stroke="#000000" strokeWidth="2" />
      </svg>

      {/* Corner Frame Markers */}
      <div className="absolute top-2 left-2 size-4 border-t-4 border-l-4 border-[#d1ffca]" />
      <div className="absolute top-2 right-2 size-4 border-t-4 border-r-4 border-[#d1ffca]" />
      <div className="absolute bottom-2 left-2 size-4 border-b-4 border-l-4 border-[#d1ffca]" />
      <div className="absolute bottom-2 right-2 size-4 border-b-4 border-r-4 border-[#d1ffca]" />
    </div>
  );
}
