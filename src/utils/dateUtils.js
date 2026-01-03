
export function formatTimeAgo(dateString) {
    if (!dateString) return '';

    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Prevent negative time (future dates)
    if (diffInSeconds < 0) return '0m';

    // Less than 1 minute
    if (diffInSeconds < 60) return '1m';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo`;

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y`;
}
