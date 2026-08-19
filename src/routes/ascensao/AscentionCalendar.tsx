import { RangeCalendar } from "@heroui/react";
import { getLocalTimeZone, today } from "@internationalized/date";

export function AscentionCalendar() {
  return (
    <RangeCalendar
      isReadOnly
      aria-label="Dias de Ascensão"
      defaultValue={{
        end: today(getLocalTimeZone()).subtract({ days: 4 }),
        start: today(getLocalTimeZone()),
      }}
      className="w-full max-w-full"
      maxValue={today(getLocalTimeZone())}
    >
      <RangeCalendar.Header>
        <RangeCalendar.NavButton slot="previous" />
        <RangeCalendar.Heading className="text-center font-medium" />
        <RangeCalendar.NavButton slot="next" />
      </RangeCalendar.Header>
      <RangeCalendar.Grid>
        <RangeCalendar.GridHeader>
          {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
        </RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>
          {(date) => <RangeCalendar.Cell date={date} />}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
    </RangeCalendar>
  );
}
