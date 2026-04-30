import { Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./create-facility.css";

export type SlotTime = {
    slotDate: Date;
    startTime: Date;
    endTime: Date;
};

type Props = {
    slots: SlotTime[];
    onChange: (slots: SlotTime[]) => void;
};

const makeTime = (hour: number, minute = 0, second = 0, ms = 0): Date => {
    const date = new Date();
    date.setHours(hour, minute, second, ms);
    return date;
};

export default function SlotTimeFacility({ slots, onChange }: Props) {
    const handleAdd = () => {
        onChange([...slots, {
            slotDate: makeTime(0, 0, 0, 0),
            startTime: makeTime(9, 0, 0, 0),
            endTime: makeTime(10, 0, 0, 0),
        }]);
    };

    const handleRemove = (index: number) => {
        onChange(slots.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof SlotTime, value: Date) => {
        onChange(slots.map((slot, i) => i === index ? { ...slot, [field]: value } : slot));
    };

    return (
        <section className="create-facility-section">
            <div className="create-facility-section-header">
                <h2>Slot Times</h2>
                <Button type="button" variant="outline-primary" size="sm" onClick={handleAdd}>
                    + Add Slot
                </Button>
            </div>

            {slots.length === 0 ? (
                <p className="slot-empty-hint">No slots added. Click "+ Add Slot" to begin.</p>
            ) : (
                slots.map((slot, index) => (
                    <div key={index} className="create-facility-slot-row">
                        <div className="slot-field">
                            <span className="slot-label">Date</span>
                            <DatePicker
                                selected={slot.slotDate}
                                onChange={(date: Date | null) => date && handleChange(index, "slotDate", date)}
                                dateFormat="dd/MM/yyyy"
                                className="form-control create-facility-slot-date"
                            />
                        </div>
                        <div className="slot-field">
                            <span className="slot-label">Start</span>
                            <DatePicker
                                selected={slot.startTime}
                                onChange={(date: Date | null) => date && handleChange(index, "startTime", date)}
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={30}
                                timeFormat="HH:mm"
                                dateFormat="HH:mm"
                                className="form-control create-facility-time-picker"
                            />
                        </div>
                        <span className="slot-separator">→</span>
                        <div className="slot-field">
                            <span className="slot-label">End</span>
                            <DatePicker
                                selected={slot.endTime}
                                onChange={(date: Date | null) => date && handleChange(index, "endTime", date)}
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={30}
                                timeFormat="HH:mm"
                                dateFormat="HH:mm"
                                className="form-control create-facility-time-picker"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemove(index)}
                        >
                            Remove
                        </Button>
                    </div>
                ))
            )}
        </section>
    );
}
