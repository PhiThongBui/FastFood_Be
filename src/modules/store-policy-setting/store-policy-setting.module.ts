import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StorePolicySetting } from '@/models';
import { StorePolicySettingController } from './store-policy-setting.controller';
import { StorePolicySettingService } from './store-policy-setting.service';

@Module({
    controllers: [StorePolicySettingController],
    providers: [StorePolicySettingService],
    imports: [SequelizeModule.forFeature([StorePolicySetting])],
    exports: [StorePolicySettingService],
})
export class StorePolicySettingModule { }
