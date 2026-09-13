export const CATEGORIES = [
  { id: "gym", label: "Gym", hint: "Workouts and movement" },
  { id: "care", label: "Care", hint: "Bathing, rest, making the bed" },
  { id: "cleaning", label: "Cleaning", hint: "Rooms, floors, bathroom" },
  { id: "cooking", label: "Cooking", hint: "Meals and prep" },
  { id: "laundry", label: "Laundry", hint: "Wash, dry, fold" },
  { id: "kitchen", label: "Kitchen", hint: "Counters, sink, stove" },
  { id: "other", label: "Other", hint: "Anything else around the house" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const TIMES_OF_DAY = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
] as const;

export type TimeOfDay = (typeof TIMES_OF_DAY)[number]["id"];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export function isTimeOfDay(value: string): value is TimeOfDay {
  return TIMES_OF_DAY.some((t) => t.id === value);
}

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const DEFAULT_ROUTINES: Array<{
  title: string;
  category: CategoryId;
  weekdays: string;
  timeOfDay: TimeOfDay;
  estimatedMinutes: number;
}> = [
  {
    title: "Morning workout",
    category: "gym",
    weekdays: "1,3,5",
    timeOfDay: "morning",
    estimatedMinutes: 40,
  },
  {
    title: "Shower",
    category: "care",
    weekdays: "0,1,2,3,4,5,6",
    timeOfDay: "morning",
    estimatedMinutes: 15,
  },
  {
    title: "Make the bed",
    category: "care",
    weekdays: "0,1,2,3,4,5,6",
    timeOfDay: "morning",
    estimatedMinutes: 5,
  },
  {
    title: "Make breakfast",
    category: "cooking",
    weekdays: "0,1,2,3,4,5,6",
    timeOfDay: "morning",
    estimatedMinutes: 20,
  },
  {
    title: "Wipe kitchen counters",
    category: "kitchen",
    weekdays: "0,1,2,3,4,5,6",
    timeOfDay: "morning",
    estimatedMinutes: 10,
  },
  {
    title: "Cook dinner",
    category: "cooking",
    weekdays: "0,1,2,3,4,5,6",
    timeOfDay: "evening",
    estimatedMinutes: 40,
  },
  {
    title: "Laundry",
    category: "laundry",
    weekdays: "2,6",
    timeOfDay: "afternoon",
    estimatedMinutes: 30,
  },
  {
    title: "Clean bathroom",
    category: "cleaning",
    weekdays: "0",
    timeOfDay: "afternoon",
    estimatedMinutes: 25,
  },
  {
    title: "Sweep floors",
    category: "cleaning",
    weekdays: "3,6",
    timeOfDay: "afternoon",
    estimatedMinutes: 20,
  },
  {
    title: "Take out trash",
    category: "cleaning",
    weekdays: "0,1,2,3,4,5,6",
    timeOfDay: "evening",
    estimatedMinutes: 5,
  },
];
