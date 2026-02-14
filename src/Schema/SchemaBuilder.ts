
import { Connection } from '../Contracts/Database';
import { SchemaCallback } from '../Contracts/Schema';
import { Schema } from './Schema';

/**
 * Schema builder for creating and modifying tables
 */
export class SchemaBuilder {
    private resolvedConnection: Connection | null = null;

    constructor(private connection: Connection | Promise<Connection>) { }

    private async getResolvedConnection(): Promise<Connection> {
        if (!this.resolvedConnection) {
            this.resolvedConnection = await this.connection;
        }
        return this.resolvedConnection;
    }

    /**
     * Create a new table on the schema
     */
    public async create(tableName: string, callback: SchemaCallback): Promise<void> {
        const blueprint = Schema.create(tableName, callback);
        const connection = await this.getResolvedConnection();
        const grammar = connection.getSchemaGrammar();
        const sql = grammar.compileCreate(blueprint);
        await connection.query(sql);
    }

    /**
     * Drop a table from the schema
     */
    public async drop(tableName: string): Promise<void> {
        const connection = await this.getResolvedConnection();
        const grammar = connection.getSchemaGrammar();
        const sql = grammar.compileDrop(tableName);
        await connection.query(sql);
    }

    /**
     * Drop a table from the schema if it exists
     */
    public async dropIfExists(tableName: string): Promise<void> {
        const connection = await this.getResolvedConnection();
        const grammar = connection.getSchemaGrammar();
        const sql = grammar.compileDropIfExists(tableName);
        await connection.query(sql);
    }
}
