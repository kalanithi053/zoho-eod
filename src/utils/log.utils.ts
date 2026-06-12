import { TrackModuleBodyDto } from "../dto/track.dto";
import {
  WORK_START,
  splitIntoSegments,
  formatTime,
  skipBreaks,
} from "./time.utils";

const BASE_LOG_PAYLOAD = {
  frompage: "taskdetails",
  notes: "<div>Worked on API integration</div>",
  bill_status: "Billable",
  for_timer: false,
};

export const buildLogPayload = (
  rest: Record<string, any>,
  start_time: string,
  end_time: string,
) => ({ ...rest, ...BASE_LOG_PAYLOAD, start_time, end_time });

const formateTimes = (time: string): string => {
  const [hour, period] = time.split(" ");
  const [h, m] = hour.split(":");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

export const buildLogPayloads = (
  body: TrackModuleBodyDto[],
): Record<string, any>[] => {
  const payloads: Record<string, any>[] = [];
  let cursor = WORK_START;

  for (const { start_time = "", end_time = "", duration, ...rest } of body) {
    const isDurationOnly = !start_time && !end_time && !Number.isNaN(duration);

    if (isDurationOnly) {
      const segments = splitIntoSegments(cursor, Math.round(duration * 60));

      for (const { start, end } of segments) {
        payloads.push(
          buildLogPayload(rest, formatTime(start), formatTime(end)),
        );
      }

      cursor = skipBreaks(segments[segments.length - 1].end);
    } else {
      buildLogPayload(rest, formateTimes(start_time), formateTimes(end_time));
    }
  }
  return payloads;
};
