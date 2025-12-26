export interface INotificationItem {
  readonly id: any;
  readonly duration: number;
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly name: string;
  readonly url: string;
  readonly textHeader: string;
  readonly textFooter: string;
  readonly type: "general" | "lesson";
  readonly textBody: string | null;
  readonly textLessonSubject: string;
  readonly textLessonLecturer: string;
  readonly textLessonTitle: string;
}

export class NotificationItem implements INotificationItem {
  readonly id: any;
  readonly duration: number;
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly name: string;
  readonly url: string;
  readonly textHeader: string;
  readonly textFooter: string;
  readonly type: "general" | "lesson";
  readonly textBody: string | null;
  readonly textLessonSubject: string;
  readonly textLessonLecturer: string;
  readonly textLessonTitle: string;

  constructor(options: INotificationItem) {
    this.id = options.id;
    this.duration = options.duration;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.name = options.name;

    this.url = options.url;
    this.textHeader = options.textHeader;
    this.textFooter = options.textFooter;
    this.type = options.type;

    this.textBody = this.type !== "general" ? "" : options.textBody;
    this.textLessonSubject =
      this.type !== "lesson" ? "" : options.textLessonSubject;
    this.textLessonLecturer =
      this.type !== "lesson" ? "" : options.textLessonLecturer;
    this.textLessonTitle =
      this.type !== "lesson" ? "" : options.textLessonTitle;
  }

  isActive(now: Date) {
    return (
      now >= this.startDate && (this.endDate === null || now < this.endDate)
    );
  }
}

export class NotificationController {
  readonly notifications: NotificationItem[];

  constructor(notifications: NotificationItem[]) {
    this.notifications = notifications.slice();
  }

  activeNotifications(now: Date) {
    return this.notifications.filter((notification) =>
      notification.isActive(now),
    );
  }
}
