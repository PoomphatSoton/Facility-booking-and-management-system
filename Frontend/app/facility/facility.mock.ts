export type FacilityItem = {
    name: string;
    category: string;
    description: string;
    currentOpening: {
        day: string;
        startTime: string;
        endTime: string;
    };
    otherOpenings: Array<{
        day: string;
        startTime: string;
        endTime: string;
    }>;
    slotToday: string[];
    slotByDate: Array<{
        date: string;
        slots: string[];
    }>;
    maxPeople: number;
    usageGuidelines: string[];
    imageUrl: string;
    openTime: string;
    closeTime: string;
};

export const FACILITIES: FacilityItem[] = [
    {
        name: "Badminton Court",
        category: "Badminton",
        description:
            "Indoor badminton court suitable for singles and doubles practice with professional-grade flooring and equipment. This venue includes cushioned anti-slip mat surfaces, bright tournament-standard LED lighting, and dedicated warm-up space near the side lanes. Players can reserve coaching sessions, request shuttle rental packs, and access changing facilities located next to the court zone for a complete training experience.",
        currentOpening: { day: "Thu", startTime: "11:00", endTime: "15:00" },
        otherOpenings: [
            { day: "Mon", startTime: "10:00", endTime: "14:00" },
            { day: "Wed", startTime: "12:00", endTime: "16:00" },
            { day: "Fri", startTime: "11:00", endTime: "15:00" },
        ],
        slotToday: ["11:00-12:00", "13:00-14:00", "14:00-15:00"],
        slotByDate: [
            { date: "2026-04-02", slots: ["11:00-12:00", "13:00-14:00", "14:00-15:00"] },
            { date: "2026-04-03", slots: ["10:00-11:00", "12:00-13:00", "13:00-14:00"] },
            { date: "2026-04-04", slots: ["11:00-12:00", "12:00-13:00"] },
        ],
        maxPeople: 4,
        usageGuidelines: [
            "Indoor shoes only",
            "Bring your own racket or rent at the counter",
            "Please arrive 10 minutes before your booked slot",
        ],
        imageUrl: "https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?auto=format&fit=crop&w=1200&q=80",
        openTime: "10:00",
        closeTime: "18:00",
    },
    {
        name: "Football Pitch",
        category: "Football",
        description:
            "Outdoor 5-a-side football pitch with evening lighting and modern artificial turf surface. The pitch is maintained weekly for consistent ball roll and reduced injury risk, and includes side netting to keep game flow smooth. Team organizers can request portable goal adjustments, short tactical board access, and post-match cooldown areas around the perimeter for better session management.",
        currentOpening: { day: "Thu", startTime: "09:00", endTime: "17:00" },
        otherOpenings: [
            { day: "Tue", startTime: "08:00", endTime: "16:00" },
            { day: "Sat", startTime: "10:00", endTime: "18:00" },
            { day: "Sun", startTime: "09:00", endTime: "15:00" },
        ],
        slotToday: ["09:00-10:00", "13:00-14:00", "16:00-17:00"],
        slotByDate: [
            { date: "2026-04-02", slots: ["09:00-10:00", "13:00-14:00", "16:00-17:00"] },
            { date: "2026-04-03", slots: ["08:00-09:00", "14:00-15:00", "18:00-19:00"] },
            { date: "2026-04-05", slots: ["10:00-11:00", "12:00-13:00"] },
        ],
        maxPeople: 10,
        usageGuidelines: [
            "Outdoor boots required",
            "No metal studs allowed",
            "Team captain must check in before the match starts",
        ],
        imageUrl: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
        openTime: "08:00",
        closeTime: "21:00",
    },
    {
        name: "Tennis Court",
        category: "Tennis",
        description:
            "Hard-court tennis facility with court-side seating and rental rackets available. This court offers high-contrast line markings, wind-screen panels, and dedicated practice wall areas for solo drills. Players can choose between casual rally sessions and structured lesson blocks, while spectators can use shaded seating zones designed to improve comfort during daytime bookings.",
        currentOpening: { day: "Thu", startTime: "11:00", endTime: "19:00" },
        otherOpenings: [
            { day: "Mon", startTime: "09:00", endTime: "17:00" },
            { day: "Tue", startTime: "10:00", endTime: "18:00" },
            { day: "Sat", startTime: "08:00", endTime: "14:00" },
        ],
        slotToday: ["11:00-12:00", "15:00-16:00", "18:00-19:00"],
        slotByDate: [
            { date: "2026-04-02", slots: ["11:00-12:00", "15:00-16:00", "18:00-19:00"] },
            { date: "2026-04-03", slots: ["09:00-10:00", "13:00-14:00"] },
            { date: "2026-04-06", slots: ["10:00-11:00", "12:00-13:00", "14:00-15:00"] },
        ],
        maxPeople: 4,
        usageGuidelines: [
            "Non-marking shoes",
            "Court rollers and brooms must remain in storage after use",
            "Only water is allowed inside the playing zone",
        ],
        imageUrl: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1200&q=80",
        openTime: "09:00",
        closeTime: "20:00",
    },
    {
        name: "Squash Court",
        category: "Squash",
        description:
            "Premium indoor squash court with glass-back wall and anti-slip flooring. The enclosed space is optimized for high-speed rallies with acoustic dampening and clear visibility for coaching review. Players can request ball-type recommendations for skill level, and there is a short transition area outside the court for stretching and safe equipment storage between sessions.",
        currentOpening: { day: "Thu", startTime: "12:00", endTime: "20:00" },
        otherOpenings: [
            { day: "Wed", startTime: "11:00", endTime: "19:00" },
            { day: "Fri", startTime: "13:00", endTime: "21:00" },
            { day: "Sun", startTime: "10:00", endTime: "18:00" },
        ],
        slotToday: ["12:00-13:00", "16:00-17:00", "19:00-20:00"],
        slotByDate: [
            { date: "2026-04-02", slots: ["12:00-13:00", "16:00-17:00", "19:00-20:00"] },
            { date: "2026-04-03", slots: ["13:00-14:00", "17:00-18:00"] },
            { date: "2026-04-07", slots: ["11:00-12:00", "15:00-16:00"] },
        ],
        maxPeople: 4,
        usageGuidelines: [
            "Eye protection recommended",
            "Use approved squash balls only",
            "Do not place bags inside the court",
        ],
        imageUrl: "https://images.unsplash.com/photo-1595433707802-0f5f54623f90?auto=format&fit=crop&w=1200&q=80",
        openTime: "11:00",
        closeTime: "22:00",
    },
    {
        name: "Basketball Court",
        category: "Basketball",
        description:
            "Full-size indoor basketball court with digital scoreboard and spectator seating. The hardwood surface is cleaned daily and calibrated for proper bounce response, while hoop height and backboard setup follow standard competitive dimensions. This facility supports scrimmage booking, half-court drills, and private team practice with optional shot-clock support for structured training.",
        currentOpening: { day: "Thu", startTime: "10:00", endTime: "16:00" },
        otherOpenings: [
            { day: "Tue", startTime: "09:00", endTime: "15:00" },
            { day: "Sat", startTime: "11:00", endTime: "17:00" },
            { day: "Sun", startTime: "08:00", endTime: "14:00" },
        ],
        slotToday: ["10:00-11:00", "12:00-13:00", "15:00-16:00"],
        slotByDate: [
            { date: "2026-04-02", slots: ["10:00-11:00", "12:00-13:00", "15:00-16:00"] },
            { date: "2026-04-04", slots: ["11:00-12:00", "14:00-15:00"] },
            { date: "2026-04-08", slots: ["09:00-10:00", "13:00-14:00", "16:00-17:00"] },
        ],
        maxPeople: 10,
        usageGuidelines: [
            "Non-marking shoes",
            "No hanging on rims",
            "Return training cones and bibs after session",
        ],
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
        openTime: "09:00",
        closeTime: "17:00",
    },
    {
        name: "Swimming Pool",
        category: "Swimming",
        description:
            "25-meter lap pool with separate lanes for training and recreational swimming. The water quality is monitored throughout the day, and lane allocation is adjusted by session intensity to reduce congestion. Members can use kickboards and pull buoys during designated hours, and poolside staff provide safety briefings for new users before first-time lane reservations.",
        currentOpening: { day: "Thu", startTime: "07:00", endTime: "19:00" },
        otherOpenings: [
            { day: "Mon", startTime: "06:00", endTime: "18:00" },
            { day: "Tue", startTime: "06:00", endTime: "20:00" },
            { day: "Fri", startTime: "07:00", endTime: "20:00" },
        ],
        slotToday: ["07:00-08:00", "13:00-14:00", "17:00-18:00"],
        slotByDate: [
            { date: "2026-04-02", slots: ["07:00-08:00", "13:00-14:00", "17:00-18:00"] },
            { date: "2026-04-03", slots: ["06:00-07:00", "15:00-16:00"] },
            { date: "2026-04-06", slots: ["08:00-09:00", "12:00-13:00", "16:00-17:00"] },
        ],
        maxPeople: 20,
        usageGuidelines: [
            "Swim cap required",
            "Shower before entering the pool",
            "Follow lane direction signs during peak hours",
        ],
        imageUrl: "https://images.unsplash.com/photo-1560090995-01632a28895b?auto=format&fit=crop&w=1200&q=80",
        openTime: "06:00",
        closeTime: "20:00",
    },
];

export const TIME_RANGES = [
    { id: "all", label: "Any time" },
    { id: "morning", label: "Morning (06:00-12:00)", start: "06:00", end: "12:00" },
    { id: "afternoon", label: "Afternoon (12:00-16:00)", start: "12:00", end: "16:00" },
    { id: "evening", label: "Evening (16:00-20:00)", start: "16:00", end: "20:00" },
    { id: "night", label: "Night (20:00-22:00)", start: "20:00", end: "22:00" },
];
