// Follow back anyone that follows the hoffbot

import { BskyAgent } from '@atproto/api';
import { login, agent } from '../bsky/auth';

const getFollowers = async (agent: BskyAgent) => {
  const { data } = await agent.api.app.bsky.graph.getFollowers({
    actor: 'hoffbot.bsky.social',
  });

  return data.followers.map((follower) => follower.did);
};

const getFollows = async (agent: BskyAgent) => {
  const { data } = await agent.api.app.bsky.graph.getFollows({
    actor: 'hoffbot.bsky.social',
  });

  return data.follows.map((follow) => follow.did);
};

export const followBack = async () => {
  await login();

  const followers = await getFollowers(agent);
  const follows = await getFollows(agent);

  const toFollow = followers.filter((follower) => !follows.includes(follower));

  for (const did of toFollow) {
    console.log(`Following ${did}`);
    await agent.follow(did);
  }
}
