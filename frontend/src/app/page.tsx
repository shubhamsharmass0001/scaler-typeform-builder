/**
 * page.tsx — Temporary landing page
 *
 * This is a placeholder that confirms the frontend is running correctly.
 * It will be replaced with the real dashboard/home page in a later prompt.
 *
 * It intentionally shows the stack info so you can verify everything loaded:
 * - Inter font (check the rendered text looks clean and geometric)
 * - Tailwind utilities + custom theme tokens
 * - Brand colors
 */

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1a1826] px-6 text-white">
      {/* Logo mark — two squares, Typeform-style */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-md bg-white" />
          <div className="h-7 w-4 rounded-md bg-white/40" />
        </div>
        <span className="text-2xl font-semibold tracking-tight">FormCraft</span>
      </div>

      {/* Headline */}
      <h1 className="mb-4 text-center text-5xl font-bold leading-tight tracking-tight">
        Your favorite forms.<br />
        <span className="text-purple-400">Now being built.</span>
      </h1>

      {/* Subtitle */}
      <p className="mb-10 max-w-md text-center text-lg text-white/60">
        Skeleton is live. Next.js + TypeScript + Tailwind + Inter font — all
        wired up and ready for development.
      </p>

      {/* Status badge */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70">
        <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
        Frontend running on{" "}
        <code className="font-mono text-white">localhost:3000</code>
      </div>

      {/* Tech stack pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {[
          "Next.js 14",
          "TypeScript",
          "Tailwind CSS",
          "framer-motion",
          "@dnd-kit",
          "sonner",
          "@tanstack/query",
          "lucide-react",
        ].map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
          >
            {tech}
          </span>
        ))}
      </div>
    </main>
  );
}
