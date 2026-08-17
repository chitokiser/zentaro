import {
  Body,
  Controller,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiCocktailService } from './ai-cocktail.service';
import { GenerateCocktailDto } from './dto/generate-cocktail.dto';

@Controller('ai-cocktail')
export class AiCocktailController {
  constructor(private readonly aiCocktail: AiCocktailService) {}

  // Tighter than the global 60/min baseline — each request costs a real LLM
  // API call, and this endpoint is unauthenticated/public-facing.
  @Post('generate')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async generate(@Body() dto: GenerateCocktailDto) {
    const recipe = await this.aiCocktail.generateRecipe(dto);
    if (!recipe) {
      throw new ServiceUnavailableException(
        'AI recipe generation is not available right now.',
      );
    }
    return recipe;
  }
}
