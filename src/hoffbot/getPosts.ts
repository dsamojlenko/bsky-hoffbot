import { login, agent } from "../bsky/auth"
import dotenv from 'dotenv';

dotenv.config();

const HOFFBOT_AT = process.env.HOFFBOT_AT;

if (!HOFFBOT_AT) {
  throw new Error('HOFFBOT_AT is not set');
}

export const getPosts = async () => {
  login().then(async () => {
    const posts = await agent.getAuthorFeed({
      actor: HOFFBOT_AT,
    })

    for (const post of posts.data.feed) {
      console.log(post);
    }
  })
}