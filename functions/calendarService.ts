import { createMMKV } from 'react-native-mmkv';

export interface CustomCalendar {
    id: string;
    name: string;
    url: string;
    color: string;
    enabled: boolean;
}

const storage = createMMKV();
const CALENDARS_KEY = 'custom_calendars';

export const CalendarService = {
    getCalendars: (): CustomCalendar[] => {
        const json = storage.getString(CALENDARS_KEY);
        return json ? JSON.parse(json) : [];
    },

    saveCalendars: (calendars: CustomCalendar[]) => {
        storage.set(CALENDARS_KEY, JSON.stringify(calendars));
    },

    addCalendar: (calendar: Omit<CustomCalendar, 'id'>) => {
        const calendars = CalendarService.getCalendars();
        const newCalendar = { ...calendar, id: Date.now().toString() };
        calendars.push(newCalendar);
        CalendarService.saveCalendars(calendars);
        return newCalendar;
    },

    updateCalendar: (id: string, updates: Partial<CustomCalendar>) => {
        const calendars = CalendarService.getCalendars();
        const index = calendars.findIndex(c => c.id === id);
        if (index !== -1) {
            calendars[index] = { ...calendars[index], ...updates };
            CalendarService.saveCalendars(calendars);
        }
    },

    deleteCalendar: (id: string) => {
        const calendars = CalendarService.getCalendars();
        const filtered = calendars.filter(c => c.id !== id);
        CalendarService.saveCalendars(filtered);
    },

    toggleCalendar: (id: string) => {
        const calendars = CalendarService.getCalendars();
        const index = calendars.findIndex(c => c.id === id);
        if (index !== -1) {
            calendars[index].enabled = !calendars[index].enabled;
            CalendarService.saveCalendars(calendars);
        }
    }
};
