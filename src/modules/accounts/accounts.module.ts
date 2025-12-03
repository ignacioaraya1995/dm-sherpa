import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [AccountsController, UsersController],
  providers: [AccountsService, UsersService],
  exports: [AccountsService, UsersService],
})
export class AccountsModule {}
