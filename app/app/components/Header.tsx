import Image from "next/image";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900/40 px-4 py-3 lg:px-6">
      <div className="min-w-0">
        <h1 className="text-base font-semibold tracking-tight">
          桜メモリー Sakura Memories Live
        </h1>
        <p className="hidden text-xs text-zinc-500 sm:block">
          The heroines of a 2023 visual novel, live on a video call.
        </p>
      </div>
      <span className="shrink-0">
        <Image
          src="/brand/reactor-symbol-white.svg"
          alt="Reactor"
          width={512}
          height={362}
          className="h-6 w-auto sm:hidden"
        />
        <Image
          src="/brand/reactor-logo-white.png"
          alt="Reactor"
          width={1600}
          height={184}
          className="hidden h-auto w-36 sm:block"
        />
      </span>
    </header>
  );
}
