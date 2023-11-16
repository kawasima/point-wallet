import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
    wallets: WalletTable
    transactions: TransactionTable
    entries: EntryTable
    aquisitions: AquisitionTable
    consumptions: ConsumptionTable
}

export interface WalletTable {
    id: Generated<number>
    balance: number
}

export interface TransactionTable {
    id: Generated<number>
    transacted_at: string
}

export interface EntryTable {
    id: Generated<number>
    transaction_id: number
    wallet_id: number
    account: "credit" | "debit"
    amount: number
}

export interface AquisitionTable {
    aquisition_entry_id: number
    expires_on: string
}

export interface ConsumptionTable {
    aquisition_entry_id: number
    consumption_entry_id: number
}
