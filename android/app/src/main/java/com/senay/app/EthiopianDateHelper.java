package com.senay.app;

import java.util.Calendar;
import java.util.Locale;

/** Mirrors utils/ethiopianCalendar.ts for the home widget. */
public final class EthiopianDateHelper {

    private static final String[] ETHIOPIAN_MONTHS = {
           "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
    };

    private static final String[] YEAR_NAMES = {"ዮሐንስ", "ማቴዎስ", "ማርቆስ", "ሉቃስ"};

    private EthiopianDateHelper() {}

    public static class EthiopianDate {
        public final int day;
        public final int month;
        public final int year;
        public final String monthName;
        public final String yearName;

        EthiopianDate(int day, int month, int year, String monthName, String yearName) {
            this.day = day;
            this.month = month;
            this.year = year;
            this.monthName = monthName;
            this.yearName = yearName;
        }

        public String dateLabel() {
            return monthName + " " + day;
        }
    }

    public static EthiopianDate getEthiopianDate(Calendar date) {
        int gYear = date.get(Calendar.YEAR);
        int gMonth = date.get(Calendar.MONTH) + 1;
        int gDay = date.get(Calendar.DAY_OF_MONTH);

        int eYear = gYear - 8;
        if (gMonth > 9 || (gMonth == 9 && gDay >= 11)) {
            eYear = gYear - 7;
        }

        int cycleIndex = (eYear + 1) % 4;
        if (cycleIndex < 0) cycleIndex += 4;
        String yearName = "Year of St. " + YEAR_NAMES[cycleIndex];

        boolean isPreviousYearLeap = (eYear % 4) == 3;
        int newYearDay = isPreviousYearLeap ? 12 : 11;

        int startGregorianYear = gYear;
        if (gMonth < 9 || (gMonth == 9 && gDay < newYearDay)) {
            startGregorianYear = gYear - 1;
        }

        Calendar startOfEthYear = Calendar.getInstance();
        startOfEthYear.clear();
        startOfEthYear.set(startGregorianYear, Calendar.SEPTEMBER, newYearDay, 0, 0, 0);

        long diffMs = date.getTimeInMillis() - startOfEthYear.getTimeInMillis();
        long diffDays = Math.max(0, diffMs / (1000L * 60L * 60L * 24L));

        int eMonth = (int) (diffDays / 30) + 1;
        int eDay = (int) (diffDays % 30) + 1;

        if (eMonth > 13) {
            eMonth = 13;
            eDay = (int) (diffDays - (12L * 30L) + 1);
        }

        String mName = ETHIOPIAN_MONTHS[Math.min(Math.max(eMonth - 1, 0), ETHIOPIAN_MONTHS.length - 1)];
        return new EthiopianDate(eDay, eMonth, eYear, mName, yearName);
    }

    public static EthiopianDate getEthiopianDateNow() {
        return getEthiopianDate(Calendar.getInstance(Locale.getDefault()));
    }
}
