import { BooleanNotRequired, NumberNotRequired, StringNotRequired } from '@/common/decorators';
export class filterPizzaDto{
    @StringNotRequired
    name?: string

    @BooleanNotRequired
    isFeatured?: boolean

    @BooleanNotRequired
    isActive?: boolean

    @NumberNotRequired
    page?: number

    @NumberNotRequired
    limit?: number

    @StringNotRequired
    sortBy?: string

    @StringNotRequired
    sortOrder?: string

    @NumberNotRequired
    minPrice:number

    @NumberNotRequired
    maxPrice:number
}