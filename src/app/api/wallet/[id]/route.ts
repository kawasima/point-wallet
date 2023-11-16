import { Point, WalletId } from "@/lib/model"
import { problemResponse } from "@/lib/problem"
import { aquirePoints, consumePoints, findWalletById } from "@/lib/repository"
import z from "zod"

export async function GET(req: Request, { params }: { params: { id: string }}) {
    const walletId = z.preprocess(v => Number(v), WalletId)
        .parse(params.id)
    const wallet = await findWalletById(walletId)
    return wallet
        .map(wallet => Response.json(wallet))
        .mapErr(err => problemResponse(err))
        .val
}

const PointTransactionRequest = z.object({
    type: z.union([z.literal("aquisition"), z.literal("consumption")]),
    point: Point,
})

export async function PUT(req: Request, { params }: { params: { id: string }}) {
    const walletId = z.preprocess(v => Number(v), WalletId)
        .parse(params.id)
    const { type, point } = PointTransactionRequest.parse(await req.json())


    switch(type) {
        case "aquisition":
            return (await aquirePoints(walletId, point))
                .map(_ => Response.json({
                    message: "point aquisition"
                }))
                .mapErr(err => problemResponse(err))
                .val
        case "consumption":
            return (await consumePoints(walletId, point))
                .map(_ => Response.json({
                    message: "point consumption"
                }))
                .mapErr(err => problemResponse(err))
                .val
    }
}