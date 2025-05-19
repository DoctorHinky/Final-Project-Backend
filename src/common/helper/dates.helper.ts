export function calcAge(date: Date): number {
  const today = new Date();
  const birthdate = new Date(date);

  let age = today.getFullYear() - birthdate.getFullYear();

  const illegal =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() &&
      today.getDate() >= birthdate.getDate());
  if (!illegal) return --age;

  return age;
}
