import z from "zod"

/*
 * ドメインモデルの定義です。
 */

export const WalletId = z.coerce.number().positive()
export type WalletId = z.infer<typeof WalletId>
export const Point = z.number().positive()
export type Point = z.infer<typeof Point>

export const Consumption = z.object({
    type: z.literal("consumption"),
    transactedAt: z.coerce.date(),
    amount: Point,    
})

export const Aquisition = z.object({
    type: z.literal("aquisition"),
    transactedAt: z.coerce.date(),
    amount: Point,
})

export const PointTransaction = z.discriminatedUnion("type", [Consumption, Aquisition])
export type PointTransaction = z.infer<typeof PointTransaction>

export const PointCloseToExpiry = z.object({
    expiresOn: z.coerce.date(),
    amount: Point,
})
export type PointCloseToExpiry = z.infer<typeof PointCloseToExpiry>

export const Wallet = z.object({
    id: WalletId,
    balance: z.number().min(0),
    transactions: PointTransaction.array().optional(),
    pointsCloseToExpiry: PointCloseToExpiry.array().optional(),
})
export type Wallet = z.infer<typeof Wallet>
