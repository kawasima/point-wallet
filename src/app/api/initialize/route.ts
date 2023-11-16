import * as path from 'path'
import { promises as fs } from 'fs'
import { Migration, MigrationProvider, Migrator } from "kysely"
import { db } from "@/lib/database"

class MyMigrationProvider implements MigrationProvider {
    async getMigrations(): Promise<Record<string, Migration>> {
        const migrations: Record<string, Migration> = {}
        const migration = await import("@/migration/001.ts")
        migrations["001"] = migration
    return migrations
    }
}
/**
 * スキーマ初期化のエンドポイントです
 * 
 * @param req HTTP Request
 * @returns Nothing
 */
export async function POST(req: Request) {
    const migrator = new Migrator({
        db,
        provider: new MyMigrationProvider(),
    })
    const {error, results} = await migrator.migrateToLatest()
    if (error) {
        return Response.json({
            message: "Failed to initialize",
            results,
            error,
        })
    } else {
        return Response.json({
            message: "Successfully initialized",
            results
        })
    }
}