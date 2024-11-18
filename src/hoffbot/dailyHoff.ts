import fs from 'fs';
import path from 'path';
import { login, agent } from '../bsky/auth';
import { BskyAgent } from '@atproto/api';
import sharp from 'sharp';
import util from 'util';

const readFile = util.promisify(fs.readFile);

const getRandomQuote = (): string => {
  const quotesPath = path.resolve(__dirname, '../../resources/quotes.txt');
  const quotes = fs.readFileSync(quotesPath, 'utf-8').split('\n');
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

const getRandomImage = async () => {
  const imagesPath = path.resolve(__dirname, '../../resources/hoffpics');
  const images = fs.readdirSync(imagesPath);
  const randomImageIndex = Math.floor(Math.random() * images.length);
  const randomImage = images[randomImageIndex];

  let buffer = await readFile(path.resolve(imagesPath, randomImage));

  if (buffer.byteLength > 1024 * 1024) {
    buffer = await resizeImage(buffer);
  }

  let imageType = 'image/jpeg';
  const ext = path.extname(randomImage).toLowerCase();
  if (ext === '.webp') {
    imageType = 'image/webp';
  } else if (ext === '.avif') {
    imageType = 'image/avif';
  }

  return {
    data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    type: imageType,
  };
};

async function resizeImage(buffer: Buffer): Promise<Buffer> {
  let newSize = 0.9; // Start with 90% of original size
  let outputBuffer = buffer;
  const image = sharp(buffer);

  const metadata = await image.metadata();

  if (!metadata.width) {
    throw new Error('Could not read image metadata');
  }

  // We'll try to reduce the image size by 10% in each iteration until the image is under 1MB
  while (outputBuffer.byteLength > 976.56 * 1024) {
    const newWidth = Math.round(metadata.width * newSize);

    outputBuffer = await image
      .rotate() // Correct image rotation based on EXIF data
      .resize(newWidth)
      .jpeg()
      .toBuffer();

    newSize -= 0.1; // Decrease the target size by 10%
  }

  return outputBuffer;
}

const preparePost = async (
  quote: string,
  image: Uint8Array,
  imageType: string,
  agent: BskyAgent,
) => {
  let testUpload;

  try {
    testUpload = await agent.uploadBlob(image, {
      encoding: imageType,
    });
  } catch (e) {
    console.error('Error uploading image', e);
    return;
  }

  const post = {
    text: `"${quote}"`,
    embed: {
      $type: 'app.bsky.embed.images',
      images: [
        {
          $type: 'blob',
          alt: 'The Hoff',
          image: testUpload.data.blob,
        },
      ],
    },
    createdAt: new Date().toISOString(),
  };

  return post;
};

export const dailyHoff = async () => {
  const quote = getRandomQuote();
  const image = await getRandomImage();

  login().then(async () => {
    const post = await preparePost(quote, image.data, image.type, agent);
    if (!post) {
      console.log('problemo');
      return;
    }
    console.log(post);
    await agent.post(post);
  });
};
