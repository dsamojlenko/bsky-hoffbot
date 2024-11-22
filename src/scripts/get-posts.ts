import { login } from "../bsky/auth";
import { getPosts } from "../hoffbot/getPosts";

(async () => {
  const bot = await login();

  await getPosts(bot);

  process.exit(0);
})();
