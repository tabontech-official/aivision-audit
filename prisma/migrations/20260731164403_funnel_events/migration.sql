-- CreateTable
CREATE TABLE "funnel_events" (
    "id" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "report_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnel_events_event_created_at_idx" ON "funnel_events"("event", "created_at");
