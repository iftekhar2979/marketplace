import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
const sharp = require("sharp")
import * as fs from 'fs';  // File system module to write images to disk
import * as path from 'path';  // Path module for handling file paths

@Processor('behaviour')  // Processor listening to 'ProductQueue'
@Injectable()
export class UserBehaviour {
 

}
