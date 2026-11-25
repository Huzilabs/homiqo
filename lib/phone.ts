/** Pakistani mobile number check: 03XX XXXXXXX, 3XX XXXXXXX, 92 3XX XXXXXXX, +92…, 0092… (spaces/dashes allowed). */
export function isPkMobile(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  else if (d.startsWith("92")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^3\d{9}$/.test(d);
}

/** Same rule for the <input pattern> attribute (the browser anchors it to the whole value). */
export const PK_MOBILE_PATTERN = "[\\s\\-]*(\\+?92|0092|0)?[\\s\\-]*3([\\s\\-]*[0-9]){9}[\\s\\-]*";

/** Any accepted format → "03XXXXXXXXX" (or the input unchanged if it isn't a valid mobile). */
export function normalizePkMobile(raw: string) {
  if (!isPkMobile(raw)) return raw.trim();
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  else if (d.startsWith("92")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return "0" + d;
}
