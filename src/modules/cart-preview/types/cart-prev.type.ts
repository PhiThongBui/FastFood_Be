

export type CartPreviewItem = {
    cartItemId: string,
    productName: string,
    productVariantName: string,
    productVariantsize: string,
    productVarianttype: string,
    priceProduct: number,
    quantity: number,
    ingredients: Array<{ ingredientId: number, ingredientName: string, price: number }>,
}
export type CartPreviewOutput = {
    message: string,
    data: {
        items: Array<CartPreviewItem>,
        totalAmount: number
    }
}

export type CartCheckoutOutput = {
    message:string,
    data:{
        items: CartPreviewItem[],
        subtotal: number,
        deliveryFee: number,
        discount : number,
        finalTotal: number,
        appliedCoupon?: {
            code: string;
            type: string;
            value: number;
        };
    }
}