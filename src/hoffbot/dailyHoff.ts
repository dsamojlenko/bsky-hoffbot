import fs from 'fs';
import path from 'path';
import { login } from '../bsky/auth';
import util from 'util';

const readFile = util.promisify(fs.readFile);

const getRandomQuote = (): string => {
  const quotesPath = path.resolve('./resources/quotes.txt');
  const quotes = fs.readFileSync(quotesPath, 'utf-8').split('\n');
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return `"${quotes[randomIndex]}"`;
};

const getRandomImage = async (): Promise<Blob> => {
  const imagesPath = path.resolve('./resources/hoffpics');
  const images = fs.readdirSync(imagesPath);
  const randomImageIndex = Math.floor(Math.random() * images.length);
  const randomImage = images[randomImageIndex];

  const buffer = await readFile(path.resolve(imagesPath, randomImage));
  const ext = path.extname(randomImage).toLowerCase();

  let imageType = 'image/jpeg';
  if (ext === '.webp') {
    imageType = 'image/webp';
  } else if (ext === '.avif') {
    imageType = 'image/avif';
  }

  const blob = new Blob([buffer], { type: imageType });

  return blob;
};

export const dailyHoff = async () => {
  const quote = getRandomQuote();
  const image = await getRandomImage();

  login()
    .then(async (bot) => {
      await bot.post({
        text: quote,
        images: [
          {
            data: image,
            alt: 'The Hoff',
          },
        ],
      });
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      process.exit();
    });
};
