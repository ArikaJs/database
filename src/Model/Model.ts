import { Database } from '../Database';
import { QueryBuilder } from '../Query/QueryBuilder';
import { HasOne, HasMany, BelongsTo, BelongsToMany } from './Relations';

/**
 * Base Model class for Active Record pattern
 */
export class Model {
    /**
     * The table associated with the model
     */
    protected static table: string = '';

    /**
     * Instance table name (for backward compatibility)
     */
    protected table: string = '';

    /**
     * The connection name for the model
     */
    protected static connection?: string;

    /**
     * Instance connection (for backward compatibility)
     */
    protected connection?: string;

    /**
     * The primary key for the model
     */
    protected static primaryKey: string = 'id';

    /**
     * Instance primary key (for backward compatibility)
     */
    protected primaryKey: string = 'id';

    /**
     * Indicates if the model exists in the database
     */
    protected exists: boolean = false;

    /**
     * The model's original attributes (for dirty checking)
     */
    protected original: Record<string, any> = {};

    /**
     * The model's attributes
     */
    protected attributes: Record<string, any> = {};

    /**
     * Loaded relationships
     */
    protected relations: Record<string, any> = {};

    /**
     * Create a new query builder for the model
     */
    static query<T extends Model>(this: typeof Model): ModelQueryBuilder<T> {
        const queryBuilder = Database.table(this.getTableName(), this.getConnectionName());
        return new ModelQueryBuilder(queryBuilder, this as any);
    }

    /**
     * Find a record by ID
     */
    static async find<T extends Model>(this: typeof Model, id: any): Promise<T | null> {
        return this.query<T>().find(id);
    }

    /**
     * Find a record by ID or throw an error
     */
    static async findOrFail<T extends Model>(this: typeof Model, id: any): Promise<T> {
        const result = await this.find<T>(id);
        if (!result) {
            throw new Error(`${this.name} not found with ID ${id}`);
        }
        return result;
    }

    /**
     * Get all records
     */
    static async all<T extends Model>(this: typeof Model): Promise<T[]> {
        return this.query<T>().all();
    }

    /**
     * Add a where clause
     */
    static where<T extends Model>(this: typeof Model, column: string, operator: any, value?: any): ModelQueryBuilder<T> {
        return this.query<T>().where(column, operator, value);
    }

    /**
     * Add an OR where clause
     */
    static orWhere<T extends Model>(this: typeof Model, column: string, operator: any, value?: any): ModelQueryBuilder<T> {
        return this.query<T>().orWhere(column, operator, value);
    }

    /**
     * Add a where in clause
     */
    static whereIn<T extends Model>(this: typeof Model, column: string, values: any[]): ModelQueryBuilder<T> {
        return this.query<T>().whereIn(column, values);
    }

    /**
     * Add a where not in clause
     */
    static whereNotIn<T extends Model>(this: typeof Model, column: string, values: any[]): ModelQueryBuilder<T> {
        return this.query<T>().whereNotIn(column, values);
    }

    /**
     * Add a where null clause
     */
    static whereNull<T extends Model>(this: typeof Model, column: string): ModelQueryBuilder<T> {
        return this.query<T>().whereNull(column);
    }

    /**
     * Add a where not null clause
     */
    static whereNotNull<T extends Model>(this: typeof Model, column: string): ModelQueryBuilder<T> {
        return this.query<T>().whereNotNull(column);
    }

    /**
     * Add an order by clause
     */
    static orderBy<T extends Model>(this: typeof Model, column: string, direction?: 'asc' | 'desc'): ModelQueryBuilder<T> {
        return this.query<T>().orderBy(column, direction);
    }

    /**
     * Add a limit clause
     */
    static limit<T extends Model>(this: typeof Model, limit: number): ModelQueryBuilder<T> {
        return this.query<T>().limit(limit);
    }

    /**
     * Add an offset clause
     */
    static offset<T extends Model>(this: typeof Model, offset: number): ModelQueryBuilder<T> {
        return this.query<T>().offset(offset);
    }

    /**
     * Create a new record
     */
    static async create<T extends Model>(this: typeof Model, data: Record<string, any>): Promise<T> {
        return this.query<T>().create(data);
    }

    /**
     * Get the first record
     */
    static async first<T extends Model>(this: typeof Model): Promise<T | null> {
        return this.query<T>().first();
    }

