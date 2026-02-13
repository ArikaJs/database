
import { Connection } from '../Contracts/Database';
import { SchemaCallback } from '../Contracts/Schema';
import { Schema } from './Schema';

/**
 * Schema builder for creating and modifying tables
 */
export class SchemaBuilder {
    constructor(private connection: Connection) { }

    /**
     * Create a new table on the schema
     */
    public async create(tableName: string, callback: SchemaCallback): Promise<void> {
        const blueprint = Schema.create(tableName, callback);
        const grammar = this.connection.getSchemaGrammar();
        const sql = grammar.compileCreate(blueprint);
        await this.connection.query(sql);
    }

    /**
     * Drop a table from the schema
     */
    public async drop(tableName: string): Promise<void> {
        const grammar = this.connection.getSchemaGrammar();
        const sql = grammar.compileDrop(tableName);
        await this.connection.query(sql);
    }

    /**
     * Drop a table from the schema if it exists
     */
    public async dropIfExists(tableName: string): Promise<void> {
        const grammar = this.connection.getSchemaGrammar();
        const sql = grammar.compileDropIfExists(tableName);
        await this.connection.query(sql);
    }
}
