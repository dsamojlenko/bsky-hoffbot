import { login } from "../bsky/auth"
import dotenv from 'dotenv';

dotenv.config();

const HOFFBOT_DID = process.env.HOFFBOT_DID;

if (!HOFFBOT_DID) {
  throw new Error('HOFFBOT_DID is not set');
}

export const getPosts = async () => {
  login().then(async (bot) => {
    const response = await bot.getUserPosts(HOFFBOT_DID);
    for (const post of response.posts) {
      console.log({
        id: post.cid,
        text: post.text,
        embed: post.embed,
        createdAt: post.createdAt
      });
    }
  }).catch((err) => {
    console.error(err);
  }).finally(() => {
    process.exit();
  });
}