import TypographyH4 from "./ui/TypographyH4";
import type { RefObject } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/Input";

interface DatePickerProps {
  dayRef: RefObject<HTMLInputElement>;
  monthRef: RefObject<HTMLInputElement>;
  yearRef: RefObject<HTMLInputElement>;
}

export default function DatePicker({
  dayRef,
  monthRef,
  yearRef,
}: DatePickerProps) {
  return (
    <>
      <TypographyH4 title="Select a date and time" />
      <Label htmlFor="day">Day</Label>
      <Input
        type="text"
        id="day"
        ref={dayRef}
        // value={day}
        inputMode="numeric" // for phones
        // onChange={(e) => {
        //   const number = Number(e.target.value);
        //   if (isNaN(number)) return;
        //   setDay(number);
        // }}
        placeholder="Day"
        required={true}
      />
      <Label htmlFor="month">Month</Label>
      <Input
        type="text"
        id="day"
        ref={monthRef}
        // value={month}
        inputMode="numeric" // for phones
        // onChange={(e) => {
        //   const number = Number(e.target.value);
        //   if (isNaN(number)) return;
        //   setMonth(number);
        // }}
        placeholder="Month"
        required={true}
      />
      <Label htmlFor="year">Year</Label>
      <Input
        type="text"
        ref={yearRef}
        id="year"
        // value={year}
        inputMode="numeric" // for phones
        // onChange={(e) => {
        //   const number = Number(e.target.value);
        //   if (isNaN(number)) return;
        //   setYear(number);
        // }}
        placeholder="Year"
        required={true}
      />
    </>
  );
}
