import mysql from 'mysql2/promise';
import { Connection, ConnectionConfig } from '../Contracts/Database';

/**
 * MySQL database connection
 */
export class MySQLConnection implements Connection {
    private pool: mysql.Pool;
    private transactionConnection?: mysql.PoolConnection;

    constructor(config: ConnectionConfig) {
        this.pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
            charset: config.charset || 'utf8mb4',
            timezone: config.timezone || '+00:00',
            waitForConnections: true,
            connectionLimit: config.pool?.max || 10,
            queueLimit: 0,
        });
    }

    /**
     * Execute a raw SQL query
     */
    async query(sql: string, bindings: any[] = []): Promise<any> {
        const connection = this.transactionConnection || this.pool;
        const [rows] = await connection.execute(sql, bindings);
        return rows;
    }

    /**
     * Begin a transaction
     */
    async beginTransaction(): Promise<void> {
        if (this.transactionConnection) {
            throw new Error('Transaction already started');
        }
        this.transactionConnection = await this.pool.getConnection();
        await this.transactionConnection.beginTransaction();
    }

    /**
     * Commit a transaction
     */
    async commit(): Promise<void> {
        if (!this.transactionConnection) {
            throw new Error('No transaction to commit');
        }
        await this.transactionConnection.commit();
        this.transactionConnection.release();
        this.transactionConnection = undefined;
    }

    /**
     * Rollback a transaction
     */
    async rollback(): Promise<void> {
        if (!this.transactionConnection) {
            throw new Error('No transaction to rollback');
        }
        await this.transactionConnection.rollback();
        this.transactionConnection.release();
        this.transactionConnection = undefined;
    }

    /**
     * Close the connection
     */
    async close(): Promise<void> {
        if (this.transactionConnection) {
            this.transactionConnection.release();
            this.transactionConnection = undefined;
        }
        await this.pool.end();
    }

    /**
     * Get the underlying driver connection
     */
    getDriver(): mysql.Pool {
        return this.pool;
    }
}
