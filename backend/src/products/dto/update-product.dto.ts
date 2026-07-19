import { PartialType } from '@nestjs/mapped-types';
import { CreateDirectProductDto } from './create-direct-product.dto';

export class UpdateProductDto extends PartialType(CreateDirectProductDto) {}
