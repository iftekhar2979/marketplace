import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
const sharp = require("sharp")
import * as fs from 'fs';  // File system module to write images to disk
import * as path from 'path';  // Path module for handling file paths
import { InjectRepository } from '@nestjs/typeorm';
import { UserBehaviour } from './BehaviourQueue';
import { Repository } from 'typeorm';
import { UserBehaviours } from 'src/user-behaviour/entities/userBehaviour.entity';
import { UserBehaviourService } from 'src/user-behaviour/user-behaviour.service';

@Processor('product')  // Processor listening to 'ProductQueue'
@Injectable()
export class ImageProcessor {
constructor(
  private readonly userBehaviourService:UserBehaviourService
){}
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
@Process('user-behaviour')
async userBehaviour(job:Job){
  console.log("User Behavior",job.data)
  try{
    if(job.data.search || job.data.category || job.data.brand){
      await this.userBehaviourService.createUserBehaviour(job.data)

    }

  }catch(error){
    console.log(error)
  }
}
}
