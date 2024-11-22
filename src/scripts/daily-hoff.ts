import { login } from "../bsky/auth";
import { dailyHoff } from "../hoffbot/dailyHoff";

(async () => {
  const bot = await login();

  await dailyHoff(bot);

  process.exit(0);
})();
