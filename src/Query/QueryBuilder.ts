import { Connection } from '../Contracts/Database';
import { QueryBuilder as QueryBuilderInterface } from '../Contracts/Database';

/**
 * Where clause structure
 */
interface WhereClause {
    type: 'basic' | 'in' | 'notIn' | 'null' | 'notNull';
    column: string;
    operator?: string;
    value?: any;
    boolean: 'and' | 'or';
}

/**
 * Query builder implementation
 */
export class QueryBuilder implements QueryBuilderInterface {
    private tableName?: string;
    private selectColumns: string[] = ['*'];
    private whereClauses: WhereClause[] = [];
    private orderByColumns: Array<{ column: string; direction: 'asc' | 'desc' }> = [];
    private limitValue?: number;
    private offsetValue?: number;

    constructor(private connection: Connection) { }

    /**
     * Set the table for the query
     */
    table(table: string): this {
        this.tableName = table;
        return this;
    }

    /**
     * Add a select clause
     */
    select(...columns: string[]): this {
        this.selectColumns = columns;
        return this;
    }

    /**
     * Add a where clause
     */
    where(column: string, operator: any, value?: any): this {
        // Handle where(column, value) syntax
        if (value === undefined) {
            value = operator;
            operator = '=';
        }

        this.whereClauses.push({
            type: 'basic',
            column,
            operator,
            value,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add an OR where clause
     */
    orWhere(column: string, operator: any, value?: any): this {
        // Handle orWhere(column, value) syntax
        if (value === undefined) {
            value = operator;
            operator = '=';
        }

        this.whereClauses.push({
            type: 'basic',
            column,
            operator,
            value,
            boolean: 'or',
        });

        return this;
    }

    /**
     * Add a where in clause
     */
    whereIn(column: string, values: any[]): this {
        this.whereClauses.push({
            type: 'in',
            column,
            value: values,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a where not in clause
     */
    whereNotIn(column: string, values: any[]): this {
        this.whereClauses.push({
            type: 'notIn',
            column,
            value: values,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a where null clause
     */
    whereNull(column: string): this {
        this.whereClauses.push({
            type: 'null',
            column,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a where not null clause
     */
    whereNotNull(column: string): this {
        this.whereClauses.push({
            type: 'notNull',
            column,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add an order by clause
     */
    orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
        this.orderByColumns.push({ column, direction });
        return this;
    }

    /**
     * Add a limit clause
     */
    limit(limit: number): this {
        this.limitValue = limit;
        return this;
    }

    /**
     * Add an offset clause
     */
    offset(offset: number): this {
        this.offsetValue = offset;
        return this;
    }

    /**
     * Execute the query and get all results
     */
    async get(): Promise<any[]> {
        const { sql, bindings } = this.buildSelectQuery();
        return await this.connection.query(sql, bindings);
    }

    /**
     * Execute the query and get the first result
     */
    async first(): Promise<any | null> {
        this.limit(1);
        const results = await this.get();
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Insert a record
     */
    async insert(data: Record<string, any>): Promise<any> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `?`).join(', ');

        const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        return await this.connection.query(sql, values);
    }

    /**
     * Update records
     */
    async update(data: Record<string, any>): Promise<number> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');

        const { whereClause, bindings: whereBindings } = this.buildWhereClause();
        const sql = `UPDATE ${this.tableName} SET ${setClause}${whereClause}`;

        const result = await this.connection.query(sql, [...values, ...whereBindings]);
        return result.affectedRows || result.rowCount || 0;
    }

    /**
     * Delete records
     */
    async delete(): Promise<number> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const { whereClause, bindings } = this.buildWhereClause();
        const sql = `DELETE FROM ${this.tableName}${whereClause}`;

        const result = await this.connection.query(sql, bindings);
        return result.affectedRows || result.rowCount || 0;
    }

    /**
     * Get the count of records
     */
    async count(column: string = '*'): Promise<number> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const { whereClause, bindings } = this.buildWhereClause();
        const sql = `SELECT COUNT(${column}) as count FROM ${this.tableName}${whereClause}`;

        const result = await this.connection.query(sql, bindings);
        return parseInt(result[0].count);
    }

    /**
     * Build the SELECT query
     */
    private buildSelectQuery(): { sql: string; bindings: any[] } {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const columns = this.selectColumns.join(', ');
        let sql = `SELECT ${columns} FROM ${this.tableName}`;

        const { whereClause, bindings } = this.buildWhereClause();
        sql += whereClause;

        if (this.orderByColumns.length > 0) {
            const orderBy = this.orderByColumns
                .map(({ column, direction }) => `${column} ${direction.toUpperCase()}`)
                .join(', ');
            sql += ` ORDER BY ${orderBy}`;
        }

        if (this.limitValue !== undefined) {
            sql += ` LIMIT ${this.limitValue}`;
        }

        if (this.offsetValue !== undefined) {
            sql += ` OFFSET ${this.offsetValue}`;
        }

        return { sql, bindings };
    }

    /**
     * Build the WHERE clause
     */
    private buildWhereClause(): { whereClause: string; bindings: any[] } {
        if (this.whereClauses.length === 0) {
            return { whereClause: '', bindings: [] };
        }

        const bindings: any[] = [];
        const clauses: string[] = [];

        this.whereClauses.forEach((where, index) => {
            const boolean = index === 0 ? '' : ` ${where.boolean.toUpperCase()} `;

            switch (where.type) {
                case 'basic':
                    clauses.push(`${boolean}${where.column} ${where.operator} ?`);
                    bindings.push(where.value);
                    break;

                case 'in':
                    const inPlaceholders = where.value.map(() => '?').join(', ');
                    clauses.push(`${boolean}${where.column} IN (${inPlaceholders})`);
                    bindings.push(...where.value);
                    break;

                case 'notIn':
                    const notInPlaceholders = where.value.map(() => '?').join(', ');
                    clauses.push(`${boolean}${where.column} NOT IN (${notInPlaceholders})`);
                    bindings.push(...where.value);
                    break;

                case 'null':
                    clauses.push(`${boolean}${where.column} IS NULL`);
                    break;

                case 'notNull':
                    clauses.push(`${boolean}${where.column} IS NOT NULL`);
                    break;
            }
        });

        return {
            whereClause: ' WHERE ' + clauses.join(''),
            bindings,
        };
    }
}
