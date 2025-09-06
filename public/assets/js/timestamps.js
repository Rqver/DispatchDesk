function formatTimeAgo(dateString) {
    const TIME_UNITS = [
        { unit: "s", seconds: 60 }, { unit: "m", seconds: 60 }, { unit: "h", seconds: 24 },
        { unit: "d", seconds: 7 }, { unit: "w", seconds: 4.34524 }, { unit: "mo", seconds: 12 },
        { unit: "y", seconds: Infinity }
    ];
    let duration = (new Date(dateString).getTime() - new Date().getTime()) / 1000;
    duration = Math.abs(Math.round(duration));
    if (duration < 5) return "now";
    for (const { unit, seconds } of TIME_UNITS) {
        if (duration < seconds) return `${Math.floor(duration)}${unit} ago`;
        duration /= seconds;
    }
    return "";
}

function updateTimestamps() {
    document.querySelectorAll('[data-timestamp]').forEach(el => {
        const timestamp = el.getAttribute('data-timestamp');
        if (timestamp) el.textContent = formatTimeAgo(timestamp);
    });
}