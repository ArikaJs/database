
import { TableBlueprint, ColumnDefinition } from '../Schema';
import { Grammar } from './Grammar';

/**
 * PostgreSQL grammar for schema building
 */
export class PostgreSQLGrammar extends Grammar {
    public compileCreate(blueprint: TableBlueprint): string {
        const columns = blueprint.getColumns().map(column => this.compileColumn(column));

        // Add primary keys
        const primaryKeys = blueprint.getColumns()
            .filter(column => column.primary)
            .map(column => column.name);

        if (primaryKeys.length > 0) {
            columns.push(`PRIMARY KEY (${primaryKeys.join(', ')})`);
        }

        return `CREATE TABLE ${blueprint.tableName} (\n  ${columns.join(',\n  ')}\n)`;
    }

    public compileDrop(tableName: string): string {
        return `DROP TABLE ${tableName}`;
    }

    public compileDropIfExists(tableName: string): string {
        return `DROP TABLE IF EXISTS ${tableName}`;
    }

    protected compileColumn(column: ColumnDefinition): string {
        if (column.autoIncrement) {
            return `${column.name} ${column.type === 'bigInteger' ? 'BIGSERIAL' : 'SERIAL'} PRIMARY KEY`;
        }

        let sql = `${column.name} ${this.getType(column)}`;

        if (!column.nullable_) {
            sql += ' NOT NULL';
        }

        sql += this.getDefault(column);

        if (column.unique_) {
            sql += ' UNIQUE';
        }

        return sql;
    }

    protected getType(column: ColumnDefinition): string {
        switch (column.type) {
            case 'bigInteger': return 'BIGINT';
            case 'integer': return 'INTEGER';
            case 'string': return `VARCHAR(${column.length || 255})`;
            case 'boolean': return 'BOOLEAN';
            case 'text': return 'TEXT';
            case 'timestamp': return 'TIMESTAMP';
            case 'decimal': return `DECIMAL(${column.precision || 8}, ${column.scale || 2})`;
            case 'date': return 'DATE';
            case 'datetime': return 'TIMESTAMP';
            case 'json': return 'JSONB';
            default: return 'VARCHAR(255)';
        }
    }
}
