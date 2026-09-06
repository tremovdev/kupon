import Link from "next/link";
import type { NextPage } from "next";
import { GuillochePattern } from "~~/components/GuillochePattern";

const Home: NextPage = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden py-16 px-4">
      {/* Background Guilloche Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <GuillochePattern variant="seal" width={600} height={600} color="emerald" />
      </div>

      <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded border border-kupon-gold/50 bg-kupon-ivory text-xs font-mono tracking-widest text-kupon-emerald uppercase">
          <span className="w-2 h-2 rounded-full bg-kupon-gold animate-pulse"></span>
          Fictional SBN Ritel 2027 · Onchain
        </div>

        <h1 className="text-4xl md:text-6xl font-serif font-bold text-kupon-ink tracking-tight mb-4 max-w-2xl leading-tight">
          The retail bond that enforces its own rules.
        </h1>

        <p className="text-lg md:text-xl text-kupon-ink/80 max-w-2xl font-sans mb-8">
          Kupon is the fictional SBN Ritel 2027 tokenized as a compliance-gated asset. Every transfer is checked against
          three onchain rules — and reverts name the rule.
        </p>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <Link
            href="/app"
            className="btn btn-primary px-8 font-sans font-medium tracking-wide text-kupon-ivory certificate-border-emerald"
          >
            Launch Investor App →
          </Link>
          <Link
            href="/debugger"
            className="btn btn-outline border-kupon-gold text-kupon-ink hover:bg-kupon-gold/10 font-sans"
          >
            View Debugger
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
