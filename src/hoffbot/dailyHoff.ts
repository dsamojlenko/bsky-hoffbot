import fs from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';
import { Bot } from '@skyware/bot';
import { Logger } from '../utils/logger';
import { retry } from '../utils/helpers';

const usedQuotesPath = path.resolve('./logs/usedQuotes.log');
const usedImagesPath = path.resolve('./logs/usedImages.log');

const getRandomQuote = (): string => {
  try {
    const quotesPath = path.resolve('./resources/quotes.txt');
    
    if (!fs.existsSync(quotesPath)) {
      throw new Error(`Quotes file not found at ${quotesPath}`);
    }

    const quotesContent = fs.readFileSync(quotesPath, 'utf-8').trim();
    if (!quotesContent) {
      throw new Error('Quotes file is empty');
    }

    const quotes = quotesContent.split('\n').filter(quote => quote.trim() !== '');
    if (quotes.length === 0) {
      throw new Error('No valid quotes found in quotes file');
    }

    let usedQuotes: string[] = [];
    
    // Safely read used quotes
    if (fs.existsSync(usedQuotesPath)) {
      try {
        const usedContent = fs.readFileSync(usedQuotesPath, 'utf-8').trim();
        usedQuotes = usedContent ? usedContent.split('\n').filter(quote => quote.trim() !== '') : [];
      } catch (error) {
        Logger.warn('Could not read used quotes file, starting fresh', error);
        usedQuotes = [];
      }
    }

    // Reset usedQuotes if all quotes have been used
    if (usedQuotes.length >= quotes.length) {
      usedQuotes = [];
      try {
        fs.writeFileSync(usedQuotesPath, '');
        Logger.info('Reset used quotes - all quotes have been used');
      } catch (error) {
        Logger.error('Failed to reset used quotes file', error);
      }
    }

    let randomQuote: string;
    let attempts = 0;
    const maxAttempts = quotes.length * 2; // Prevent infinite loops

    do {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      randomQuote = quotes[randomIndex];
      attempts++;
      
      if (attempts > maxAttempts) {
        Logger.warn('Could not find unused quote, using random quote');
        break;
      }
    } while (usedQuotes.includes(randomQuote));

    // Record the used quote
    try {
      fs.appendFileSync(usedQuotesPath, `${randomQuote}\n`);
    } catch (error) {
      Logger.error('Failed to record used quote', error);
    }

    return `"${randomQuote}"`;
  } catch (error) {
    Logger.error('Error getting random quote', error);
    // Fallback quote
    return '"Sometimes you just have to be bold and brave!" - The Hoff';
  }
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
  try {
    const imagesPath = path.resolve('./resources/hoffpics');
    
    if (!fs.existsSync(imagesPath)) {
      throw new Error(`Images directory not found at ${imagesPath}`);
    }

    const images = fs.readdirSync(imagesPath).filter(file => {
      const ext = getFileExtension(file);
      return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
    });

    if (images.length === 0) {
      throw new Error('No valid image files found in images directory');
    }

    let usedImages: string[] = [];
    
    // Safely read used images
    if (fs.existsSync(usedImagesPath)) {
      try {
        const usedContent = fs.readFileSync(usedImagesPath, 'utf-8').trim();
        usedImages = usedContent ? usedContent.split('\n').filter(img => img.trim() !== '') : [];
      } catch (error) {
        Logger.warn('Could not read used images file, starting fresh', error);
        usedImages = [];
      }
    }

    // Reset usedImages if all images have been used
    if (usedImages.length >= images.length) {
      usedImages = [];
      try {
        fs.writeFileSync(usedImagesPath, '');
        Logger.info('Reset used images - all images have been used');
      } catch (error) {
        Logger.error('Failed to reset used images file', error);
      }
    }

    let randomImage: string;
    let attempts = 0;
    const maxAttempts = images.length * 2; // Prevent infinite loops

    do {
      const randomImageIndex = Math.floor(Math.random() * images.length);
      randomImage = images[randomImageIndex];
      attempts++;
      
      if (attempts > maxAttempts) {
        Logger.warn('Could not find unused image, using random image');
        break;
      }
    } while (usedImages.includes(randomImage));

    // Record the used image
    try {
      fs.appendFileSync(usedImagesPath, `${randomImage}\n`);
    } catch (error) {
      Logger.error('Failed to record used image', error);
    }

    const imagePath = path.resolve(imagesPath, randomImage);
    const buffer = await readFile(imagePath);
    const ext = getFileExtension(randomImage);
    const imageType = getImageType(ext);

    // Convert Buffer to Uint8Array for better compatibility
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: imageType });

    Logger.debug(`Selected image: ${randomImage} (${imageType})`);
    return blob;
  } catch (error) {
    Logger.error('Error getting random image', error);
    throw new Error(`Failed to get random image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const dailyHoff = async (bot: Bot) => {
  try {
    Logger.info('Starting daily Hoff post...');
    
    const quote = getRandomQuote();
    const image = await getRandomImage();

    Logger.info('Posting daily Hoff', {
      quote,
      imageSize: image.size,
      imageType: image.type,
    });
    
    await retry(
      async () => {
        return bot.post({
          text: quote,
          images: [
            {
              data: image,
              alt: 'The Hoff',
            },
          ],
        });
      },
      {
        maxAttempts: 3,
        delay: 2000,
        backoff: 'exponential',
        onError: (error, attempt) => {
          Logger.warn(`Daily Hoff post attempt ${attempt} failed`, error);
        }
      }
    );
    
    Logger.info('Daily Hoff posted successfully');
  } catch (error) {
    Logger.error('Failed to post daily Hoff', error);
    throw error;
  }
};
