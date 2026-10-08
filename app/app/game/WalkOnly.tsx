"use client";

import { useState } from "react";
import { WalkScene } from "./WalkScene";

// The walk on its own, without a call: walk the street as long as you like,
// then start over from the original background.
export function WalkOnly() {
  const [run, setRun] = useState(0);
  const [arrived, setArrived] = useState(false);
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-black">
      {!arrived && <WalkScene key={run} onArrive={() => setArrived(true)} endless />}
      {arrived && (
        <div className="call-ending vn-fade">
          <div className="font-vn text-4xl">🌸</div>
          <p className="font-vn text-2xl text-white">You made it to the mall.</p>
          <div className="flex gap-3">
            <button className="vn-choice !w-48" onClick={() => { setArrived(false); setRun((r) => r + 1); }}>
              Walk again
            </button>
            <a className="vn-choice !w-48" href="/">Play the game</a>
          </div>
        </div>
      )}
    </main>
  );
}
