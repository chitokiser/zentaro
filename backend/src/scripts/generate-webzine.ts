import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AiWriterService } from '../ai-writer/ai-writer.service';

async function bootstrap() {
    console.log('Bootstrapping NestJS application context...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const aiWriterService = app.get(AiWriterService);
    console.log('Triggering new AI webzine post generation...');

    try {
        const result = await aiWriterService.generateOne();
        if (result) {
            console.log('Successfully generated webzine post:');
            console.log('ID:', result.id);
        } else {
            console.log('No webzine post generated (check API keys or logs).');
        }
    } catch (error) {
        console.error('Error generating webzine post:', error);
    } finally {
        console.log('Waiting 8 seconds for background cross-posting to finish...');
        await new Promise((resolve) => setTimeout(resolve, 8000));
        console.log('Closing NestJS context.');
        await app.close();
        process.exit(0);
    }
}

bootstrap().catch((err) => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
});
