
import { TableBlueprint, ColumnDefinition } from '../Schema';
import { Grammar } from './Grammar';

/**
 * SQLite grammar for schema building
 */
export class SQLiteGrammar extends Grammar {
    public compileCreate(blueprint: TableBlueprint): string {
        const columns = blueprint.getColumns().map(column => this.compileColumn(column));

        return `CREATE TABLE ${blueprint.tableName} (\n  ${columns.join(',\n  ')}\n)`;
    }

    public compileDrop(tableName: string): string {
        return `DROP TABLE ${tableName}`;
    }

    public compileDropIfExists(tableName: string): string {
        return `DROP TABLE IF EXISTS ${tableName}`;
    }

    protected compileColumn(column: ColumnDefinition): string {
        let sql = `${column.name} ${this.getType(column)}`;

        if (column.primary) {
            sql += ' PRIMARY KEY';
            if (column.autoIncrement) {
                sql += ' AUTOINCREMENT';
            }
        }

        if (!column.nullable_) {
            sql += ' NOT NULL';
        }

        if (column.unique_) {
            sql += ' UNIQUE';
        }

        sql += this.getDefault(column);

        return sql;
    }

    protected getType(column: ColumnDefinition): string {
        switch (column.type) {
            case 'bigInteger': return 'INTEGER';
            case 'integer': return 'INTEGER';
            case 'string': return 'TEXT';
            case 'boolean': return 'INTEGER';
            case 'text': return 'TEXT';
            case 'timestamp': return 'DATETIME';
            case 'decimal': return 'NUMERIC';
            case 'date': return 'DATE';
            case 'datetime': return 'DATETIME';
            case 'json': return 'TEXT';
            default: return 'TEXT';
        }
    }
}
