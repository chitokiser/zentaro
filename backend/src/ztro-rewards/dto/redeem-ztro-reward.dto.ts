import { IsString, Matches } from 'class-validator';

export class RedeemZtroRewardDto {
  // Reward codes are generated as randomBytes(5).toString('hex').toUpperCase()
  // (10 hex chars). Constraining the shape here turns a malformed value
  // (e.g. a client accidentally passing the full QR URL instead of just the
  // code) into a clean 400 instead of it reaching Firestore's .doc(code)
  // and crashing with an "invalid resource path" 500.
  @IsString()
  @Matches(/^[A-Za-z0-9]{1,32}$/, { message: '유효하지 않은 QR 코드입니다.' })
  code: string;
}
