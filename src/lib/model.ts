import z from "zod"

/*
 * ドメインモデルの定義です。
 */

export const WalletId = z.number().positive()
export const Point = z.number().positive()

export const Consumption = z.object({
    type: z.literal("consumption"),
    transactedAt: z.date(),
    amount: Point,    
})

export const Aquisition = z.object({
    type: z.literal("aquisition"),
    transactedAt: z.date(),
    amount: Point,
})

export const PointTransaction = z.discriminatedUnion("type", [Consumption, Aquisition])
export type PointTransaction = z.infer<typeof PointTransaction>

export const Wallet = z.object({
    id: WalletId,
    balance: z.number().min(0),
    transactions: PointTransaction.array(),
})
export type Wallet = z.infer<typeof Wallet>
