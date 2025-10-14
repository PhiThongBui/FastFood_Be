

export type CartPreviewItem = {
    cartItemId: string,
    productName: string,
    productVariantName: string,
    productVariantsize: string,
    productVarianttype: string,
    priceProduct: number,
    quantity: number,
    ingredients: Array<{ ingredientId: number, ingredientName: string, price: number }>,
    subtotal: number
}
export type CartPreviewOutput = {
    message: string,
    data: {
        items: Array<CartPreviewItem>,
        totalAmount: number
    }
}