import { Connection, ConnectionConfig, DatabaseConfig } from './Contracts/Database';
import { MySQLConnection } from './Connections/MySQLConnection';
import { PostgreSQLConnection } from './Connections/PostgreSQLConnection';
import { SQLiteConnection } from './Connections/SQLiteConnection';
import { QueryBuilder } from './Query/QueryBuilder';

/**
 * Database manager - handles connections and query builders
 */
export class DatabaseManager {
    private connections: Map<string, Connection> = new Map();
    private config: DatabaseConfig;

    constructor(config: DatabaseConfig) {
        this.config = config;
    }

    /**
     * Get a connection by name
     */
    connection(name?: string): Connection {
        const connectionName = name || this.config.default;

        if (this.connections.has(connectionName)) {
            return this.connections.get(connectionName)!;
        }

        const connectionConfig = this.config.connections[connectionName];
        if (!connectionConfig) {
            throw new Error(`Connection "${connectionName}" not configured`);
        }

        const connection = this.createConnection(connectionConfig);
        this.connections.set(connectionName, connection);

        return connection;
    }

    /**
     * Create a new query builder
     */
    table(tableName: string, connectionName?: string): QueryBuilder {
        const connection = this.connection(connectionName);
        return new QueryBuilder(connection).table(tableName);
    }

    /**
     * Execute a transaction
     */
    async transaction<T>(
        callback: (trx: DatabaseManager) => Promise<T>,
        connectionName?: string
    ): Promise<T> {
        const connection = this.connection(connectionName);

        await connection.beginTransaction();

        try {
            const result = await callback(this);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    /**
     * Close all connections
     */
    async closeAll(): Promise<void> {
        const promises = Array.from(this.connections.values()).map(conn => conn.close());
        await Promise.all(promises);
        this.connections.clear();
    }

    /**
     * Create a connection based on driver type
     */
    private createConnection(config: ConnectionConfig): Connection {
        switch (config.driver) {
            case 'mysql':
                return new MySQLConnection(config);
            case 'pgsql':
                return new PostgreSQLConnection(config);
            case 'sqlite':
                return new SQLiteConnection(config);
            default:
                throw new Error(`Unsupported database driver: ${config.driver}`);
        }
    }
}
