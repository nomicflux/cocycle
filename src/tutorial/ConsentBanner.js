import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useStore } from "../state/store";
export default function ConsentBanner() {
    const consent = useStore((s) => s.consent);
    const setConsent = useStore((s) => s.setConsent);
    const [showMore, setShowMore] = useState(false);
    if (consent !== "pending")
        return null;
    return (_jsxs("div", { className: "consent-banner", role: "dialog", "aria-label": "Privacy preferences", children: [_jsxs("div", { className: "consent-text", children: ["We store only your tutorial progress and mode in this browser's local storage. No tracking, no third parties.", showMore && (_jsx("div", { className: "consent-more", children: "If you decline, the tutorial still works \u2014 but your chapter and mode won't be remembered across page reloads." }))] }), _jsxs("div", { className: "consent-buttons", children: [_jsx("button", { onClick: () => setConsent("accepted"), children: "Accept" }), _jsx("button", { onClick: () => setConsent("declined"), children: "Decline" }), _jsx("button", { className: "link", onClick: () => setShowMore((v) => !v), children: showMore ? "Less" : "Learn more" })] })] }));
}
