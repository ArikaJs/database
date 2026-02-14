import { DatabaseManager } from './DatabaseManager';
import { QueryBuilder } from './Query/QueryBuilder';
import { SchemaBuilder } from './Schema/SchemaBuilder';

/**
 * Database facade - static interface to the database manager
 */
export class Database {
    private static manager: DatabaseManager;

    /**
     * Set the database manager instance
     */
    static setManager(manager: DatabaseManager): void {
        Database.manager = manager;
    }

    /**
     * Get the database manager instance
     */
    static getManager(): DatabaseManager {
        if (!Database.manager) {
            throw new Error('DatabaseManager not initialized. Call Database.setManager() first.');
        }
        return Database.manager;
    }

    /**
     * Create a new query builder for a table
     */
    static table(tableName: string, connectionName?: string): QueryBuilder {
        return Database.getManager().table(tableName, connectionName);
    }

    /**
     * Get a schema builder instance
     */
    static schema(connectionName?: string): SchemaBuilder {
        return Database.getManager().schema(connectionName);
    }

    /**
     * Execute a transaction
     */
    static async transaction<T>(
        callback: (trx: DatabaseManager) => Promise<T>,
        connectionName?: string
    ): Promise<T> {
        return await Database.getManager().transaction(callback, connectionName);
    }

    /**
     * Get a connection by name
     */
    static connection(name?: string) {
        return Database.getManager().connection(name);
    }

    /**
     * Close all connections
     */
    static async closeAll(): Promise<void> {
        return Database.getManager().closeAll();
    }
}
