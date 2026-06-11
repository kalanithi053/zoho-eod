import { format, parseISO } from "date-fns";
import { GetTimeLogDto } from "../dto/get-time-log.dto";

export const getLogBuiilder = (query: GetTimeLogDto) => {
  const { userId, startDate, endDate } = query;
  return {
    page: 1,
    per_page: 500,
    view_type: "customdate",
    start_date: startDate,
    end_date: endDate,
    filter: JSON.stringify({
      criteria: [
        {
          field_name: "user",
          criteria_condition: "is",
          value: [userId],
        },
      ],
      pattern: "1",
    }),
    module: JSON.stringify({
      type: "task",
    }),
    fetch_by_modified_time: false,
  };
};

export const sendResponse = (response: Record<string, any>) => {
  return {
    totalHours: response.log_hours?.total_hours,
    projectName: response.time_logs?.[0]?.log_details?.[0]?.project?.name ?? "",
    reportDate: format(
      parseISO(response.time_logs[0].log_details[0].date),
      "EEEE, MMMM d, yyyy",
    ),
    resourceName:
      response.time_logs?.[0]?.log_details?.[0]?.owner?.first_name ?? "",
    logs:
      response.time_logs?.flatMap((day: any) =>
        day.log_details.map((log: any) => ({
          date: log.date,
          task: log.module_detail?.name,
          duration: log.log_hour,
          name: log.owner?.first_name,
        })),
      ) ?? [],
  };
};
