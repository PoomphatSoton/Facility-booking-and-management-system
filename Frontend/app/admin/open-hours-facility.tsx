import { Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export type Opening = {
    day: string;
    startTime: string;
    endTime: string;
};

type Props = {
    openings: Opening[];
    onChange: (openings: Opening[]) => void;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const timeToDate = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
};

const dateToTime = (date: Date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export default function OpeningHoursFacility({ openings, onChange }: Props) {
    const addOpening = () => {
        onChange([...openings, { day: "Mon", startTime: "09:00", endTime: "17:00" }]);
    };

    const removeOpening = (index: number) => {
        onChange(openings.filter((_, i) => i !== index));
    };

    const updateOpening = (index: number, field: keyof Opening, value: string) => {
        onChange(openings.map((o, i) => i === index ? { ...o, [field]: value } : o));
    };

    return (
        <section className="create-facility-section">
            <div className="create-facility-section-header">
                <h2>Opening Hours</h2>
                <Button type="button" variant="outline-primary" size="sm" onClick={addOpening}>
                    + Add Day
                </Button>
            </div>

            {openings.map((opening, index) => (
                <div key={index} className="create-facility-opening-row">
                    <Form.Select
                        className="create-facility-opening-day"
                        value={opening.day}
                        onChange={(e) => updateOpening(index, "day", e.target.value)}
                    >
                        {DAYS.map((day) => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </Form.Select>

                    <DatePicker
                        selected={timeToDate(opening.startTime)}
                        onChange={(date) => date && updateOpening(index, "startTime", dateToTime(date))}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        className="form-control create-facility-time-picker"
                    />

                    <span>to</span>

                    <DatePicker
                        selected={timeToDate(opening.endTime)}
                        onChange={(date) => date && updateOpening(index, "endTime", dateToTime(date))}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        className="form-control create-facility-time-picker"
                    />

                    {openings.length > 1 && (
                        <Button type="button" variant="outline-danger" size="sm" onClick={() => removeOpening(index)}>
                            Remove
                        </Button>
                    )}
                </div>
            ))}
        </section>
    );
}