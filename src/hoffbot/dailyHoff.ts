import fs from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';
import { Bot } from '@skyware/bot';

const usedQuotesPath = path.resolve('./logs/usedQuotes.log');
const usedImagesPath = path.resolve('./logs/usedImages.log');

const getRandomQuote = (): string => {
  const quotesPath = path.resolve('./resources/quotes.txt');
  const quotes = fs.readFileSync(quotesPath, 'utf-8').split('\n');
  let usedQuotes = fs.existsSync(usedQuotesPath) ? fs.readFileSync(usedQuotesPath, 'utf-8').split('\n') : [];

  // Reset usedQuotes if all quotes have been used
  if (usedQuotes.length >= quotes.length) {
    usedQuotes = [];
    fs.writeFileSync(usedQuotesPath, '');
  }

  let randomQuote;
  do {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    randomQuote = quotes[randomIndex];
  } while (usedQuotes.includes(randomQuote));

  fs.appendFileSync(usedQuotesPath, `${randomQuote}\n`);
  return `"${randomQuote}"`;
};

const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
}

const getImageType = (ext: string): string => {
  let imageType = 'image/jpeg';
  if (ext === '.webp') {
    imageType = 'image/webp';
  } else if (ext === '.avif') {
    imageType = 'image/avif';
  }

  return imageType;
}

const getRandomImage = async (): Promise<Blob> => {
  const imagesPath = path.resolve('./resources/hoffpics');
  const images = fs.readdirSync(imagesPath);
  let usedImages = fs.existsSync(usedImagesPath) ? fs.readFileSync(usedImagesPath, 'utf-8').split('\n') : [];

  // Reset usedImages if all images have been used
  if (usedImages.length >= images.length) {
    usedImages = [];
    fs.writeFileSync(usedImagesPath, '');
  }

  let randomImage;
  do {
    const randomImageIndex = Math.floor(Math.random() * images.length);
    randomImage = images[randomImageIndex];
  } while (usedImages.includes(randomImage));

  fs.appendFileSync(usedImagesPath, `${randomImage}\n`);

  const buffer = await readFile(path.resolve(imagesPath, randomImage));
  const ext = getFileExtension(randomImage);
  const imageType = getImageType(ext);

  const blob = new Blob([buffer], { type: imageType });

  return blob;
};

export const dailyHoff = async (bot: Bot) => {
  const quote = getRandomQuote();
  const image = await getRandomImage();

  console.log({
    image,
    quote,
  });
  
  await bot.post({
    text: quote,
    images: [
      {
        data: image,
        alt: 'The Hoff',
      },
    ],
  });
};
