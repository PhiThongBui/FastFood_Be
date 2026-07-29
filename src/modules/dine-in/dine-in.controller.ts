import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { DineInService } from './dine-in.service';
import { DineInAddItemDto, SubmitKitchenTicketDto } from './dto/dine-in.dto';

@Controller('dine-in')
export class DineInController {
    constructor(private readonly dineInService: DineInService) {}

    @Get('qr/:tableToken')
    @ApiOperation({ summary: 'Get dining table by QR token' })
    getQrTable(@Param('tableToken') tableToken: string) {
        return this.dineInService.getQrTable(tableToken);
    }

    @Post('qr/:tableToken/session')
    @ApiOperation({ summary: 'Open or get active table session from QR token' })
    openSession(@Param('tableToken') tableToken: string) {
        return this.dineInService.openPublicSession(tableToken);
    }

    @Post('sessions/:sessionId/items')
    @ApiOperation({ summary: 'Add item to public dine-in table session' })
    addItem(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Body() dto: DineInAddItemDto,
    ) {
        return this.dineInService.addPublicItem(sessionId, dto);
    }

    @Get('sessions/:sessionId/preview')
    @ApiOperation({ summary: 'Preview current dine-in table bill and pending cart' })
    getPreview(@Param('sessionId', ParseIntPipe) sessionId: number) {
        return this.dineInService.getSessionPreview(sessionId);
    }

    @Post('sessions/:sessionId/submit-ticket')
    @ApiOperation({ summary: 'Submit public dine-in cart items as a kitchen ticket' })
    submitTicket(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Body() dto: SubmitKitchenTicketDto,
    ) {
        return this.dineInService.submitPublicTicket(sessionId, dto);
    }
}
