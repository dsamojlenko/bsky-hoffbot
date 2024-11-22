import { login } from '../bsky/auth';
import { likeMentions } from '../hoffbot/likeMentions';

(async () => {
  const bot = await login();

  await likeMentions(bot);

  process.exit(0);
})();