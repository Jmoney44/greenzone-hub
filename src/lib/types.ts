export type Role = "PARENT" | "TEACHER" | "ADMIN";
export type User = { id: string; name: string; email: string; role: Role; subscriptionEndsAt: Date | null; createdAt: Date };
export type Me = User;
export type Topic = { id: string; name: string };
export type Course = { id: string; title: string; description: string; position: number; published: boolean; createdAt: Date };
export type Progress = { userId: string; videoId: string; positionSeconds: number; completed: boolean; completedAt: Date | null; updatedAt: Date };
export type Video = {
  id: string; title: string; description: string; hub: "PARENTS" | "TEACHERS"; topicId: string | null; courseId: string | null;
  position: number; sourceType: "FILE" | "URL" | "YOUTUBE";
  /** Only the YouTube id (for thumbnails). The real file name or link comes from videoSource(). */
  source: string;
  durationSeconds: number; resourceUrl: string; resourceLabel: string; published: boolean; createdAt: Date;
  topic: Topic | null; course: Course | null;
};
export type Payment = {
  id: string; reference: string; email: string; userId: string | null; amount: string; source: string; createdAt: Date;
  user: { name: string } | null;
};
