"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
}

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedules")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setEvents(result.events);
      })
      .finally(() => setLoading(false));
  }, []);

  const groupByDate = (events: ScheduleEvent[]) => {
    const grouped: Record<string, ScheduleEvent[]> = {};
    events.forEach((event) => {
      const date = new Date(event.start).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(event);
    });
    return grouped;
  };

  const grouped = groupByDate(events);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-muted-foreground">Upcoming scheduled activities</p>
      </div>

      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <Card key={date} className="border border-gray-200 rounded-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {date}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {grouped[date].map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-md"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-gray-200 rounded-md">
          <CardContent className="py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-center">No scheduled events</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
