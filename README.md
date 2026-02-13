# @arikajs/database

**@arikajs/database** is the official database layer for the ArikaJS framework.  
It provides a powerful, extensible, and framework-integrated database system inspired by Laravel's Eloquent & Query Builder — but designed natively for **Node.js & TypeScript**.

This package powers **DB facade**, **Models**, **Migrations**, and **Query Builder** across all ArikaJS applications.

---

## ✨ Features

### ✅ Available (v0.x)
- ✅ Multiple database connections
- ✅ MySQL, PostgreSQL & SQLite support
- ✅ Fluent Query Builder
- ✅ Static Model querying
- ✅ Instance-style Models (Active Record)
- ✅ Relationships (hasOne, hasMany, belongsTo, belongsToMany)
- ✅ Eager Loading
- ✅ Query Scopes
- ✅ Soft Deletes
- ✅ DB Facade (`DB.table()`)
- ✅ Migrations & Schema Builder
- ✅ Database Seeders
- ✅ Framework-integrated configuration
- ✅ TypeScript-first design
- ✅ Works with native ArikaJS DI container

---

## 📦 Supported Drivers

| Driver | Status |
| --- | --- |
| MySQL | ✅ Supported |
| PostgreSQL | ✅ Supported |
| SQLite | ✅ Supported |

---

## 📦 Installation

```bash
npm install @arikajs/database
```

---

## ⚙️ Configuration

**config/database.ts**

```typescript
import { env } from '@arikajs/config';

export default {
  default: env('DB_CONNECTION', 'mysql'),

  connections: {
    mysql: {
      driver: 'mysql',
      host: env('DB_HOST', '127.0.0.1'),
      port: env('DB_PORT', 3306),
      database: env('DB_DATABASE', 'arikajs'),
      username: env('DB_USERNAME', 'root'),
      password: env('DB_PASSWORD', ''),
    },

    pgsql: {
      driver: 'pgsql',
      host: env('DB_HOST', '127.0.0.1'),
      port: env('DB_PORT', 5432),
      database: env('DB_DATABASE', 'arikajs'),
      username: env('DB_USERNAME', 'postgres'),
      password: env('DB_PASSWORD', ''),
    },

    sqlite: {
      driver: 'sqlite',
      database: env('DB_DATABASE', 'database.sqlite'),
    },
  },
};
```

---

## 🧠 Usage

### DB Facade (Query Builder)

```typescript
import { DB } from '@arikajs/database';

const users = await DB.table('users')
  .where('active', true)
  .orderBy('id', 'desc')
  .get();

await DB.table('users').insert({
  name: 'John',
  email: 'john@example.com',
});
```

### 🧬 Models (Static Style)

```typescript
import { Model } from '@arikajs/database';

export class User extends Model {
  static table = 'users';
}

const users = await User.where('active', true).get();
const user = await User.find(1);
```

### 💾 Instance-style Models

```typescript
// Create new record
const user = new User();
user.name = 'John';
user.email = 'john@example.com';
await user.save();

// Update existing record
const user = await User.find(1);
user.name = 'Updated Name';
await user.save();

// Delete record
await user.deleteInstance();

// Dirty checking
user.name = 'New Name';
console.log(user.isDirty()); // true
console.log(user.getDirty()); // { name: 'New Name' }
```

### 🔗 Relationships

```typescript
class User extends Model {
  static table = 'users';

  posts() {
    return this.hasMany(Post, 'user_id');
  }

  profile() {
    return this.hasOne(Profile, 'user_id');
  }
}

class Post extends Model {
  static table = 'posts';

  author() {
    return this.belongsTo(User, 'user_id');
  }

  tags() {
    return this.belongsToMany(Tag, 'post_tag', 'post_id', 'tag_id');
  }
}

// Using relationships
const user = await User.find(1);
const posts = await user.posts().get();
const profile = await user.profile().get();
```

### ⚡ Eager Loading

```typescript
// Eager load relationships
const users = await User.with('posts').get();

// Eager load with constraints
const users = await User.with({
  posts: q => q.where('published', true),
}).get();

// Multiple relationships
const users = await User.with(['posts', 'profile']).get();
```

### 🎯 Query Scopes

```typescript
class User extends Model {
  static table = 'users';

  static active<T extends Model>(this: typeof Model) {
    return this.query<T>().where('active', true);
  }

  static verified<T extends Model>(this: typeof Model) {
    return this.query<T>().where('email_verified', true);
  }
}

// Using scopes
const activeUsers = await User.active().get();
const verifiedActiveUsers = await User.active().verified().get();
```

### 🗑 Soft Deletes

```typescript
import { Model, withSoftDeletes } from '@arikajs/database';

class User extends withSoftDeletes(Model) {
  static table = 'users';
}

// Soft delete (sets deleted_at timestamp)
await User.delete(1);

// Get all records including soft deleted
const allUsers = await User.withTrashed().get();

// Get only soft deleted records
const trashedUsers = await User.onlyTrashed().get();

// Restore a soft deleted record
await User.restore(1);

// Permanently delete
await User.forceDelete(1);
```

### 🧱 Migrations (via CLI – planned)

```bash
arika make:migration create_users_table
arika migrate
```

---

## 🧩 Architecture Overview

```
database/
├── src/
│   ├── Connections/
│   │   ├── MySQLConnection
│   │   ├── PostgreSQLConnection
│   │   └── SQLiteConnection
│   ├── Model/
│   │   ├── Model
│   │   ├── Relations
│   │   └── SoftDeletes
│   ├── QueryBuilder
│   ├── Schema
│   ├── DatabaseManager
│   └── Facades/
│       └── DB
├── config/
│   └── database.ts
└── README.md
```

---

## 🚧 Planned Features (Roadmap)

The following features are designed and planned and will be introduced incrementally **without breaking existing APIs**.

### 🎪 Model Events
```typescript
class User extends Model {
  static booted() {
    this.creating((user) => {
      user.uuid = generateUuid();
    });
    
    this.updated((user) => {
      // Clear cache, send notifications, etc.
    });
  }
}
```

### ⚡ Query Result Caching
```typescript
const users = await User.where('active', true)
  .cache(3600) // Cache for 1 hour
  .get();
```

### 🔍 Advanced Query Features
- Subqueries
- Union queries
- Raw expressions
- Database-specific functions

---

## 🧠 Design Philosophy

**"Power without magic."**

- One Query Builder
- No hidden globals
- Predictable SQL
- Laravel-like DX, Node.js performance

---

## 🔗 Framework Integration

- **@arikajs/foundation** → DI & lifecycle
- **@arikajs/config** → .env & config loading
- **@arikajs/cli** → migrations & generators
- **arikajs** → meta framework wiring

---

## 🧭 Versioning Strategy

- **0.x** → API stabilisation
- **1.0** → Stable contracts
- No breaking changes without major version bump

---

## 📄 License

MIT License © ArikaJS
