import { ViduApp } from "../ViduApp";
import { SetupRequired } from "../SetupRequired";

export const dynamic = "force-dynamic";

// The template's debug console: persona, voice and reference tools.
export default function DevPage() {
  return process.env.REACTOR_API_KEY ? <ViduApp /> : <SetupRequired />;
}
