import { roundHalf } from "./time";

export function quote(
  puja: { basePrice: number; includedHours: number; extraHourRate: number },
  hours: number,
) {
  const extraHours = roundHalf(Math.max(0, hours - puja.includedHours));
  const amountDue = puja.basePrice + Math.round(extraHours * puja.extraHourRate);
  return {
    basePrice: puja.basePrice,
    extraHours,
    extraHourRate: puja.extraHourRate,
    amountDue,
  };
}
