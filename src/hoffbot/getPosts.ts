import { Bot } from "@skyware/bot";
import dotenv from 'dotenv';

dotenv.config();

const HOFFBOT_DID = process.env.HOFFBOT_DID;

if (!HOFFBOT_DID) {
  throw new Error('HOFFBOT_DID is not set');
}

export const getPosts = async (bot: Bot) => {
  const response = await bot.getUserPosts(HOFFBOT_DID);
  for (const post of response.posts) {
    console.log({
      id: post.cid,
      text: post.text,
      embed: post.embed,
      createdAt: post.createdAt
    });
  }
}