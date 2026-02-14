import { Model, ModelQueryBuilder } from './Model';
import { Database } from '../Database';

/**
 * Base class for all relationship types
 */
export abstract class Relation<T extends Model = Model> {
    constructor(
        protected related: typeof Model,
        protected parent: Model
    ) { }

    abstract get(): Promise<T | T[] | null>;
}

/**
 * Has One relationship
 */
export class HasOne<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected foreignKey: string,
        protected localKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T | null> {
        const parentKeyValue = (this.parent as any)[this.localKey];

        if (!parentKeyValue) {
            return null;
        }

        return await this.related
            .where(this.foreignKey, parentKeyValue)
            .first() as T | null;
    }

    query(): ModelQueryBuilder<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().where(this.foreignKey, parentKeyValue);
    }
}

/**
 * Has Many relationship
 */
export class HasMany<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected foreignKey: string,
        protected localKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T[]> {
        const parentKeyValue = (this.parent as any)[this.localKey];

        if (!parentKeyValue) {
            return [];
        }

        return await this.related
            .where(this.foreignKey, parentKeyValue)
            .get() as T[];
    }

    query(): ModelQueryBuilder<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().where(this.foreignKey, parentKeyValue);
    }
}

/**
 * Belongs To relationship
 */
export class BelongsTo<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected foreignKey: string,
        protected ownerKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T | null> {
        const foreignKeyValue = (this.parent as any)[this.foreignKey];

        if (!foreignKeyValue) {
            return null;
        }

        return await this.related
            .where(this.ownerKey, foreignKeyValue)
            .first() as T | null;
    }

    query(): ModelQueryBuilder<T> {
        const foreignKeyValue = (this.parent as any)[this.foreignKey];
        return this.related.query<T>().where(this.ownerKey, foreignKeyValue);
    }
}

/**
 * Belongs To Many relationship (many-to-many)
 */
export class BelongsToMany<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected pivotTable: string,
        protected foreignPivotKey: string,
        protected relatedPivotKey: string,
        protected parentKey: string = 'id',
        protected relatedKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T[]> {
        const parentKeyValue = (this.parent as any)[this.parentKey];

        if (!parentKeyValue) {
            return [];
        }

        const relatedTable = (this.related as any).table;
        const connection = await Database.connection((this.related as any).connection);

        // Build the query with a join
        const sql = `
            SELECT ${relatedTable}.*
            FROM ${relatedTable}
            INNER JOIN ${this.pivotTable} 
                ON ${relatedTable}.${this.relatedKey} = ${this.pivotTable}.${this.relatedPivotKey}
            WHERE ${this.pivotTable}.${this.foreignPivotKey} = ?
        `;

        const results = await connection.query(sql, [parentKeyValue]);

        // Hydrate the results into model instances
        return results.map((data: any) => {
            const instance = new (this.related as any)();
            Object.assign(instance, data);
            return instance as T;
        });
    }
}
