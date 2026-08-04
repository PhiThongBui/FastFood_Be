import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
    CartItems,
    Carts,
    DiningTable,
    DINING_TABLE_STATUS,
    ENUMROLE,
    KitchenTicket,
    KITCHEN_TICKET_SOURCE,
    KITCHEN_TICKET_STATUS,
    Order,
    ORDERTYPE,
    ORDERSTATUS,
    PAYMENTMETHOD,
    PAYMENTSTATUS,
    TableSession,
    TABLE_SESSION_STATUS,
    User,
} from '@/models';
import { DINE_IN_PERMISSIONS } from '@/common/constants/permissions.constant';
import { Helper } from '@/utils/helper';
import { CartItemService } from '../cart-item/cart-item.service';
import { CartPreviewService } from '../cart-preview/cart-preview.service';
import { OrderItemSnapshotService } from '../order-item-snapshot/order-item-snapshot.service';
import { RedisService } from '../redis/redis.service';
import { SepayService } from '../sepay/sepay.service';
import { CreateDiningTableDto, UpdateDiningTableDto } from './dto/dining-table.dto';
import { DineInAddItemDto, PayTableSessionDto, StaffOpenTableSessionDto, SubmitKitchenTicketDto } from './dto/dine-in.dto';

type StaffActor = {
    uid?: number;
    role?: string;
};

@Injectable()
export class DineInService {
    constructor(
        @InjectModel(DiningTable) private readonly diningTableModel: typeof DiningTable,
        @InjectModel(TableSession) private readonly tableSessionModel: typeof TableSession,
        @InjectModel(KitchenTicket) private readonly kitchenTicketModel: typeof KitchenTicket,
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(CartItems) private readonly cartItemsModel: typeof CartItems,
        @InjectModel(Carts) private readonly cartsModel: typeof Carts,
        @InjectModel(User) private readonly userModel: typeof User,
        private readonly cartItemService: CartItemService,
        private readonly cartPreviewService: CartPreviewService,
        private readonly orderItemSnapshotService: OrderItemSnapshotService,
        private readonly redisService: RedisService,
        private readonly sepayService: SepayService,
        private readonly sequelize: Sequelize,
    ) {}

    async listDiningTables(actor?: StaffActor) {
        if (actor) {
            await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.ORDER_CREATE, DINE_IN_PERMISSIONS.TABLE_MANAGE);
        }

        const tables = await this.diningTableModel.findAll({
            include: [this.buildActiveSessionInclude()],
            order: [['area', 'ASC'], ['code', 'ASC']],
        });

