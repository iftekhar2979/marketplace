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
  console.log("Job Processing");
  console.time()
  const images = job.data;
  const projectRoot =  path.join(__dirname, "..","..","..","..",'public');// go back to project root
  const outputDir = path.join(projectRoot, "uploads");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const imgUrl of images) {
    const absoluteInputPath = path.join(projectRoot, imgUrl); // make absolute
    const outputImagePath = path.join(projectRoot, path.basename(imgUrl)); // overwrite with same name
      const tempPath = absoluteInputPath + ".tmp";
    try {
      await sharp(absoluteInputPath)
        .resize(800, 800)
        .toFile(tempPath);
      fs.renameSync(tempPath, absoluteInputPath);
      console.log(`Image replaced successfully: ${outputImagePath}`);
      console.timeEnd()
    } catch (err) {
      console.error(`Error processing image: ${absoluteInputPath}`, err);
    }
  }
}

}
