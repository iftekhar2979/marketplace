export enum OrderStatus {
    DELIVERED = 'delivered',
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',   
    REFUNDED = 'refunded'

}

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed' ,
    FAILED = 'failed',
    REFUNDED = 'refunded',
    CANCELED = 'canceled' ,
    SUBMITTED = 'submitted'
}