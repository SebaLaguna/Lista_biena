
interface CompassLogoProps {
    className?: string;
    size?: number | string;
    bgColor?: string;
}

/**
 * Optimized Minimalist Compass Logo.
 * Adjusted coordinates to fill more of the SVG viewbox.
 */
export default function CompassLogo({ className = "", size = 24, bgColor = "white" }: CompassLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Circle Ring - Minimalist segments, slightly larger radius */}
            <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="180 60" strokeDashoffset="30" fill="none" />

            <g stroke="currentColor" strokeWidth="0.5" strokeLinejoin="miter">
                {/* North Pointer - Longer */}
                <path d="M50 50 L50 8 L58 42 Z" fill="currentColor" />
                <path d="M50 50 L50 8 L42 42 Z" fill={bgColor} />

                {/* East Pointer - Longer */}
                <path d="M50 50 L92 50 L58 58 Z" fill="currentColor" />
                <path d="M50 50 L92 50 L58 42 Z" fill={bgColor} />

                {/* South Pointer - Longer */}
                <path d="M50 50 L50 92 L42 58 Z" fill="currentColor" />
                <path d="M50 50 L50 92 L58 58 Z" fill={bgColor} />

                {/* West Pointer - Longer */}
                <path d="M50 50 L8 50 L42 42 Z" fill="currentColor" />
                <path d="M50 50 L8 50 L42 58 Z" fill={bgColor} />

                {/* Secondary Pointers (NW, NE, SE, SW) - Also scaled out */}
                <path d="M50 50 L28 28 L45 34 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <path d="M50 50 L28 28 L34 45 Z" fill="currentColor" />

                <path d="M50 50 L72 28 L55 34 Z" fill="currentColor" />
                <path d="M50 50 L72 28 L66 45 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />

                <path d="M50 50 L72 72 L66 55 Z" fill="currentColor" />
                <path d="M50 50 L72 72 L55 66 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />

                <path d="M50 50 L28 72 L34 55 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <path d="M50 50 L28 72 L45 66 Z" fill="currentColor" />
            </g>

            {/* Typography - Moved closer to edges */}
            <text x="50" y="7" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold" fontFamily="serif">N</text>
            <text x="50" y="100" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold" fontFamily="serif">S</text>
            <text x="96" y="54" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold" fontFamily="serif">O</text>
            <text x="4" y="54" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold" fontFamily="serif">W</text>
        </svg>
    );
}
