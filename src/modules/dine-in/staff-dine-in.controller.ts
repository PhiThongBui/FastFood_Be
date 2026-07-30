import { Body, Controller, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RolesGuard } from '@/common/guards/role.guards';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { DINE_IN_PERMISSIONS } from '@/common/constants/permissions.constant';
import { ENUMROLE } from '@/models';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { DineInService } from './dine-in.service';
import {
    DineInAddItemDto,
    PayTableSessionDto,
    StaffOpenTableSessionDto,
    SubmitKitchenTicketDto,
    UpdateKitchenTicketStatusDto,
} from './dto/dine-in.dto';

@Controller('staff/dine-in')
@UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
@Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
@ApiBearerAuth('access-token')
export class StaffDineInController {
    constructor(private readonly dineInService: DineInService) {}

    @Post('sessions')
    @Permissions(DINE_IN_PERMISSIONS.ORDER_CREATE, DINE_IN_PERMISSIONS.TABLE_MANAGE)
    @ApiOperation({ summary: 'Staff opens or gets active dine-in table session' })
    openSession(@Body() dto: StaffOpenTableSessionDto, @Req() req: any) {
        return this.dineInService.openStaffSession(dto, req.user);
    }

    @Post('sessions/:sessionId/items')
    @Permissions(DINE_IN_PERMISSIONS.ORDER_CREATE)
    @ApiOperation({ summary: 'Staff adds item to dine-in table session' })
    addItem(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Body() dto: DineInAddItemDto,
        @Req() req: any,
    ) {
        return this.dineInService.addStaffItem(sessionId, dto, req.user);
    }

    @Post('sessions/:sessionId/submit-ticket')
    @Permissions(DINE_IN_PERMISSIONS.ORDER_CREATE)
    @ApiOperation({ summary: 'Staff submits dine-in cart items as a kitchen ticket' })
    submitTicket(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Body() dto: SubmitKitchenTicketDto,
        @Req() req: any,
    ) {
        return this.dineInService.submitStaffTicket(sessionId, dto, req.user);
    }

    @Patch('kitchen-tickets/:id/status')
    @Permissions(DINE_IN_PERMISSIONS.ORDER_CREATE)
    @ApiOperation({ summary: 'Staff updates kitchen ticket status' })
    updateTicketStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateKitchenTicketStatusDto,
        @Req() req: any,
    ) {
        return this.dineInService.updateKitchenTicketStatus(id, dto.status, req.user);
    }

    @Post('sessions/:sessionId/pay')
    @Permissions(DINE_IN_PERMISSIONS.PAYMENT_CONFIRM)
    @ApiOperation({ summary: 'Staff starts or confirms dine-in table payment' })
    paySession(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Body() dto: PayTableSessionDto,
        @Req() req: any,
    ) {
        return this.dineInService.payTableSession(sessionId, dto, req.user);
    }
}