    /**
     * Get records
     */
    static async get<T extends Model>(this: typeof Model): Promise<T[]> {
        return this.query<T>().get();
    }

    /**
     * Get the count of records
     */
    static async count(this: typeof Model, column?: string): Promise<number> {
        return this.query().count(column);
    }

    /**
     * Eager load relationships
     */
    static with<T extends Model>(
        this: typeof Model,
        relations: string | string[] | Record<string, (q: QueryBuilder) => void>
    ): ModelQueryBuilder<T> {
        return this.query<T>().with(relations);
    }

    /**
     * Delete a record by ID
     */
    static async delete(id: any): Promise<number> {
        return this.query().delete(id);
    }

    /**
     * Get the table name
     */
    protected static getTableName(): string {
        if (!this.table) {
            throw new Error('Table name not defined for model');
        }
        return this.table;
    }

    /**
     * Get the connection name
     */
    protected static getConnectionName(): string | undefined {
        return this.connection;
    }

    /**
     * Get the primary key
     */
    protected static getPrimaryKeyName(): string {
        return this.primaryKey;
    }

    /**
     * Get the table name (instance method)
     */
    protected getTable(): string {
        const constructor = this.constructor as typeof Model;
        return constructor.getTableName();
    }

    /**
     * Get the connection name (instance method)
     */
    protected getConnection(): string | undefined {
        const constructor = this.constructor as typeof Model;
        return constructor.getConnectionName();
    }

    /**
     * Get the primary key (instance method)
     */
    protected getPrimaryKey(): string {
        const constructor = this.constructor as typeof Model;
        return constructor.getPrimaryKeyName();
    }

    // ==================== Instance Methods ====================

    /**
     * Get an attribute value
     */
    getAttribute(key: string): any {
        return this.attributes[key];
    }

    /**
     * Set an attribute value
     */
    setAttribute(key: string, value: any): void {
        this.attributes[key] = value;
    }

    /**
     * Fill the model with an array of attributes
     */
    fill(attributes: Record<string, any>): this {
        for (const [key, value] of Object.entries(attributes)) {
            this.setAttribute(key, value);
        }
        return this;
    }

    /**
     * Save the model to the database
     */
    async save(): Promise<boolean> {
        const query = Database.table(this.getTable(), this.getConnection());

        if (this.exists) {
            // Update existing record
            const primaryKey = this.getPrimaryKey();
            const id = this.attributes[primaryKey];

            if (!id) {
                throw new Error('Cannot update model without primary key value');
            }

            const dirty = this.getDirty();
            if (Object.keys(dirty).length === 0) {
                return true; // No changes to save
            }

            await query.where(primaryKey, id).update(dirty);
            this.syncOriginal();
            return true;
        } else {
            // Insert new record
            const result = await query.insert(this.attributes);

            // Set the primary key if it was auto-generated
            const primaryKey = this.getPrimaryKey();
            if (result && result.insertId && !this.attributes[primaryKey]) {
                this.attributes[primaryKey] = result.insertId;
            }

            this.exists = true;
            this.syncOriginal();
            return true;
        }
    }

    /**
     * Delete the model from the database
     */
    async deleteInstance(): Promise<boolean> {
        if (!this.exists) {
            return false;
        }

        const primaryKey = this.getPrimaryKey();
        const id = this.attributes[primaryKey];

        if (!id) {
            throw new Error('Cannot delete model without primary key value');
        }

        const query = Database.table(this.getTable(), this.getConnection());
        await query.where(primaryKey, id).delete();

        this.exists = false;
        return true;
    }

    /**
     * Refresh the model from the database
     */
    async refresh(): Promise<this> {
        if (!this.exists) {
            throw new Error('Cannot refresh a model that does not exist');
        }

        const primaryKey = this.getPrimaryKey();
        const id = this.attributes[primaryKey];

        const fresh = await Database.table(this.getTable(), this.getConnection())
            .where(primaryKey, id)
            .first();

        if (!fresh) {
            throw new Error('Model not found in database');
        }

        this.attributes = fresh;
        this.syncOriginal();

        return this;
    }

    /**
     * Get the attributes that have been changed since last sync
     */
    getDirty(): Record<string, any> {
        const dirty: Record<string, any> = {};

        for (const [key, value] of Object.entries(this.attributes)) {
            if (this.original[key] !== value) {
                dirty[key] = value;
            }
        }

        return dirty;
    }

