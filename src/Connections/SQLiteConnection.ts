import Database from 'better-sqlite3';
import { Connection, ConnectionConfig } from '../Contracts/Database';

/**
 * SQLite database connection
 */
export class SQLiteConnection implements Connection {
    private db: Database.Database | null = null;
    private config: ConnectionConfig;

    constructor(config: ConnectionConfig) {
        this.config = config;
    }

    /**
     * Connect to the database
     */
    async connect(): Promise<void> {
        if (this.db) {
            return;
        }

        this.db = new Database(this.config.database || ':memory:');
    }

    /**
     * Disconnect from the database
     */
    async disconnect(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    /**
     * Execute a query
     */
    async query(sql: string, bindings: any[] = []): Promise<any[]> {
        if (!this.db) {
            await this.connect();
        }

        try {
            const stmt = this.db!.prepare(sql);

            // Check if it's a SELECT query
            if (sql.trim().toLowerCase().startsWith('select')) {
                return stmt.all(...bindings);
            }

            // For INSERT, UPDATE, DELETE
            const info = stmt.run(...bindings);
            return [{ affectedRows: info.changes, insertId: info.lastInsertRowid }];
        } catch (error: any) {
            throw new Error(`SQLite query failed: ${error.message}`);
        }
    }

    /**
     * Execute a raw query
     */
    async raw(sql: string): Promise<any> {
        if (!this.db) {
            await this.connect();
        }

        try {
            return this.db!.exec(sql);
        } catch (error: any) {
            throw new Error(`SQLite raw query failed: ${error.message}`);
        }
    }

    /**
     * Get the underlying database instance
     */
    getDriver(): Database.Database {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db;
    }

    /**
     * Close the connection
     */
    async close(): Promise<void> {
        await this.disconnect();
    }

    /**
     * Begin a transaction
     */
    async beginTransaction(): Promise<void> {
        await this.query('BEGIN TRANSACTION');
    }

    /**
     * Commit a transaction
     */
    async commit(): Promise<void> {
        await this.query('COMMIT');
    }

    /**
     * Rollback a transaction
     */
    async rollback(): Promise<void> {
        await this.query('ROLLBACK');
    }

    /**
     * Get the schema grammar for this connection
     */
    getSchemaGrammar() {
        const { SQLiteGrammar } = require('../Schema/Grammars/SQLiteGrammar');
        return new SQLiteGrammar();
    }
}
