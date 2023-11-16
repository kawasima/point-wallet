import { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema.createTable("wallets")
        .addColumn("id", "integer", col => col.primaryKey().autoIncrement())
        .addColumn("balance", "numeric", col => col.notNull())
        .execute()
    // 胴元のウォレット
    await db.insertInto("wallets").values({
        id: 0,
        balance: 10000000,
    }).execute()
    await db.schema.createTable("transactions")
        .addColumn("id", "integer", col => col.primaryKey().autoIncrement())
        .addColumn("transacted_at", "timestamp", col => col.notNull())
        .execute()
    await db.schema.createTable("entries")
        .addColumn("id", "integer", col => col.primaryKey().autoIncrement())
        .addColumn("transaction_id", "integer", col => col.notNull()
            .references("transactions.id").onDelete("cascade"))
        .addColumn("wallet_id", "integer", col => col.notNull()
            .references("wallets.id"))
        .addColumn("account", "varchar(10)", col => col.notNull())
        .addColumn("amount", "numeric", col => col.notNull())
        .execute()
    await db.schema.createTable("aquisitions")
        .addColumn("aquisition_entry_id", "integer", col => col.primaryKey()
            .references("entries.id"))
        .addColumn("expires_on", "timestamp", col => col.notNull())
        .execute()
    await db.schema.createTable("consumptions")
        .addColumn("aquisition_entry_id", "integer", col => col
            .references("aquisitions.aquisition_entry_id"))
        .addColumn("consumption_entry_id", "integer", col => col
            .references("entries.id"))
        .addPrimaryKeyConstraint("consumption_pk", ["aquisition_entry_id", "consumption_entry_id"])
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable("consumptions").execute()
    await db.schema.dropTable("aquisitions").execute()
    await db.schema.dropTable("entries").execute()
    await db.schema.dropTable("transactions").execute()
    await db.schema.dropTable("wallets").execute()
}