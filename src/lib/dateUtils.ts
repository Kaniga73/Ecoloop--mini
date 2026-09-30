/**
 * Formats chat and message timestamps according to user requirements:
 * - Today: "Today HH:MM AM/PM" (12-hour format)
 * - Yesterday: "Yesterday HH:MM AM/PM" (12-hour format)
 * - Past dates: "DD/MM HH:MM AM/PM" (12-hour format)
 */
export function formatChatTimestamp(isoDateStr?: string | Date | null): string {
  if (!isoDateStr) return '';
  const date = typeof isoDateStr === 'string' ? new Date(isoDateStr) : isoDateStr;
  if (isNaN(date.getTime())) return String(isoDateStr);

  const now = new Date();
  
  // Normalize dates to midnight for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - msgDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const timeStr = `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;

  if (diffDays === 0) {
    return `Today ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday ${timeStr}`;
  } else {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}:${month} ${timeStr}`;
  }
}
