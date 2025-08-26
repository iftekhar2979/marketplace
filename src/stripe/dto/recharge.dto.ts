import { IsNumber, IsNumberString, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class RechargeDto{
    @IsNumber()
    @Min(30,{message:"Minimum 30 Pounds required"})
    @Max(10000,{message:"Maximum 10000 recharge possible"})
    amount: number
    @IsString()
    @MinLength(5,{message:"Transection Id should has minimum 5 charachters"})
    @MaxLength(15,{message:"Transection Id should has Maximum 15 charachters"})
    transectionId: string
    @IsString()
    paymentMethod: 'stripe' | 'revenuecat'
}