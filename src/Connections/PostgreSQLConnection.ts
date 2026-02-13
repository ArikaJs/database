import { Pool, PoolClient } from 'pg';
import { Connection, ConnectionConfig } from '../Contracts/Database';

/**
 * PostgreSQL database connection
 */
export class PostgreSQLConnection implements Connection {
    private pool: Pool;
    private transactionClient?: PoolClient;

    constructor(config: ConnectionConfig) {
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
            min: config.pool?.min || 0,
            max: config.pool?.max || 10,
        });
    }

    /**
     * Execute a raw SQL query
     */
    async query(sql: string, bindings: any[] = []): Promise<any> {
        const client = this.transactionClient || this.pool;
        const result = await client.query(sql, bindings);
        return result.rows;
    }

    /**
     * Begin a transaction
     */
    async beginTransaction(): Promise<void> {
        if (this.transactionClient) {
            throw new Error('Transaction already started');
        }
        this.transactionClient = await this.pool.connect();
        await this.transactionClient.query('BEGIN');
    }

    /**
     * Commit a transaction
     */
    async commit(): Promise<void> {
        if (!this.transactionClient) {
            throw new Error('No transaction to commit');
        }
        await this.transactionClient.query('COMMIT');
        this.transactionClient.release();
        this.transactionClient = undefined;
    }

    /**
     * Rollback a transaction
     */
    async rollback(): Promise<void> {
        if (!this.transactionClient) {
            throw new Error('No transaction to rollback');
        }
        await this.transactionClient.query('ROLLBACK');
        this.transactionClient.release();
        this.transactionClient = undefined;
    }

    /**
     * Close the connection
     */
    async close(): Promise<void> {
        if (this.transactionClient) {
            this.transactionClient.release();
            this.transactionClient = undefined;
        }
        await this.pool.end();
    }

    /**
     * Get the underlying driver connection
     */
    getDriver(): Pool {
        return this.pool;
    }

    /**
     * Get the schema grammar for this connection
     */
    getSchemaGrammar() {
        const { PostgreSQLGrammar } = require('../Schema/Grammars/PostgreSQLGrammar');
        return new PostgreSQLGrammar();
    }
}
