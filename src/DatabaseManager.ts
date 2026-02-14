import { Connection, ConnectionConfig, DatabaseConfig } from './Contracts/Database';
import { QueryBuilder } from './Query/QueryBuilder';
import { SchemaBuilder } from './Schema/SchemaBuilder';

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
    connection(name?: string): Connection | Promise<Connection> {
        const connectionName = name || this.config.default;

        if (this.connections.has(connectionName)) {
            return this.connections.get(connectionName)!;
        }

        const connectionConfig = this.config.connections[connectionName];
        if (!connectionConfig) {
            throw new Error(`Connection "${connectionName}" not configured`);
        }

        const connectionPromise = this.createConnection(connectionConfig).then(connection => {
            this.connections.set(connectionName, connection);
            return connection;
        });

        return connectionPromise;
    }

    /**
     * Create a new query builder
     */
    table(tableName: string, connectionName?: string): QueryBuilder {
        const connection = this.connection(connectionName);
        return new QueryBuilder(connection).table(tableName);
    }

    /**
     * Get a schema builder instance
     */
    schema(connectionName?: string): SchemaBuilder {
        const connection = this.connection(connectionName);
        return new SchemaBuilder(connection as any);
    }

    /**
     * Execute a transaction
     */
    async transaction<T>(
        callback: (trx: DatabaseManager) => Promise<T>,
        connectionName?: string
    ): Promise<T> {
        const connection = await this.connection(connectionName);

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
    private async createConnection(config: ConnectionConfig): Promise<Connection> {
        switch (config.driver) {
            case 'mysql': {
                const { MySQLConnection } = await import('./Connections/MySQLConnection');
                return new MySQLConnection(config);
            }
            case 'pgsql': {
                const { PostgreSQLConnection } = await import('./Connections/PostgreSQLConnection');
                return new PostgreSQLConnection(config);
            }
            case 'sqlite': {
                const { SQLiteConnection } = await import('./Connections/SQLiteConnection');
                return new SQLiteConnection(config);
            }
            default:
                throw new Error(`Unsupported database driver: ${config.driver}`);
        }
    }
}
