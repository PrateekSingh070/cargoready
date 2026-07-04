import rawCourse from "@/content/air-cargo-basics.json?raw";
import { courseSchema } from "@/content/schema";

export function loadCourse(source: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return { success: false as const, reason: "invalid-json" as const };
  }
  return courseSchema.safeParse(parsed);
}

export const courseContent = loadCourse(rawCourse);

export function lessonPath(moduleId: string, lessonId: string) {
  return `/course/${moduleId}/lessons/${lessonId}`;
}
