export function formatDateInput(raw: string): string {
  // Extract numbers only
  const cleaned = raw.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length <= 2) {
    return cleaned;
  }
  if (cleaned.length <= 4) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
}

export function isValidDateFormat(dateStr: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
  const [day, month, year] = dateStr.split('/').map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2030) return false;
  return true;
}

export function calculateAge(birthdateStr: string): number {
  try {
    const parts = birthdateStr.split('/');
    if (parts.length < 3) return 24;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const birthDate = new Date(year, month, day);
    const today = new Date(); // Year is 2026 in applet environment
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(1, age);
  } catch {
    return 24;
  }
}

export function getOrdinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) {
    return `${n}ST`;
  }
  if (j === 2 && k !== 12) {
    return `${n}ND`;
  }
  if (j === 3 && k !== 13) {
    return `${n}RD`;
  }
  return `${n}TH`;
}
