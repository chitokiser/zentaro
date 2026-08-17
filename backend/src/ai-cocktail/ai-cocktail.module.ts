import { Module } from '@nestjs/common';
import { AiCocktailController } from './ai-cocktail.controller';
import { AiCocktailService } from './ai-cocktail.service';

@Module({
  controllers: [AiCocktailController],
  providers: [AiCocktailService],
})
export class AiCocktailModule {}
