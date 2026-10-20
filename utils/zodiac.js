export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const ZODIAC_RANGES = [
  {
    name: 'ราศีมังกร',
    symbol: '♑',
    from: [12, 22],
    to: [1, 19],
  },
  {
    name: 'ราศีกุมภ์',
    symbol: '♒',
    from: [1, 20],
    to: [2, 18],
  },
  {
    name: 'ราศีมีน',
    symbol: '♓',
    from: [2, 19],
    to: [3, 20],
  },
  {
    name: 'ราศีเมษ',
    symbol: '♈',
    from: [3, 21],
    to: [4, 19],
  },
  {
    name: 'ราศีพฤษภ',
    symbol: '♉',
    from: [4, 20],
    to: [5, 20],
  },
  {
    name: 'ราศีเมถุน',
    symbol: '♊',
    from: [5, 21],
    to: [6, 20],
  },
  {
    name: 'ราศีกรกฎ',
    symbol: '♋',
    from: [6, 21],
    to: [7, 22],
  },
  {
    name: 'ราศีสิงห์',
    symbol: '♌',
    from: [7, 23],
    to: [8, 22],
  },
  {
    name: 'ราศีกันย์',
    symbol: '♍',
    from: [8, 23],
    to: [9, 22],
  },
  {
    name: 'ราศีตุลย์',
    symbol: '♎',
    from: [9, 23],
    to: [10, 22],
  },
  {
    name: 'ราศีพิจิก',
    symbol: '♏',
    from: [10, 23],
    to: [11, 21],
  },
  {
    name: 'ราศีธนู',
    symbol: '♐',
    from: [11, 22],
    to: [12, 21],
  },
];

export function getZodiacFromBirthday(birthday) {
  if (!birthday) return null;

  const parts = birthday.trim().split(/\s+/);

  if (parts.length < 2) return null;

  const day = parseInt(parts[0], 10);

  const monthIndex = THAI_MONTHS.findIndex(
    (month) =>
      parts[1].includes(month) ||
      month.includes(parts[1])
  );

  if (isNaN(day) || monthIndex === -1) {
    return null;
  }

  const month = monthIndex + 1;

  return (
    ZODIAC_RANGES.find(
      ({ from: [fromMonth, fromDay], to: [toMonth, toDay] }) => {
        return (
          (month === fromMonth && day >= fromDay) ||
          (month === toMonth && day <= toDay)
        );
      }
    ) || null
  );
}
