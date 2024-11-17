import { PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

export type Author = {
  did: string;
  handle: string;
  displayName: string;
};

export type DbPost = {
  uri: string;
  text: string;
  authorDid: string;
  authorHandle: string;
  authorDisplayName: string;
};

export type FeedPost = PostView & {
  uri: string;
  record: Record;
  author: Author;
};

export type Interaction = {
  type: 'like' | 'comment';
  post: DbPost;
};

export type Record = {
  text: string;
};
