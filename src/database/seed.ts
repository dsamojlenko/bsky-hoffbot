import db from './db';
import * as fs from 'fs';
import * as xml2js from 'xml2js';

export const seedDatabase = async () => {
  const parser = new xml2js.Parser();
  fs.readFile('feeds.opml', (err, data) => {
    if (err) {
      console.error('Could not read feeds.opml file', err);
      return;
    }
    parser.parseString(data, (err, result) => {
      if (err) {
        console.error('Could not parse feeds.opml file', err);
        return;
      }
      const feeds = result.opml.body[0].outline[0].outline;
      const createdAt = new Date().toISOString();
      const updatedAt = createdAt;
      feeds.forEach((feed: any) => {
        const title = feed.$.title;
        const url = feed.$.xmlUrl;
        db.serialize(() => {
          db.get(
            `SELECT COUNT(*) AS count FROM feeds WHERE url = ?`,
            [url],
            (err, row: { count: number }) => {
              if (err) {
                console.error('Could not check for existing feed', err);
              } else if (row.count === 0) {
                db.run(
                  `INSERT INTO feeds (title, url, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
                  [title, url, createdAt, updatedAt],
                  (err) => {
                    if (err) {
                      console.error('Could not insert feed', err);
                    } else {
                      console.log(`Feed inserted: ${title}`);
                    }
                  },
                );
              } else {
                console.log(`Feed already exists: ${title}`);
              }
            },
          );
        });
      });
    });
  });
};
