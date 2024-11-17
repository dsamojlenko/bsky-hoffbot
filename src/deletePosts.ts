import { AtUri } from '@atproto/api';
import { login, agent } from './bsky/auth';

login().then(async () => {
  const params = {
    repo: 'hoffbot.bsky.social',
    collection: 'app.bsky.feed.post',
    limit: 100,
  };
  const posts = await agent.com.atproto.repo.listRecords(params);

  let deletes = [];
  for (const record of posts.data.records) {
    const uri = new AtUri(record.uri);

    deletes.push({
      $type: 'com.atproto.repo.applyWrites#delete',
      collection: 'app.bsky.feed.post',
      rkey: uri.rkey,
    });
  }
  const resp = await agent.com.atproto.repo.applyWrites({
    repo: 'hoffbot.bsky.social',
    writes: deletes,
  });
});
