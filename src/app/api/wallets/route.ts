import { createWallet } from "@/lib/repository";

export async function POST(req: Request) {
    const id = await createWallet()
    return Response.json({
        walletId: id
    })
}