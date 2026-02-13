// Core exports
export { Database } from './Database';
export { DatabaseManager } from './DatabaseManager';

// DB Facade alias (for convenience)
export { Database as DB } from './Database';

// Connections
export { MySQLConnection } from './Connections/MySQLConnection';
export { PostgreSQLConnection } from './Connections/PostgreSQLConnection';
export { SQLiteConnection } from './Connections/SQLiteConnection';

// Query Builder
export { QueryBuilder } from './Query/QueryBuilder';

// Model
export { Model, ModelQueryBuilder } from './Model/Model';
export { HasOne, HasMany, BelongsTo, BelongsToMany, Relation } from './Model/Relations';
export { withSoftDeletes, SoftDeletes } from './Model/SoftDeletes';

// Schema
export { Schema, TableBlueprint, ColumnDefinition, ForeignKeyDefinition } from './Schema/Schema';
export { SchemaBuilder } from './Schema/SchemaBuilder';

// Migrations
export { Migration } from './Migrations/Migration';
export { Migrator } from './Migrations/Migrator';

// Seeders
export { Seeder } from './Seeders/Seeder';
export { SeedRunner } from './Seeders/SeedRunner';

// Contracts
export type {
    Connection,
    ConnectionConfig,
    DatabaseConfig,
    QueryBuilder as QueryBuilderInterface,
} from './Contracts/Database';

export type {
    Blueprint,
    ColumnDefinition as ColumnDefinitionInterface,
    ForeignKeyDefinition as ForeignKeyDefinitionInterface,
    SchemaCallback,
} from './Contracts/Schema';
