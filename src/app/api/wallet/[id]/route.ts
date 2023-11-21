import { Point, PointCloseToExpiry, WalletId } from "@/lib/model"
import { BadRequestError, ClientError, problemResponse } from "@/lib/problem"
import { aquirePoints, consumePoints, findPointsCloseToExpiry, findWalletById } from "@/lib/repository"
import { Result } from "@zondax/ts-results"
import z from "zod"

/**
 * ウォレットの情報を取得します。
 * ポイントのやり取りの履歴の最新の10件も同時に返します。
 */
export async function GET(req: Request, { params }: {
    params: { id: string },
}) {
    const walletId = WalletId.safeParse(params.id)
    if (!walletId.success) {
        return problemResponse(new BadRequestError(walletId.error.message))
    }
    const wallet = await findWalletById(walletId.data)
    let pointsCloseToExpiry: Result<PointCloseToExpiry[], ClientError>
    const { searchParams } = new URL(req.url)
    if (searchParams.get("with")?.includes("pointsCloseToExpiry")) {
        pointsCloseToExpiry = await findPointsCloseToExpiry(walletId.data)
    }
    return wallet
        .map(wallet => {
            if (pointsCloseToExpiry?.ok) {
                wallet.pointsCloseToExpiry = pointsCloseToExpiry.val
            }
            return Response.json(wallet)
        })
        .mapErr(err => problemResponse(err))
        .val
}

const PointTransactionRequest = z.object({
    type: z.union([z.literal("aquisition"), z.literal("consumption")]),
    point: Point,
})

/**
 * ポイントのやり取りを行います。
 */
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