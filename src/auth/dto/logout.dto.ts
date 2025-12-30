import { IsEmail, IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
