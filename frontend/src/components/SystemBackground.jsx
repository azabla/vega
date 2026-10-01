export const SystemBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">

      {/* Base */}
      <div className="absolute inset-0 bg-[#2f3e46]" />

      {/* Soft radial light */}
      <div
        className="
          absolute
          left-1/2
          top-0
          -translate-x-1/2
          h-[900px]
          w-[900px]
          rounded-full
          bg-cyan-400/5
          blur-[180px]
        "
      />

      {/* Grid */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.035]
          [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)]
          [background-size:72px_72px]
        "
      />

      {/* Top fade */}
      <div
        className="
          absolute
          inset-x-0
          top-0
          h-48
          bg-gradient-to-b
          from-black/20
          to-transparent
        "
      />

      {/* Bottom fade */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-72
          bg-gradient-to-t
          from-black/30
          to-transparent
        "
      />

    </div>
  );
};