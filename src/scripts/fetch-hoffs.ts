import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

const downloadDir = path.join(__dirname, '../../hoffpics');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

async function fetchImageUrls(
  query: string,
  numImages: number,
): Promise<string[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
  console.log(url);
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const imageUrls = new Set<string>();

  $('img').each((_, img) => {
    if (imageUrls.size < numImages) {
      const src = $(img).parent().attr('href');
      if (src && !imageUrls.has(src) && src.startsWith('/imgres?imgurl=')) {
        const fullSizeUrl = new URLSearchParams(src.split('?')[1]).get(
          'imgurl',
        );
        if (fullSizeUrl && fullSizeUrl.startsWith('http')) {
          imageUrls.add(fullSizeUrl);
        }
      }
    }
  });

  return Array.from(imageUrls);
}

async function downloadImage(url: string, filepath: string) {
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function downloadHoffImages() {
  const query = 'David Hasselhoff';
  const numImages = 100;
  const imageUrls = await fetchImageUrls(query, numImages);

  for (const [index, url] of imageUrls.entries()) {
    const filepath = path.join(downloadDir, `hoff_${index + 1}.jpg`);
    await downloadImage(url, filepath);
    console.log(`Downloaded ${filepath}`);
  }
}

downloadHoffImages().catch(console.error);
