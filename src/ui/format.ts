const pluralForm = (
  count: number,
  one: string,
  few: string,
  many: string,
): string => {
  const lastDigit = count % 10;
  const lastTwo = count % 100;

  if (lastDigit === 1 && lastTwo !== 11) {
    return one;
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 10 || lastTwo >= 20)) {
    return few;
  }

  return many;
};

export const plural = (
  count: number,
  one: string,
  few: string,
  many: string,
): string => `${count} ${pluralForm(count, one, few, many)}`;

export const formatNumber = (value: number): string =>
  value.toLocaleString('ru-RU');

export const formatDuration = (milliseconds: number): string =>
  milliseconds < 1000
    ? `${milliseconds} мс`
    : `${(milliseconds / 1000).toFixed(1)} с`;
