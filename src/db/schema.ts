import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'commands' table for terminal command history persistence.
export const commands = pgTable('commands', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  command: text('command').notNull(),
  output: text('output'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Define the 'settings' table for persisting system configurations.
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }) => ({
  commands: many(commands),
  settings: many(settings),
}));

// Define relationships for the 'commands' table.
export const commandsRelations = relations(commands, ({ one }) => ({
  user: one(users, {
    fields: [commands.userId],
    references: [users.id],
  }),
}));

// Define relationships for the 'settings' table.
export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));
