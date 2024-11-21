import { likeMentions } from '../hoffbot/likeMentions';

likeMentions().then(() => {
  console.log('Done liking mentions');
  process.exit(0);
});