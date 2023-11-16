import { Transaction } from "kysely"
import { db } from "./database"
import { Database } from "./types"
import { Err, Ok, Result } from "@zondax/ts-results"
import { PointTransaction, Wallet } from "./model"
import { BadRequestError, ClientError, NotFoundError } from "./problem"

/*
 * データベースの操作を行う関数を定義します。
 *
 */

/**
 * ウォレットを作成します。
 */
export async function createWallet(): Promise<number> {
    const { id } = await db.insertInto("wallets")
        .values({
            balance: 0,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
    return id
}

/**
 * ウォレットとポイントの履歴を取得します。
 */
export async function findWalletById(id: number): Promise<Result<Wallet, ClientError>> {
    const walletResult = await db.selectFrom("wallets")
        .where("id", "=", id)
        .selectAll()
        .executeTakeFirst()
    if (!walletResult) {
        return Err(new NotFoundError("not found"))
    }
    const pointTransactions = await db.selectFrom("entries as e")
        .innerJoin("transactions as t", "t.id", "e.transaction_id")
        .where("e.wallet_id", "=", id)
        .orderBy("t.transacted_at", "desc")
        .groupBy(["t.id", "e.account"])
        .limit(10)
        .select(["t.id", "t.transacted_at", "e.account",
            (eb) => eb.fn("sum", ["e.amount"]).as("amount")])
        .execute()
        .then(rows => rows.map(
            row => PointTransaction.parse({
                transactedAt: new Date(Date.parse(row.transacted_at)),
                type: row.account === "credit" ? "aquisition" : "consumption",
                amount: Number(row.amount),
            })))
    return Ok(Wallet.parse({
        id: walletResult.id,
        balance: walletResult.balance,
        transactions: pointTransactions,
    }))
}

/**
 * ウォレットにポイントを付与します。
 * 
 * @param wallet_id ウォレットのID
 * @param point 付与ポイント
 */
export async function aquirePoints(wallet_id: number, point: number): Promise<Result<string, ClientError>> {
    return await db.transaction().execute(async (trx) => {
        const { balance } = await trx.selectFrom("wallets")
            .select("balance")
            .where("id", "=", wallet_id)
            //.forUpdate()
            .executeTakeFirstOrThrow()

        const { id }  = await trx.insertInto("transactions").values({
            transacted_at: new Date().toISOString(),
        }).returning("id").executeTakeFirstOrThrow()

        const [{ id: credit_entry_id }, { id: debit_entry_id }] = await trx.insertInto("entries").values([
            {
                transaction_id: id,
                wallet_id,
                account: "credit",
                amount: point,
            },
            {
                transaction_id: id,
                wallet_id: 0,
                account: "debit",
                amount: -point,
            }
        ]).returning("id").execute()

        await trx.insertInto("aquisitions").values({
            aquisition_entry_id: credit_entry_id,
            expires_on: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
        }).execute()

        await trx.updateTable("wallets").set({
            balance: balance + point,
        })
        .where("id", "=", wallet_id)
        .execute()
        return Ok("")
    })    
}

/**
 * ウォレットのポイントを使用します。
 * 
 * @param wallet_id ウォレットのID
 * @param point 使用ポイント
 */
export async function consumePoints(wallet_id: number, point: number): Promise<Result<string, ClientError>> {
    return await db.transaction().execute(async (trx) => {
        const { balance } = await trx.selectFrom("wallets")
            .select("balance")
            .where("id", "=", wallet_id)
            //.forUpdate()
            .executeTakeFirstOrThrow()
        
        if (balance <= point) {
            return new Err(new BadRequestError("insufficient balance"))
        }

        const aquisitionEntries = await findConsumptionTargets(trx, wallet_id)

        let remainingPoint = point
        const consumptionEntries = []
        for (const entry of aquisitionEntries) {
            const consumptionAmount = Math.min(remainingPoint, entry.point)
            remainingPoint = remainingPoint - consumptionAmount
            consumptionEntries.push({
                aquisition_entry_id: entry.aquisition_entry_id,
                amount: consumptionAmount,
            })
            if (remainingPoint <= 0) {
                break
            }
        }

        const { id }  = await trx.insertInto("transactions").values({
            transacted_at: new Date().toISOString(),
        }).returning("id").executeTakeFirstOrThrow()

        for (const entry of consumptionEntries) {
            const [{ id: credit_entry_id }, { id: debit_entry_id }] = await trx.insertInto("entries").values([
                {
                    transaction_id: id,
                    wallet_id: 0,
                    account: "credit",
                    amount: -entry.amount,
                },
                {
                    transaction_id: id,
                    wallet_id,
                    account: "debit",
                    amount: entry.amount,
                }
            ]).returning("id").execute()

            await trx.insertInto("consumptions").values({
                aquisition_entry_id: entry.aquisition_entry_id,
                consumption_entry_id: debit_entry_id,
            }).execute()
        }

        await trx.updateTable("wallets").set({
                balance: balance - point,
            })
            .where("id", "=", wallet_id)
            .execute()
        return Ok("")
    })
}

/**
 * ウォレットのポイントの消費対象を取得します。 
 */
async function findConsumptionTargets(trx: Transaction<Database>, wallet_id: number) {
    return await trx.selectFrom("aquisitions as a")
        .innerJoin("entries as ae", "ae.id", "a.aquisition_entry_id")
        .innerJoin("transactions as t", "t.id", "ae.transaction_id")
        .leftJoin("consumptions as c", "a.aquisition_entry_id", "c.aquisition_entry_id")
        .leftJoin("entries as ce", "ce.id", "c.consumption_entry_id")
        .where("ae.wallet_id", "=", wallet_id)
        .where("a.expires_on", ">=", new Date().toISOString())
        .orderBy("t.transacted_at", "asc")
        .groupBy("a.aquisition_entry_id")
        .select(["a.aquisition_entry_id", "ae.amount as aquired_amount",
            (eb) => eb.fn("sum", ["ce.amount"]).as("consumed_amount")])
        .execute()
        .then(rows => rows.filter(row => row.aquired_amount > Number(row.consumed_amount))
            .map(row => ({
                aquisition_entry_id: row.aquisition_entry_id,
                point: row.aquired_amount - Number(row.consumed_amount),
            })))
}