    /**
     * Check if the model or specific attribute is dirty
     */
    isDirty(attribute?: string): boolean {
        if (attribute) {
            return this.original[attribute] !== this.attributes[attribute];
        }

        return Object.keys(this.getDirty()).length > 0;
    }

    /**
     * Sync the original attributes with the current attributes
     */
    protected syncOriginal(): void {
        this.original = { ...this.attributes };
    }

    /**
     * Mark the model as existing
     */
    setExists(exists: boolean): this {
        this.exists = exists;
        return this;
    }

    /**
     * Convert the model to a plain object
     */
    toJSON(): Record<string, any> {
        return {
            ...this.attributes,
            ...this.relations,
        };
    }

    // ==================== Relationship Methods ====================

    /**
     * Define a has-one relationship
     */
    protected hasOne<T extends Model>(
        related: typeof Model,
        foreignKey?: string,
        localKey?: string
    ): HasOne<T> {
        const fk = foreignKey || `${this.getTable()}_id`;
        const lk = localKey || this.getPrimaryKey();
        return new HasOne<T>(related, this, fk, lk);
    }

    /**
     * Define a has-many relationship
     */
    protected hasMany<T extends Model>(
        related: typeof Model,
        foreignKey?: string,
        localKey?: string
    ): HasMany<T> {
        const fk = foreignKey || `${this.getTable()}_id`;
        const lk = localKey || this.getPrimaryKey();
        return new HasMany<T>(related, this, fk, lk);
    }

    /**
     * Define a belongs-to relationship
     */
    protected belongsTo<T extends Model>(
        related: typeof Model,
        foreignKey?: string,
        ownerKey?: string
    ): BelongsTo<T> {
        const relatedTable = (related as any).table;
        const fk = foreignKey || `${relatedTable}_id`;
        const ok = ownerKey || 'id';
        return new BelongsTo<T>(related, this, fk, ok);
    }

    /**
     * Define a belongs-to-many relationship
     */
    protected belongsToMany<T extends Model>(
        related: typeof Model,
        pivotTable?: string,
        foreignPivotKey?: string,
        relatedPivotKey?: string,
        parentKey?: string,
        relatedKey?: string
    ): BelongsToMany<T> {
        const relatedTable = (related as any).table;
        const thisTable = this.getTable();

        const pivot = pivotTable || [thisTable, relatedTable].sort().join('_');
        const fpk = foreignPivotKey || `${thisTable}_id`;
        const rpk = relatedPivotKey || `${relatedTable}_id`;
        const pk = parentKey || this.getPrimaryKey();
        const rk = relatedKey || 'id';

        return new BelongsToMany<T>(related, this, pivot, fpk, rpk, pk, rk);
    }

    /**
     * Get a relationship value
     */
    getRelation(name: string): any {
        return this.relations[name];
    }

    /**
     * Set a relationship value
     */
    setRelation(name: string, value: any): this {
        this.relations[name] = value;
        return this;
    }

    /**
     * Load a relationship
     */
    async load(relation: string): Promise<this> {
        if (typeof (this as any)[relation] === 'function') {
            const relationInstance = (this as any)[relation]();
            const result = await relationInstance.get();
            this.setRelation(relation, result);
        }
        return this;
    }
}

/**
 * Model query builder wrapper
 */
export class ModelQueryBuilder<T extends Model> {
    private eagerLoad: Map<string, ((q: QueryBuilder) => void) | null> = new Map();

    constructor(
        private queryBuilder: QueryBuilder,
        private modelClass: new () => T
    ) { }

    /**
     * Get all records
     */
    async all(): Promise<T[]> {
        const results = await this.queryBuilder.get();
        const models = results.map(data => this.hydrate(data));
        return await this.loadRelations(models);
    }

    /**
     * Find a record by ID
     */
    async find(id: any): Promise<T | null> {
        const instance = new this.modelClass();
        const result = await this.queryBuilder
            .where(instance['getPrimaryKey'](), id)
            .first();

        if (!result) {
            return null;
        }

        const model = this.hydrate(result);
        await this.loadRelations([model]);
        return model;
    }

