import { useSelector } from 'react-redux';

// The signed-in user for display: the live store first, the saved session as a fallback.
// Used by the desktop sidebar and the mobile drawer so they always show the same thing.
export function useCurrentUser() {
    const auth = useSelector((state) => state.auth);

    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem('sessionData'));
    } catch {
        saved = null;
    }

    const name = auth.name || saved?.name || 'User';
    const role = auth.role || saved?.role || '';

    return {
        name,
        role,
        // "ShiftSupervisor" -> "Shift Supervisor"
        roleLabel: role.replace(/([a-z])([A-Z])/g, '$1 $2'),
        initials: name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    };
}
