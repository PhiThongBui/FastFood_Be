import { NumberNotRequired, NumberRequired, StringNotRequired } from "@/common/decorators";

export class CreateCartItemDto {
    @NumberRequired('Id sản phẩm', 1)
    productId: number;

    @NumberRequired('Id của biến thế', 1)
    productVariantId: number;

    @NumberRequired('Số lượng biến thể mua', 1)
    quantity: number;

    @NumberNotRequired
    userId?: number

    @StringNotRequired
    sessionId?: string
}