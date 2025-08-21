import { supabaseClient, generateCharacterImage, generateCharacterData } from './api.js';
import { MASTER_SKILL_LIST, MASTER_ABILITY_LIST, PAGE_SIZE } from './config.js';
import { DOM, navigateTo, setGenButtonLoadingState, showModal, updateUIBasedOnAuthState, renderPokedexView } from './ui.js';
import { renderBattleArenaView } from './battle.js';

// --- Global App State ---
export let state = {
    currentUser: null,
    currentProfile: null,
    allCharacters: [],
    totalCharacterCount: 0,
    currentPage: 0,
    isLoadingMore: false,
    allProfiles: [],
    characterSubscription: null,
    activeFilter: 'all',
    battleAnimationId: null,
};

/**
 * Updates the global state and triggers a re-render if necessary.
 * @param {object} newState - The new state properties to merge.
 */
export function updateState(newState) {
    state = { ...state, ...newState };
}

// --- Character Generation ---
async function generateCharacter() {
    // ... (Logic from original file) ...
    // This function will now use imported functions like `generateCharacterImage`
}

// --- Data Fetching & Realtime ---
async function initialDataLoad() {
    // ... (Logic from original file) ...
}

async function loadMoreCharacters() {
    // ... (Logic from original file) ...
}
window.loadMoreCharacters = loadMoreCharacters;

function handleRealtimeChanges(payload) {
    // ... (Logic from original file) ...
}

function subscribeToChanges() {
    if (state.characterSubscription) state.characterSubscription.unsubscribe();
    const subscription = supabaseClient.channel('hipoketmon-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, handleRealtimeChanges)
        .subscribe();
    updateState({ characterSubscription: subscription });
}

// --- Authentication ---
async function handleSignup(e) { e.preventDefault(); /* ... */ }
async function handleLogin(e) { e.preventDefault(); /* ... */ }
async function handleLogout() { /* ... */ }
window.handleLogout = handleLogout;

async function listenToAuthStateChanges() {
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user || null;
        const currentProfile = currentUser ? state.allProfiles.find(p => p.id === currentUser.id) : null;
        updateState({ currentUser, currentProfile });
        
        if (_event === 'SIGNED_IN' && !currentProfile) {
            // Refetch profiles if a new user signs in
            const { data } = await supabaseClient.from('battle_profiles').select('*');
            if(data) updateState({ allProfiles: data, currentProfile: data.find(p => p.id === currentUser.id) });
        }
        
        updateUIBasedOnAuthState();
        if (!currentUser) navigateTo('pokedex-view');
    });
}

// --- App Initialization ---
function initialize() {
    // Setup Event Listeners
    document.getElementById('home-btn').addEventListener('click', () => navigateTo('pokedex-view'));
    document.getElementById('generate-btn').addEventListener('click', generateCharacter);
    // ... (Add all other event listeners from the original file) ...

    // Initial Load
    document.addEventListener('DOMContentLoaded', async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        updateState({ currentUser: session?.user || null });
        await initialDataLoad();
        listenToAuthStateChanges();
        subscribeToChanges();
    });
}

// Start the application
initialize();

