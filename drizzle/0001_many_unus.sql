ALTER TABLE "shadcn_tasks" ALTER COLUMN "code" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "shadcn_tasks" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shadcn_tasks" ALTER COLUMN "title" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "shadcn_tasks" ALTER COLUMN "status" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "shadcn_tasks" ALTER COLUMN "label" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "shadcn_tasks" ALTER COLUMN "priority" SET DATA TYPE varchar(30);