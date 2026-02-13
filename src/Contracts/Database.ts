/**
 * Database connection configuration
 */
export interface ConnectionConfig {
    driver: 'mysql' | 'pgsql' | 'sqlite';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    charset?: string;
    timezone?: string;
    pool?: {
        min?: number;
        max?: number;
    };
}

/**
 * Database configuration with multiple connections
 */
export interface DatabaseConfig {
    default: string;
    connections: Record<string, ConnectionConfig>;
}

/**
 * Database connection interface
 */
export interface Connection {
    /**
     * Execute a raw SQL query
     */
    query(sql: string, bindings?: any[]): Promise<any>;

    /**
     * Begin a transaction
     */
    beginTransaction(): Promise<void>;

    /**
     * Commit a transaction
     */
    commit(): Promise<void>;

    /**
     * Rollback a transaction
     */
    rollback(): Promise<void>;

    /**
     * Close the connection
     */
    close(): Promise<void>;

    /**
     * Get the underlying driver connection
     */
    getDriver(): any;

    /**
     * Get the schema grammar for this connection
     */
    getSchemaGrammar(): any;
}

/**
 * Query builder interface
 */
export interface QueryBuilder {
    /**
     * Set the table for the query
     */
    table(table: string): this;

    /**
     * Add a where clause
     */
    where(column: string, operator: any, value?: any): this;

    /**
     * Add an OR where clause
     */
    orWhere(column: string, operator: any, value?: any): this;

    /**
     * Add a where in clause
     */
    whereIn(column: string, values: any[]): this;

    /**
     * Add a where not in clause
     */
    whereNotIn(column: string, values: any[]): this;

    /**
     * Add a where null clause
     */
    whereNull(column: string): this;

    /**
     * Add a where not null clause
     */
    whereNotNull(column: string): this;

    /**
     * Add a select clause
     */
    select(...columns: string[]): this;

    /**
     * Add an order by clause
     */
    orderBy(column: string, direction?: 'asc' | 'desc'): this;

    /**
     * Add a limit clause
     */
    limit(limit: number): this;

    /**
     * Add an offset clause
     */
    offset(offset: number): this;

    /**
     * Execute the query and get all results
     */
    get(): Promise<any[]>;

    /**
     * Execute the query and get the first result
     */
    first(): Promise<any | null>;

    /**
     * Insert a record
     */
    insert(data: Record<string, any>): Promise<any>;

    /**
     * Update records
     */
    update(data: Record<string, any>): Promise<number>;

    /**
     * Delete records
     */
    delete(): Promise<number>;

    /**
     * Get the count of records
     */
    count(column?: string): Promise<number>;
}
