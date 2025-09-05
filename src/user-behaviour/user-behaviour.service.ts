import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBehaviours } from './entities/userBehaviour.entity';
import { Repository } from 'typeorm';
import { string } from 'joi';

@Injectable()
export class UserBehaviourService {

      constructor(
        @InjectRepository(UserBehaviours) private userBehaviourRepo: Repository<UserBehaviours>, // Inject your repository
      ) {}

    async  createUserBehaviour(data:UserBehaviours){
        try{
          const behaviour =await this.userBehaviourRepo.insert(data)
          console.log(behaviour)
        return behaviour
      }catch(error){
        console.log(error)
      }
    }
    async latestPersonalizedBehaviour(userId:string){
        try{
           const userBehavior = await this.userBehaviourRepo.find({
    where: { user:{id:userId} },
    order: { created_at: 'DESC' },
    take: 5,  // Limit to the last 5 behaviors
  });

        return userBehavior
      }catch(error){
        console.log(error)
      }
      }
    async latestBehaviour(userId:string){
        try{
           const userBehavior = await this.userBehaviourRepo.findOne({
    where: { user:{id:userId} },
    order: { created_at: 'DESC' },
  });

        return userBehavior
      }catch(error){
        console.log(error)
      }
      }

       combineBehaviors(userId: string) {
    return this.latestPersonalizedBehaviour(userId).then((behaviors) => {
      let aggregatedSearchTerms: string[] = [];
      let aggregatedCategories: string[] = [];
      let aggregatedBrand: string[] = [];
      let aggregatedPriceRanges: string[] = [];

      behaviors.forEach((behavior) => {
        if (behavior.search) aggregatedSearchTerms.push(behavior.search);
        if (behavior.category) aggregatedCategories.push(behavior.category);
        if (behavior.brand) aggregatedBrand.push(behavior.brand);
        if (behavior.price) aggregatedPriceRanges.push(behavior.price);
      });

      return {
        searchTerms: [...new Set(aggregatedSearchTerms)],  // Remove duplicates
        categories: [...new Set(aggregatedCategories)],
        brand: [...new Set(aggregatedBrand)],
        priceRanges: [...new Set(aggregatedPriceRanges)],
      };
    });
}
}