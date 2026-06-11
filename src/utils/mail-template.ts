import fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import { StatusMailPayload } from "../interfaces/report.interface";

export const htmlGenerator = (data: StatusMailPayload) => {
  const templatePath = path.join(__dirname, "templates", "status-update.hbs");
  const templateSource = fs.readFileSync(templatePath, "utf8");

  // Compile template
  const template = Handlebars.compile(templateSource);

  return template(data);
};
