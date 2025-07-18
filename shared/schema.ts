import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema (keep existing implementation)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Downloads schema (for tracking downloads)
export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  format: text("format").notNull(), // mp3, mp4
  quality: text("quality").notNull(), // 480p, 720p, 1080p, 128kbps
  fileSize: text("file_size"),
  filePath: text("file_path"),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  downloadedAt: true,
});

export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;

// Video metadata schema (for caching)
export const videoMetadata = pgTable("video_metadata", {
  id: text("id").notNull().primaryKey(), // YouTube video ID
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  author: text("author").notNull(),
  duration: text("duration").notNull(),
  views: text("views").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export const insertVideoMetadataSchema = createInsertSchema(videoMetadata).omit({
  fetchedAt: true,
});

export type InsertVideoMetadata = z.infer<typeof insertVideoMetadataSchema>;
export type VideoMetadata = typeof videoMetadata.$inferSelect;
