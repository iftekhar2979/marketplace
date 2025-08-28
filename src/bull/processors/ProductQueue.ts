import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
const sharp = require("sharp")
import * as fs from 'fs';  // File system module to write images to disk
import * as path from 'path';  // Path module for handling file paths

@Processor('product')  // Processor listening to 'ProductQueue'
@Injectable()
export class ImageProcessor {
  @Process('Product-image')  // Listen for jobs of type 'Product-image'
  async handleImageJob(job: Job) {
    const images = job.data;  
    console.log(images)
    const outputDir = path.join(__dirname, 'processed-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);  
    }
    for (const imgUrl of images) {
      const outputImagePath = path.join(outputDir, `processed_${path.basename(imgUrl)}`);

      // Use sharp to resize or process the image
      await sharp(imgUrl)
        .resize(300, 300)  // Resize image to 300x300 (example)
        .toFile(outputImagePath, async (err, info) => {
          if (err) {
            console.error(`Error processing image: ${imgUrl}`, err);
            return;
          }

          console.log(`Image processed successfully: ${outputImagePath}`, info);

        });
    }
  }
}