    /**
     * Create a new record
     */
    async create(data: Record<string, any>): Promise<T> {
        const result = await this.queryBuilder.insert(data);
        const instance = this.hydrate(data);

        // Set the primary key if it was auto-generated
        const primaryKey = instance['getPrimaryKey']();
        if (result && result.insertId && !data[primaryKey]) {
            instance.setAttribute(primaryKey, result.insertId);
        }

        instance.setExists(true);
        instance['syncOriginal']();
        return instance;
    }

    /**
     * Add a where clause
     */
    where(column: string, operator: any, value?: any): this {
        this.queryBuilder.where(column, operator, value);
        return this;
    }

    /**
     * Add an OR where clause
     */
    orWhere(column: string, operator: any, value?: any): this {
        this.queryBuilder.orWhere(column, operator, value);
        return this;
    }

    /**
     * Add a where in clause
     */
    whereIn(column: string, values: any[]): this {
        this.queryBuilder.whereIn(column, values);
        return this;
    }

    /**
     * Add a where not in clause
     */
    whereNotIn(column: string, values: any[]): this {
        this.queryBuilder.whereNotIn(column, values);
        return this;
    }

    /**
     * Add a where null clause
     */
    whereNull(column: string): this {
        this.queryBuilder.whereNull(column);
        return this;
    }

    /**
     * Add a where not null clause
     */
    whereNotNull(column: string): this {
        this.queryBuilder.whereNotNull(column);
        return this;
    }

    /**
     * Add an order by clause
     */
    orderBy(column: string, direction?: 'asc' | 'desc'): this {
        this.queryBuilder.orderBy(column, direction);
        return this;
    }

    /**
     * Add a limit clause
     */
    limit(limit: number): this {
        this.queryBuilder.limit(limit);
        return this;
    }

    /**
     * Add an offset clause
     */
    offset(offset: number): this {
        this.queryBuilder.offset(offset);
        return this;
    }

    /**
     * Update records
     */
    async update(data: Record<string, any>): Promise<number> {
        return await this.queryBuilder.update(data);
    }

    /**
     * Delete a record by ID
     */
    async delete(id?: any): Promise<number> {
        if (id !== undefined) {
            const instance = new this.modelClass();
            this.queryBuilder.where(instance['getPrimaryKey'](), id);
        }
        return await this.queryBuilder.delete();
    }

    /**
     * Get the first record
     */
    async first(): Promise<T | null> {
        const result = await this.queryBuilder.first();
        if (!result) {
            return null;
        }

        const model = this.hydrate(result);
        await this.loadRelations([model]);
        return model;
    }

    /**
     * Get records
     */
    async get(): Promise<T[]> {
        const results = await this.queryBuilder.get();
        const models = results.map(data => this.hydrate(data));
        return await this.loadRelations(models);
    }

    /**
     * Get the count of records
     */
    async count(column?: string): Promise<number> {
        return await this.queryBuilder.count(column);
    }

    /**
     * Eager load relationships
     */
    with(relations: string | string[] | Record<string, (q: QueryBuilder) => void>): this {
        if (typeof relations === 'string') {
            this.eagerLoad.set(relations, null);
        } else if (Array.isArray(relations)) {
            relations.forEach(rel => this.eagerLoad.set(rel, null));
        } else {
            Object.entries(relations).forEach(([rel, callback]) => {
                this.eagerLoad.set(rel, callback);
            });
        }
        return this;
    }

    /**
     * Hydrate a model instance from data
     */
    private hydrate(data: Record<string, any>): T {
        const instance = new this.modelClass();
        instance['attributes'] = { ...data };
        instance['original'] = { ...data };
        instance['exists'] = true;
        return instance;
    }

    /**
     * Load eager loaded relationships
     */
    private async loadRelations(models: T[]): Promise<T[]> {
        if (models.length === 0 || this.eagerLoad.size === 0) {
            return models;
        }

        for (const [relation, callback] of this.eagerLoad.entries()) {
            for (const model of models) {
                if (typeof (model as any)[relation] === 'function') {
                    const relationInstance = (model as any)[relation]();

                    // Apply callback if provided
                    if (callback && relationInstance.query) {
                        callback(relationInstance.query());
                    }

                    const result = await relationInstance.get();
                    model.setRelation(relation, result);
                }
            }
        }

        return models;
    }
}
