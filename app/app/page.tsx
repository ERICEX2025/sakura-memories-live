import { Game } from "./game/Game";
import { SetupRequired } from "./SetupRequired";

export const dynamic = "force-dynamic";

export default function Page() {
  return process.env.REACTOR_API_KEY ? <Game /> : <SetupRequired />;
}