        return {
            items: tables.map((table) => this.mapDiningTable(table)),
        };
    }

    async createDiningTable(dto: CreateDiningTableDto, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.TABLE_MANAGE);

        const table = await this.diningTableModel.create({
            code: dto.code.trim(),
            name: dto.name.trim(),
            area: dto.area?.trim() || null,
            status: dto.status || DINING_TABLE_STATUS.AVAILABLE,
            qrToken: this.generateToken('tbl'),
        } as DiningTable);

        return this.mapDiningTable(table);
    }

    async updateDiningTable(id: number, dto: UpdateDiningTableDto, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.TABLE_MANAGE);

        const table = await this.diningTableModel.findByPk(id);
        if (!table) throw new NotFoundException('Dining table not found');

        await table.update({
            ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.area !== undefined ? { area: dto.area?.trim() || null } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
        });

        return this.mapDiningTable(table);
    }

    async regenerateDiningTableQr(id: number, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.TABLE_MANAGE);

        const table = await this.diningTableModel.findByPk(id);
        if (!table) throw new NotFoundException('Dining table not found');

        await table.update({ qrToken: this.generateToken('tbl') });
        return this.mapDiningTable(table);
    }

    async getQrTable(tableToken: string) {
        const table = await this.findTableByToken(tableToken);
        const activeSession = await this.findActiveSessionByTableId(Number(table.id));

        return {
            table: this.mapDiningTable(table),
            activeSession: activeSession ? this.mapTableSession(activeSession) : null,
        };
    }

    async openPublicSession(tableToken: string) {
        const table = await this.findTableByToken(tableToken);
        return this.openTableSession(Number(table.id), null);
    }

    async openStaffSession(dto: StaffOpenTableSessionDto, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.ORDER_CREATE);
        return this.openTableSession(dto.tableId, Number(actor.uid));
    }

    async addPublicItem(sessionId: number, dto: DineInAddItemDto) {
        const session = await this.getOpenSession(sessionId);
        const cart = session.dataValues.cart || session.cart;
        return this.cartItemService.addToCart({
            ...dto,
            sessionId: cart.dataValues.sessionId,
        });
    }

    async addStaffItem(sessionId: number, dto: DineInAddItemDto, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.ORDER_CREATE);
        return this.addPublicItem(sessionId, dto);
    }

    async getSessionPreview(sessionId: number) {
        const session = await this.getOpenSession(sessionId);
        const cartPreview = await this.cartPreviewService.getUserCartPreview(Number(session.dataValues.cartId));
        const order = await this.findSessionOrder(session);
        const pendingSubtotal = Number(cartPreview.data.totalAmount || 0);
        const submittedSubtotal = Number(order?.dataValues.subTotal || 0);
        const submittedDiscount = Number(order?.dataValues.discount || 0);

        return {
            tableSession: this.mapTableSession(session),
            submittedOrder: order ? this.mapDineInOrder(order) : null,
            pendingCart: cartPreview.data,
            subtotal: submittedSubtotal + pendingSubtotal,
            deliveryFee: 0,
            discount: submittedDiscount,
            finalTotal: submittedSubtotal + pendingSubtotal - submittedDiscount,
        };
    }

    async submitPublicTicket(sessionId: number, dto: SubmitKitchenTicketDto) {
        return this.submitTicket(sessionId, dto, KITCHEN_TICKET_SOURCE.QR, null);
    }

    async submitStaffTicket(sessionId: number, dto: SubmitKitchenTicketDto, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.ORDER_CREATE);
        return this.submitTicket(sessionId, dto, KITCHEN_TICKET_SOURCE.STAFF, Number(actor.uid));
    }

    async updateKitchenTicketStatus(ticketId: number, status: KITCHEN_TICKET_STATUS, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.ORDER_CREATE);

        const ticket = await this.kitchenTicketModel.findByPk(ticketId, {
            include: [TableSession, Order],
        });
        if (!ticket) throw new NotFoundException('Kitchen ticket not found');

        await ticket.update({ status });
        return this.mapKitchenTicket(ticket);
    }

    async payTableSession(sessionId: number, dto: PayTableSessionDto, actor: StaffActor) {
        await this.assertStaffPermission(actor, DINE_IN_PERMISSIONS.PAYMENT_CONFIRM);

        const session = await this.getOpenSession(sessionId);
        const order = await this.findSessionOrder(session);
        if (!order) throw new BadRequestException('Table session has no submitted order');

        const paymentMethod = this.normalizePaymentMethod(dto.paymentMethod);

        if (paymentMethod === PAYMENTMETHOD.SEPAY) {
            await order.update({
                paymentMethod,
                paymentStatus: PAYMENTSTATUS.PENDING,
            });
            await this.redisService.addPendingOrder(order.dataValues.orderNumber);

            const sepayPayment = await this.sepayService.createPayment({
                orderNumber: order.dataValues.orderNumber,
                amount: order.dataValues.finalTotal,
                orderInfo: `Thanh toán đơn hàng ${order.dataValues.orderNumber}`,
            });

            return {
                orderNumber: order.dataValues.orderNumber,
                orderId: order.dataValues.id,
                tableSessionId: session.dataValues.id,
                finalTotal: order.dataValues.finalTotal,
                paymentMethod,
                paymentInfo: {
                    qrCode: sepayPayment.qrDataURL,
                    bankAccount: sepayPayment.bankAccount,
                    bankName: sepayPayment.bankName,
                    accountName: sepayPayment.accountName,
                    transferContent: sepayPayment.transferContent,
                    amount: sepayPayment.amount,
                },
            };
        }

        await order.update({
            paymentMethod,
            paymentStatus: PAYMENTSTATUS.PAID,
            paidAt: new Date(),
        });
        await this.closeSession(session, Number(actor.uid));

        return {
            orderNumber: order.dataValues.orderNumber,
            orderId: order.dataValues.id,
            tableSessionId: session.dataValues.id,
            finalTotal: order.dataValues.finalTotal,
            paymentMethod,
            paymentStatus: PAYMENTSTATUS.PAID,
        };
    }

    async closePaidSessionForOrder(order: Order, transaction?: Transaction) {
        if (order.dataValues.orderType !== ORDERTYPE.DINE_IN || !order.dataValues.tableSessionId) return;

        const session = await this.tableSessionModel.findByPk(order.dataValues.tableSessionId, { transaction });
        if (!session || session.dataValues.status !== TABLE_SESSION_STATUS.OPEN) return;

        await this.closeSession(session, null, transaction);
    }

    private async submitTicket(
        sessionId: number,
        dto: SubmitKitchenTicketDto,
        source: KITCHEN_TICKET_SOURCE,
        createdByUserId: number | null,
    ) {
        const transaction = await this.sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        });

        try {
            const session = await this.getOpenSession(sessionId, transaction);
            const cartItemIds = await this.resolveCartItemIds(Number(session.dataValues.cartId), dto.cartItemIds, transaction);
            const hadOrder = !!session.dataValues.orderId;
            const cartPreview = await this.cartPreviewService.getUserCartPreview(Number(session.dataValues.cartId), cartItemIds);

            if (!cartPreview.data.items.length) {
                throw new BadRequestException('No valid cart items found for kitchen ticket');
            }

            const previewItemMap = new Map(cartPreview.data.items.map((item) => [Number(item.cartItemId), item]));
            const subtotal = Number(cartPreview.data.totalAmount || 0);
            const order = await this.getOrCreateDineInOrder(session, subtotal, transaction);
            const ticket = await this.kitchenTicketModel.create({
                tableSessionId: session.dataValues.id,
                orderId: order.dataValues.id,
                createdByUserId,
                ticketNumber: this.generateTicketNumber(Number(session.dataValues.id)),
                source,
                status: KITCHEN_TICKET_STATUS.NEW,
                notes: dto.notes || null,
            } as KitchenTicket, { transaction });

            const cartItems = await this.cartItemsModel.findAll({
                where: {
                    cartId: session.dataValues.cartId,
                    id: { [Op.in]: cartItemIds },
                },
                lock: transaction.LOCK.UPDATE,
                transaction,
            });

            if (!cartItems || cartItems.length !== cartItemIds.length) {
                throw new BadRequestException('No cart items found');
            }

            await this.orderItemSnapshotService.createOrderItemsFromCartItems(
                Number(order.dataValues.id),
                cartItems,
                previewItemMap,
                transaction,
                Number(ticket.dataValues.id),
            );

            await this.orderItemSnapshotService.clearCartItems(
                Number(session.dataValues.cartId),
                cartItemIds,
                transaction,
            );

            if (!hadOrder) {
                await session.update({ orderId: order.dataValues.id }, { transaction });
            } else {
                await order.increment({
                    subTotal: subtotal,
                    finalTotal: subtotal,
                }, { transaction });
            }

            await transaction.commit();

            await this.redisService.publishNewOrder({
                orderId: order.dataValues.id,
                orderNumber: order.dataValues.orderNumber,
                tableSessionId: session.dataValues.id,
                tableId: session.dataValues.tableId,
                kitchenTicketId: ticket.dataValues.id,
                source,
            });

            const [latestSession, latestOrder, latestTicket] = await Promise.all([
                this.tableSessionModel.findByPk(session.dataValues.id, { include: [DiningTable, Carts, Order] }),
                this.orderModel.findByPk(order.dataValues.id, { include: [KitchenTicket] }),
                this.kitchenTicketModel.findByPk(ticket.dataValues.id),
            ]);

            return {
                tableSession: this.mapTableSession(latestSession || session),
                order: this.mapDineInOrder(latestOrder || order),
                kitchenTicket: this.mapKitchenTicket(latestTicket || ticket),
            };
        } catch (error) {
            if (!(transaction as any).finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    private async getOrCreateDineInOrder(session: TableSession, subtotal: number, transaction: Transaction) {
        const existingOrder = await this.findSessionOrder(session, transaction);
        if (existingOrder) return existingOrder;

        const orderNumber = await Helper.generateOrderNumber();
        const order = await this.orderModel.create({
            orderNumber,
            orderType: ORDERTYPE.DINE_IN,
            userId: null,
            addressId: null,
            tableSessionId: session.dataValues.id,
            orderStatus: ORDERSTATUS.PREPARING,
            paymentMethod: PAYMENTMETHOD.CASH,
            paymentStatus: PAYMENTSTATUS.PENDING,
            subTotal: subtotal,
            deliveryFee: 0,
            discount: 0,
            finalTotal: subtotal,
            notes: null,
            momoTransId: null,
            momoRequestId: null,
            paidAt: null,
            cancelledReason: null,
        } as Order, { transaction });

        await session.update({ orderId: order.dataValues.id }, { transaction });
        return order;
    }

    private async openTableSession(tableId: number, openedByUserId: number | null) {
        const transaction = await this.sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        });

        try {
            const table = await this.diningTableModel.findByPk(tableId, {
                lock: transaction.LOCK.UPDATE,
                transaction,
            });
            if (!table) throw new NotFoundException('Dining table not found');
            if (table.dataValues.status === DINING_TABLE_STATUS.DISABLED) {
                throw new BadRequestException('Dining table is disabled');
            }

            const activeSession = await this.tableSessionModel.findOne({
                where: {
                    tableId,
                    status: TABLE_SESSION_STATUS.OPEN,
                },
                include: [DiningTable, Carts, Order],
                transaction,
            });
            if (activeSession) {
                await transaction.commit();
                return this.mapTableSession(activeSession);
            }

            const cart = await this.cartsModel.create({
                sessionId: this.generateToken('dinein'),
            } as Carts, { transaction });
            const session = await this.tableSessionModel.create({
                tableId,
                cartId: cart.dataValues.id,
                orderId: null,
                openedByUserId,
                closedByUserId: null,
                status: TABLE_SESSION_STATUS.OPEN,
                sessionToken: this.generateToken('sess'),
                closedAt: null,
            } as TableSession, { transaction });

            await table.update({ status: DINING_TABLE_STATUS.OCCUPIED }, { transaction });
            await transaction.commit();

            const reloaded = await this.tableSessionModel.findByPk(session.dataValues.id, {
                include: [DiningTable, Carts, Order],
            });
            return this.mapTableSession(reloaded || session);
        } catch (error) {
            if (!(transaction as any).finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    private async closeSession(session: TableSession, closedByUserId: number | null, transaction?: Transaction) {
        await session.update({
            status: TABLE_SESSION_STATUS.PAID,
            closedByUserId,
            closedAt: new Date(),
        }, { transaction });
        await this.diningTableModel.update({
            status: DINING_TABLE_STATUS.AVAILABLE,
        }, {
            where: { id: session.dataValues.tableId },
            transaction,
        });
    }

    private async resolveCartItemIds(cartId: number, requestedIds: number[] | undefined, transaction: Transaction) {
        if (requestedIds?.length) {
            return Array.from(new Set(requestedIds.map((id) => Number(id)).filter((id) => id > 0)));
        }

        const cart = await this.cartsModel.findByPk(cartId, {
            include: ['cartItems'],
            transaction,
        });
        const cartItems = (cart?.dataValues.cartItems || []) as Array<{ id: number }>;
        return cartItems.map((item) => Number(item.id));
    }

    private async getOpenSession(sessionId: number, transaction?: Transaction) {
        const session = await this.tableSessionModel.findByPk(sessionId, transaction
            ? {
                lock: transaction.LOCK.UPDATE,
                transaction,
            }
            : {
                include: [DiningTable, Carts, Order],
            });

        if (!session) throw new NotFoundException('Table session not found');
        if (session.dataValues.status !== TABLE_SESSION_STATUS.OPEN) {
            throw new BadRequestException('Table session is not open');
        }

        if (transaction) {
            await session.reload({
                include: [DiningTable, Carts, Order],
                transaction,
            });
        }

        if (!session.dataValues.cart && !session.cart) {
            throw new BadRequestException('Table session cart not found');
        }

        return session;
    }

    private async findTableByToken(tableToken: string) {
        const table = await this.diningTableModel.findOne({
            where: { qrToken: tableToken },
            include: [this.buildActiveSessionInclude()],
        });
        if (!table) throw new NotFoundException('Dining table not found');
        if (table.dataValues.status === DINING_TABLE_STATUS.DISABLED) {
            throw new BadRequestException('Dining table is disabled');
        }
        return table;
    }

    private async findActiveSessionByTableId(tableId: number) {
        return this.tableSessionModel.findOne({
            where: {
                tableId,
                status: TABLE_SESSION_STATUS.OPEN,
            },
            include: [DiningTable, Carts, Order],
        });
    }

    private async findSessionOrder(session: TableSession, transaction?: Transaction) {
        const orderId = Number(session.dataValues.orderId || 0);
        if (!orderId) return null;

        return this.orderModel.findByPk(orderId, {
            include: [KitchenTicket],
            transaction,
        });
    }

    private buildActiveSessionInclude() {
        return {
            model: TableSession,
            required: false,
            where: { status: TABLE_SESSION_STATUS.OPEN },
            include: [Order],
        };
    }

    private normalizePaymentMethod(value: string) {
        if (value === 'CASH' || value === PAYMENTMETHOD.CASH) return PAYMENTMETHOD.CASH;
        if (value === 'SEPAY' || value === PAYMENTMETHOD.SEPAY) return PAYMENTMETHOD.SEPAY;
        throw new BadRequestException('Unsupported payment method');
    }

    private async assertStaffPermission(actor: StaffActor, ...permissions: string[]) {
        if (!actor?.uid) throw new ForbiddenException('Staff account is required');
        if ([ENUMROLE.SUPER_ADMIN, ENUMROLE.ADMIN].includes(actor.role as ENUMROLE)) return;

        const user = await this.userModel.findByPk(actor.uid);
        if (!user || user.dataValues.role !== ENUMROLE.STAFF) {
            throw new ForbiddenException('Staff role is required');
        }

        const userPermissions = Array.isArray(user.dataValues.permissions)
            ? user.dataValues.permissions
            : [];
        const allowed = permissions.some((permission) => userPermissions.includes(permission));
        if (!allowed) {
            throw new ForbiddenException('Missing dine-in permission');
        }
    }

    private mapDiningTable(table: DiningTable) {
        const plain = table.get({ plain: true }) as any;
        const activeSession = (plain.sessions || []).find((session: any) => session.status === TABLE_SESSION_STATUS.OPEN) || null;

        return {
            id: plain.id,
            code: plain.code,
            name: plain.name,
            area: plain.area,
            status: plain.status,
            qrToken: plain.qrToken,
            activeSession: activeSession ? this.mapPlainSession(activeSession) : null,
            createdAt: plain.createdAt,
            updatedAt: plain.updatedAt,
        };
    }

    private mapTableSession(session: TableSession) {
        return this.mapPlainSession(session.get({ plain: true }) as any);
    }

    private mapPlainSession(session: any) {
        return {
            id: session.id,
            tableId: session.tableId,
            cartId: session.cartId,
            orderId: session.orderId,
            status: session.status,
            sessionToken: session.sessionToken,
            table: session.table
                ? {
                    id: session.table.id,
                    code: session.table.code,
                    name: session.table.name,
                    area: session.table.area,
                }
                : null,
            order: session.order ? this.mapDineInOrderPlain(session.order) : null,
            openedByUserId: session.openedByUserId,
            closedByUserId: session.closedByUserId,
            closedAt: session.closedAt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }

    private mapDineInOrder(order: Order) {
        return this.mapDineInOrderPlain(order.get({ plain: true }) as any);
    }

    private mapDineInOrderPlain(order: any) {
        return {
            id: order.id,
            orderNumber: order.orderNumber,
            orderType: order.orderType,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            subTotal: Number(order.subTotal || 0),
            deliveryFee: Number(order.deliveryFee || 0),
            discount: Number(order.discount || 0),
            finalTotal: Number(order.finalTotal || 0),
            paidAt: order.paidAt,
            ticketCount: Array.isArray(order.kitchenTickets) ? order.kitchenTickets.length : 0,
        };
    }

    private mapKitchenTicket(ticket: KitchenTicket) {
        const plain = ticket.get({ plain: true }) as any;
        return {
            id: plain.id,
            ticketNumber: plain.ticketNumber,
            tableSessionId: plain.tableSessionId,
            orderId: plain.orderId,
            source: plain.source,
            status: plain.status,
            notes: plain.notes,
            createdByUserId: plain.createdByUserId,
            createdAt: plain.createdAt,
            updatedAt: plain.updatedAt,
        };
    }

    private generateToken(prefix: string) {
        return `${prefix}_${randomUUID().replace(/-/g, '')}`;
    }

    private generateTicketNumber(sessionId: number) {
        const timestamp = Date.now().toString().slice(-8);
        return `KT${sessionId}-${timestamp}`;
    }
}
