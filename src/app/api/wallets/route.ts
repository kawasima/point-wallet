import { createWallet } from "@/lib/repository";

/**
 * ウォレットを作成します。
 */
export async function POST(req: Request) {
    const id = await createWallet()
    return Response.json({
        walletId: id
    })
}