import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ENUMROLE } from '@/models';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RolesGuard } from '@/common/guards/role.guards';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { STORE_POLICY_PERMISSIONS } from '@/common/constants/permissions.constant';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { UpdateStorePolicySettingDto } from './dto/update-store-policy-setting.dto';
import { StorePolicySettingService } from './store-policy-setting.service';

@Controller('store-policy-settings')
export class StorePolicySettingController {
    constructor(private readonly storePolicySettingService: StorePolicySettingService) { }

    @Get()
    @ApiOperation({ summary: 'Get store policy settings' })
    getPublicSetting() {
        return this.storePolicySettingService.getSetting();
    }

    @UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
    @Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
    @Permissions(STORE_POLICY_PERMISSIONS.VIEW)
    @Get('admin')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get store policy settings for admin' })
    getAdminSetting() {
        return this.storePolicySettingService.getSetting();
    }

    @UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
    @Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
    @Permissions(STORE_POLICY_PERMISSIONS.UPDATE)
    @Patch('admin')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update store policy settings' })
    updateAdminSetting(@Body() dto: UpdateStorePolicySettingDto) {
        return this.storePolicySettingService.updateSetting(dto);
    }
}
