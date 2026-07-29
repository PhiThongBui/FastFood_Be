import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/role.guards';
import { ENUMROLE } from '@/models';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { DineInService } from './dine-in.service';
import { CreateDiningTableDto, UpdateDiningTableDto } from './dto/dining-table.dto';

@Controller('dining-tables')
@UseGuards(JWTGuard, RolesGuard)
@Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
@ApiBearerAuth('access-token')
export class DiningTableController {
    constructor(private readonly dineInService: DineInService) {}

    @Get()
    @ApiOperation({ summary: 'List dining tables' })
    listTables(@Req() req: any) {
        return this.dineInService.listDiningTables(req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create dining table' })
    createTable(@Body() dto: CreateDiningTableDto, @Req() req: any) {
        return this.dineInService.createDiningTable(dto, req.user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update dining table' })
    updateTable(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDiningTableDto,
        @Req() req: any,
    ) {
        return this.dineInService.updateDiningTable(id, dto, req.user);
    }

    @Post(':id/regenerate-qr')
    @ApiOperation({ summary: 'Regenerate dining table QR token' })
    regenerateQr(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.dineInService.regenerateDiningTableQr(id, req.user);
    }
}
