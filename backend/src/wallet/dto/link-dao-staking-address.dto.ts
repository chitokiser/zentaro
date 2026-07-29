import { IsEthereumAddress, IsString, MinLength } from 'class-validator';

export class LinkDaoStakingAddressDto {
  @IsEthereumAddress()
  address: string;

  @IsString()
  @MinLength(1)
  signature: string;
}
