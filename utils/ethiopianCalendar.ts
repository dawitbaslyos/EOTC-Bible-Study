
export interface EthiopianDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  yearName: string;
}

const ETHIOPIAN_MONTHS = [
 "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
];

const YEAR_NAMES = ["ዮሐንስ", "ማቴዎስ", "ማርቆስ", "ሉቃስ"]; // Matthew is 1, Mark 2, Luke 3, John 0/4

/**
 * A simplified Gregorian to Ethiopian converter.
 * Ethiopian New Year is generally Sept 11 or Sept 12.
 */
export function getEthiopianDate(date: Date = new Date()): EthiopianDate {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  // Basic calculation for Ethiopian Year
  // The Ethiopian year starts in September (month 9)
  let eYear = gYear - 8;
  if (gMonth > 9 || (gMonth === 9 && gDay >= 11)) {
    eYear = gYear - 7;
  }

  // Calculate the cycle name (Matthew, Mark, Luke, John)
  // The year cycle follows: (eYear + 1) % 4
  const cycleIndex = (eYear + 1) % 4;
  const yearName = `ዘመነ ${YEAR_NAMES[cycleIndex]}`;

  // Find the start of the Ethiopian year in Gregorian time
  // Meskerem 1 is usually Sept 11, but Sept 12 if the previous Ethiopian year was a leap year (Luke)
  const isPreviousYearLeap = (eYear) % 4 === 3; // Simplified leap check
  const newYearDay = isPreviousYearLeap ? 12 : 11;
  
  const startOfEthYear = new Date(gMonth < 9 || (gMonth === 9 && gDay < newYearDay) ? gYear - 1 : gYear, 8, newYearDay);
  
  // Difference in days
  const diffTime = Math.abs(date.getTime() - startOfEthYear.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 30 days per month
  let eMonth = Math.floor(diffDays / 30) + 1;
  let eDay = (diffDays % 30) + 1;

  // Handle month 13 (Pagumē) and overflows
  if (eMonth > 13) {
    // This usually shouldn't happen with the startOfEthYear logic but for safety:
    eMonth = 13;
    eDay = diffDays - (12 * 30) + 1;
  }

  return {
    day: eDay,
    month: eMonth,
    year: eYear,
    monthName: ETHIOPIAN_MONTHS[eMonth - 1],
    yearName: yearName
  };
}
