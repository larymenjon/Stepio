import { differenceInWeeks, differenceInMonths, differenceInDays, parseISO } from 'date-fns';

export function calculateAge(birthDateString: string) {
  const birthDate = parseISO(birthDateString);
  const today = new Date();

  const totalDays = differenceInDays(today, birthDate);
  const totalWeeks = differenceInWeeks(today, birthDate);
  const totalMonths = differenceInMonths(today, birthDate);

  // Calculate years and remaining months
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  return {
    days: totalDays,
    weeks: totalWeeks,
    months: totalMonths,
    years,
    remainingMonths,
    formatted: {
      weeks: `${totalWeeks} semanas`,
      months: `${totalMonths} meses`,
      yearsAndMonths: years > 0 
        ? `${years} ano${years > 1 ? 's' : ''} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`
        : `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`,
    },
  };
}
