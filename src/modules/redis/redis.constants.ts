export const REDIS_CLIENT = 'REDIS_CLIENT';

export const REDIS_KEYS = {
    PENDING_ORDERS: 'pending_orders_ttl',
    IPN_LOCK: 'ipn_lock',
    NEW_ORDERS_CHANNEL: 'new_orders',
};

export const REDIS_CONFIG = {
    ORDER_TTL_SECONDS: 60, // 20 phút
    LOCK_TTL_SECONDS: 60,    // 60 giây
};
