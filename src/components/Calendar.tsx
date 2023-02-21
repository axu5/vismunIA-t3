import addDays from "date-fns/addDays";
import { type FC, type Dispatch, type SetStateAction } from "react";
import Calendar from "react-calendar";

interface CalendarComponentProps {
  onChange: Dispatch<SetStateAction<Date | null>>;
}

const CalendarComponent: FC<CalendarComponentProps> = ({ onChange }) => {
  const now = new Date();

  return (
    <div>
      <Calendar
        minDate={addDays(now, 1)}
        className="REACT-CALENDAR p-2"
        view="month"
        onClickDay={(date: Date) => onChange(date)}
      />
    </div>
  );
};

export default CalendarComponent;
