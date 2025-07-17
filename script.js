import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://obbmtrxhmhokzvuxdqlc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const GAME_ID = 'samjin_mafia_genesis_v3';
const ADMIN_PASSWORD = '5882';
const PLAYER_NAMES = ['마리오', '스파이더맨', '맹구'];

const client = createClient(SUPABASE_URL, SUPABASE_KEY);
const state = {
    isLoading: true,
    isAdmin: false,
    userId: localStorage.getItem(`mafia-user-id-${GAME_ID}`) || `user_${crypto.randomUUID()}`,
    playerName: null,
    isPlayer: false,
    game: {},
    onlineUsers: {},
    tempDesign: null,
    tempModerator: null,
    selectedAssets: { background: null, logo: null, moderator: null },
    channels: {},
    timer: null,
};

const api = {
    async fetchGame() {
        const { data, error } = await client.from('games').select('*').eq('id', GAME_ID).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },
    async upsertGame(data) {
        const { error } = await client.from('games').upsert({ id: GAME_ID, ...data }).eq('id', GAME_ID);
        if (error) throw error;
    },
    async joinGame(name) {
        const { data, error } = await client.rpc('join_game', {
            game_id_input: GAME_ID,
            user_id_input: state.userId,
            player_name_input: name,
        });
        if (error || !data.success) throw new Error(data.message || '참가 실패');
    },
    async sendMessage(content) {
        const { error } = await client.from('messages').insert({ game_id: GAME_ID, user_id: state.userId, content });
        if (error) throw error;
    },
    async fetchAssets() {
        const { data, error } = await client.storage.from('design_assets').list('public', { sortBy: { column: 'created_at', order: 'desc' } });
        if (error) throw error;
        return data.map(file => ({ name: file.name, url: client.storage.from('design_assets').getPublicUrl(`public/${file.name}`).data.publicUrl }));
    },
    async uploadAsset(file, path) {
        const { error } = await client.storage.from('design_assets').upload(path, file, { upsert: true });
        if (error) throw error;
        return client.storage.from('design_assets').getPublicUrl(path).data.publicUrl;
    },
    async invokeAI(functionName, body) {
        const { data, error } = await client.functions.invoke(functionName, { body });
        if (error) throw new Error(`AI 호출 실패: ${error.message}`);
        return functionName === 'generate-image' ? data.imageUrl : JSON.parse(data.candidates[0].content.parts[0].text);
    },
};

const ui = {
    els: {},
    init() {
        this.els = {
            modal: document.getElementById('modal'),
            game: document.getElementById('game'),
            logo: document.getElementById('logo'),
            title: document.getElementById('title'),
            online: document.getElementById('online'),
            timer: document.getElementById('timer'),
            userId: document.getElementById('user-id'),
            playerList: document.getElementById('player-list'),
            chat: document.getElementById('chat'),
            join: document.getElementById('join'),
            chatForm: document.getElementById('chat-form'),
            message: document.getElementById('message'),
            admin: document.getElementById('admin-toggle'),
            toast: document.getElementById('toast'),
            modView: document.getElementById('moderator'),
            modImg: document.getElementById('mod-img'),
            modName: document.getElementById('mod-name'),
            modText: document.getElementById('mod-text'),
        };
        this.bindEvents();
    },
    bindEvents() {
        this.els.join.addEventListener('click', () => game.join());
        this.els.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            game.sendMessage(this.els.message.value);
            this.els.message.value = '';
        });
        this.els.message.addEventListener('focus', () => {
            setTimeout(() => {
                this.els.chat.scrollTop = this.els.chat.scrollHeight;
                if (window.visualViewport) {
                    const offset = window.visualViewport.height - window.innerHeight;
                    this.els.chat.style.paddingBottom = `${80 - offset}px`;
                }
            }, 100);
        });
        this.els.message.addEventListener('blur', () => {
            this.els.chat.style.paddingBottom = '80px';
        });
        this.els.admin.addEventListener('click', () => admin.toggle());
        this.els.modal.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.dataset.action;
            if (action === 'password') admin.checkPassword(this.els.modal.querySelector('input').value);
            if (action === 'role') game.confirmRole();
            if (action === 'vote') game.castVote(btn.dataset.voteFor);
            if (action === 'rematch') game.requestRematch();
            if (action === 'generate-world') ai.generateWorld();
            if (action === 'save-world') ai.saveWorld();
            if (action === 'generate-moderator') ai.generateModerator();
            if (action === 'save-moderator') ai.saveModerator();
            if (action === 'asset-close') assets.close();
            if (action === 'apply-assets') assets.apply();
            if (action === 'reset') admin.resetGame();
            if (action === 'asset') assets.select(btn.dataset.type, btn.dataset.url);
        });
    },
    render() {
        if (state.isLoading) return;
        this.renderPlayers();
        this.renderInput();
        this.renderModal();
        this.applyDesign(state.game.design_theme);
        this.applyModerator(state.game.moderator_profile);
    },
    renderPlayers() {
        const players = state.game.players || [];
        this.els.online.innerHTML = `<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg> ${Object.keys(state.onlineUsers).length}`;
        this.els.playerList.innerHTML = PLAYER_NAMES.map(name => {
            const player = players.find(p => p.name === name);
            const isOnline = player && Object.keys(state.onlineUsers).includes(player.userId);
            const isAlive = player?.isAlive;
            const isMe = player?.userId === state.userId;
            return `
                <div class="flex flex-col items-center">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center border-2 ${isAlive ? 'border-blue-500' : 'border-red-600'} ${isOnline ? 'bg-gray-700' : 'bg-gray-800 opacity-50'} ${isMe ? 'ring-2 ring-[var(--primary)]' : ''}">
                        ${name[0]}
                    </div>
                    <p class="text-xs ${isOnline ? 'text-white' : 'text-gray-500'}">${name}${isAlive ? '' : ' (사망)'}</p>
                </div>`;
        }).join('');
        this.els.playerCount.textContent = `(${players.length}/3)`;
        this.els.userId.textContent = state.playerName || `관전자_${state.userId.slice(-4)}`;
    },
    renderInput() {
        const isWaiting = state.game.state === 'waiting';
        const canJoin = (state.game.players?.length || 0) < 3 && !state.isPlayer;
        this.els.join.classList.toggle('hidden', !isWaiting || !canJoin);
        this.els.chatForm.classList.toggle('hidden', isWaiting && canJoin);
        const canChat = state.game.state === 'discussion' && state.isPlayer && state.game.players.find(p => p.userId === state.userId)?.isAlive;
        this.els.message.disabled = !canChat;
        this.els.message.placeholder = canChat ? '메시지 입력...' : '지금은 말할 수 없습니다...';
    },
    renderModal() {
        const { state: gameState } = state.game;
        this.els.modal.classList.toggle('visible', ['password', 'ai-loading', 'assets', 'role_assignment', 'voting', 'finished'].includes(gameState));
        this.els.modal.setAttribute('data-type', gameState);
        if (gameState === 'password') this.els.modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-xl w-11/12 max-w-xs">
                <h2 class="text-xl font-bold text-[var(--primary)]">관리자 접속</h2>
                <input type="password" class="w-full p-3 bg-gray-700 rounded-xl mt-4" placeholder="****">
                <button data-action="password" class="w-full bg-[var(--primary)] text-white py-3 rounded-xl mt-4">접속</button>
            </div>`;
        else if (gameState === 'ai-loading') this.els.modal.innerHTML = `
            <div class="text-center">
                <div class="spinner mx-auto"></div>
                <p id="ai-text" class="mt-4 text-lg font-semibold animate-pulse">AI 작업 중...</p>
            </div>`;
        else if (gameState === 'assets') this.renderAssetModal();
        else if (gameState === 'role_assignment') this.renderRoleModal();
        else if (gameState === 'voting') this.renderVoteModal();
        else if (gameState === 'finished') this.renderGameOverModal();
    },
    renderAssetModal() {
        this.els.modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-xl w-11/12 max-w-3xl h-[80vh] flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-[var(--primary)]">에셋 관리</h2>
                    <button data-action="asset-close" class="text-2xl">×</button>
                </div>
                <div class="flex-1 overflow-y-auto space-y-6">
                    <div><h3 class="text-lg font-semibold mb-2">배경</h3><div id="asset-bg" class="grid grid-cols-4 gap-4"></div></div>
                    <div><h3 class="text-lg font-semibold mb-2">로고</h3><div id="asset-logo" class="grid grid-cols-4 gap-4"></div></div>
                    <div><h3 class="text-lg font-semibold mb-2">사회자</h3><div id="asset-mod" class="grid grid-cols-4 gap-4"></div></div>
                </div>
                <button data-action="apply-assets" class="w-full bg-[var(--primary)] text-white py-3 rounded-xl mt-4">적용</button>
            </div>`;
        assets.render();
    },
    renderRoleModal() {
        const me = state.game.players?.find(p => p.userId === state.userId);
        if (!me) return;
        this.els.modal.innerHTML = `
            <div class="bg-[var(--container-bg)] p-8 rounded-2xl w-11/12 max-w-sm">
                <p class="text-sm text-gray-400 mb-2">당신의 역할은...</p>
                <h2 class="text-4xl font-bold mb-6 ${me.role === 'mafia' ? 'text-red-500' : 'text-cyan-400'}">${me.role === 'mafia' ? '마피아' : '시민'}</h2>
                <p class="mb-6">${me.role === 'mafia' ? '시민을 속여 살아남으세요.' : '마피아를 찾아 처형하세요.'}</p>
                <button data-action="role" class="w-full bg-[var(--primary)] text-white py-3 rounded-xl">확인</button>
            </div>`;
    },
    renderVoteModal() {
        const me = state.game.players?.find(p => p.userId === state.userId);
        if (!me || !me.isAlive) {
            this.els.modal.innerHTML = `<div class="bg-[var(--container-bg)] p-8 rounded-2xl w-11/12 max-w-sm"><h2 class="text-2xl font-bold mb-4">투표 진행 중</h2><p>다른 플레이어들이 투표 중입니다.</p></div>`;
            return;
        }
        if (me.votedFor) {
            this.els.modal.innerHTML = `<div class="bg-[var(--container-bg)] p-8 rounded-2xl w-11/12 max-w-sm"><h2 class="text-2xl font-bold mb-4">투표 완료</h2><p>다른 플레이어들을 기다리는 중...</p></div>`;
            return;
        }
        const alive = state.game.players.filter(p => p.isAlive && p.userId !== state.userId);
        this.els.modal.innerHTML = `
            <div class="bg-[var(--container-bg)] p-8 rounded-2xl w-11/12 max-w-sm">
                <h2 class="text-2xl font-bold mb-4">마피아 투표</h2>
                <p class="text-sm text-gray-400 mb-6">마피아로 의심되는 사람을 선택하세요.</p>
                <div class="grid grid-cols-1 gap-3">
                    ${alive.map(p => `<button data-action="vote" data-vote-for="${p.name}" class="w-full p-4 bg-gray-700 rounded-xl hover:bg-gray-600">${p.name}</button>`).join('')}
                </div>
            </div>`;
    },
    renderGameOverModal() {
        const { winner, executedPlayer, players } = state.game;
        const mafia = players.find(p => p.role === 'mafia');
        const me = players.find(p => p.userId === state.userId);
        this.els.modal.innerHTML = `
            <div class="bg-[var(--container-bg)] p-8 rounded-2xl w-11/12 max-w-sm">
                <h2 class="text-4xl font-bold mb-4 ${winner === 'mafia' ? 'text-red-500' : 'text-cyan-400'}">${winner === 'mafia' ? '마피아 승리' : '시민 승리'}</h2>
                <p class="mb-4">투표 결과 <strong>${executedPlayer || '아무도'}</strong>님이 처형되었습니다.</p>
                <p class="mb-6">마피아는 <strong class="text-red-400">${mafia?.name || '??'}</strong>님이었습니다.</p>
                <button data-action="rematch" class="w-full bg-[var(--primary)] text-white py-3 rounded-xl ${me?.wantsRematch ? 'opacity-50' : ''}" ${me?.wantsRematch ? 'disabled' : ''}>${me?.wantsRematch ? '재시작 대기 중...' : '재시작 요청'}</button>
            </div>`;
    },
    applyDesign(design) {
        if (!design) {
            document.documentElement.style.setProperty('--font-main', `'Noto Sans KR', sans-serif`);
            document.documentElement.style.setProperty('--bg', '#121212');
            document.documentElement.style.setProperty('--container-bg', '#1E1E1E');
            document.documentElement.style.setProperty('--primary', '#007BFF');
            document.body.style.backgroundImage = '';
            this.els.logo.classList.add('opacity-0');
            this.els.title.textContent = '삼진 마피아 게임';
            return;
        }
        const { font, colors, themeName, bgImageUrl, logoImageUrl } = design;
        this.els.title.textContent = themeName || '삼진 마피아 게임';
        this.els.logo.src = logoImageUrl || '';
        this.els.logo.classList.toggle('opacity-0', !logoImageUrl);
        document.documentElement.style.setProperty('--font-main', `'${font || 'Noto Sans KR'}', sans-serif`);
        document.documentElement.style.setProperty('--bg', colors?.background || '#121212');
        document.documentElement.style.setProperty('--container-bg', colors?.containerBg || '#1E1E1E');
        document.documentElement.style.setProperty('--primary', colors?.primary || '#007BFF');
        document.body.style.backgroundImage = bgImageUrl ? `url(${bgImageUrl})` : '';
        if (font) {
            const fontId = `font-${font.replace(/\s/g, '-')}`;
            if (!document.getElementById(fontId)) {
                const link = document.createElement('link');
                link.id = fontId;
                link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s/g, '+')}:wght@400;700&display=swap`;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
        }
    },
    applyModerator(profile) {
        if (!profile) {
            this.els.modName.textContent = '사회자';
            this.els.modImg.src = 'https://placehold.co/64x64/1E1E1E/EAEAEA?text=GM';
            return;
        }
        this.els.modName.textContent = profile.name || '사회자';
        this.els.modImg.src = profile.imageUrl || 'https://placehold.co/64x64/1E1E1E/EAEAEA?text=GM';
    },
    showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `px-4 py-2 rounded-full text-white ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'} animate-[slide-in_0.2s_ease-out]`;
        toast.textContent = msg;
        this.els.toast.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },
};

const game = {
    async init() {
        localStorage.setItem(`mafia-user-id-${GAME_ID}`, state.userId);
        ui.init();
        try {
            state.game = await api.fetchGame();
            if (!state.game) {
                await api.upsertGame({ id: GAME_ID, state: 'waiting', players: [], observers: {}, design_theme: null, moderator_profile: null });
                state.game = await api.fetchGame();
            }
            state.isPlayer = state.game.players?.some(p => p.userId === state.userId);
            state.playerName = state.isPlayer ? state.game.players.find(p => p.userId === state.userId).name : `관전자_${state.userId.slice(-4)}`;
            await this.loadMessages();
            this.subscribe();
            ui.els.game.classList.add('opacity-100');
            state.isLoading = false;
            ui.render();
        } catch (error) {
            ui.showToast('게임 초기화 실패', 'error');
            console.error(error);
        }
    },
    subscribe() {
        state.channels.game = client.channel(`db-${GAME_ID}`)
            .on('postgres_changes', { event: '*', table: 'games', filter: `id=eq.${GAME_ID}` }, (payload) => {
                const oldState = state.game.state;
                state.game = payload.new;
                state.isPlayer = state.game.players?.some(p => p.userId === state.userId);
                state.playerName = state.isPlayer ? state.game.players.find(p => p.userId === state.userId).name : state.playerName;
                if (oldState !== payload.new.state) this.onStateChange(payload.new.state);
                ui.render();
            }).subscribe();
        state.channels.presence = client.channel(`presence-${GAME_ID}`)
            .on('presence', { event: 'sync' }, () => {
                state.onlineUsers = state.channels.presence.presenceState();
                ui.render();
            }).subscribe(async () => {
                await state.channels.presence.track({ user_id: state.userId });
                if (!state.isPlayer && !state.game.observers?.[state.userId]) {
                    const observers = { ...state.game.observers, [state.userId]: { name: state.playerName, joined_at: new Date().toISOString() } };
                    await api.upsertGame({ observers });
                }
            });
        state.channels.chat = client.channel(`chat-${GAME_ID}`)
            .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => this.displayMessage(payload.new)).subscribe();
    },
    async loadMessages() {
        const { data, error } = await client.from('messages').select('*').order('created_at', { ascending: true });
        if (error) return ui.showToast('메시지 로드 실패', 'error');
        ui.els.chat.innerHTML = '';
        data.forEach(msg => this.displayMessage(msg));
    },
    displayMessage({ user_id, content }) {
        const sender = state.game.players?.find(p => p.userId === user_id) || state.game.observers?.[user_id] || { name: '알수없음' };
        const isMe = user_id === state.userId;
        const div = document.createElement('div');
        div.className = `flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`;
        div.innerHTML = `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <span class="text-xs text-gray-400">${sender.name}</span>
                <div class="p-2 rounded-xl max-w-xs ${isMe ? 'bg-blue-600' : 'bg-gray-700'}">${content}</div>
            </div>`;
        ui.els.chat.appendChild(div);
        ui.els.chat.scrollTop = ui.els.chat.scrollHeight;
    },
    async join() {
        const name = PLAYER_NAMES.find(n => !state.game.players.some(p => p.name === n));
        if (!name) return ui.showToast('빈 자리가 없습니다', 'error');
        try {
            ui.els.join.disabled = true;
            await api.joinGame(name);
            ui.showToast('게임에 참가했습니다!', 'success');
        } catch (error) {
            ui.showToast(error.message, 'error');
            ui.els.join.disabled = false;
        }
    },
    async sendMessage(content) {
        if (!content.trim()) return;
        try {
            this.displayMessage({ user_id: state.userId, content }); // 낙관적 업데이트
            await api.sendMessage(content);
        } catch (error) {
            ui.showToast('메시지 전송 실패', 'error');
        }
    },
    onStateChange(newState) {
        if (newState === 'countdown') this.runCountdown();
        if (newState === 'discussion') this.startTimer();
        if (newState === 'voting') moderator.speak('voting');
        if (newState === 'finished') {
            const { winner, executedPlayer } = state.game;
            const mafia = state.game.players.find(p => p.role === 'mafia');
            moderator.speak(winner === 'mafia' ? 'mafia_win' : 'citizen_win', { mafia: mafia?.name, executed: executedPlayer });
        }
    },
    runCountdown() {
        let count = 3;
        moderator.speak('countdown', { number: count });
        ui.els.modal.innerHTML = `<span class="text-9xl font-bold text-white">${count}</span>`;
        ui.els.modal.classList.add('visible');
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                moderator.speak('countdown', { number: count });
                ui.els.modal.querySelector('span').textContent = count;
            } else {
                clearInterval(interval);
                ui.els.modal.classList.remove('visible');
                if (state.game.players[0].userId === state.userId) api.upsertGame({ state: 'role_assignment' });
            }
        }, 1500);
    },
    startTimer() {
        if (state.timer) clearInterval(state.timer);
        const end = new Date(state.game.discussion_end_time).getTime();
        state.timer = setInterval(() => {
            const seconds = Math.floor((end - Date.now()) / 1000);
            if (seconds <= 0) {
                clearInterval(state.timer);
                ui.els.timer.textContent = '00';
                if (state.game.players[0].userId === state.userId) api.upsertGame({ state: 'voting' });
            } else {
                ui.els.timer.textContent = seconds.toString().padStart(2, '0');
            }
        }, 1000);
    },
    async confirmRole() {
        const { data, error } = await client.from('games').select('players').eq('id', GAME_ID).single();
        if (error) return ui.showToast('역할 확인 실패', 'error');
        const players = data.players.map(p => p.userId === state.userId ? { ...p, confirmed: true } : p);
        await api.upsertGame({ players });
        if (players.every(p => p.confirmed) && state.game.players[0].userId === state.userId) {
            await api.upsertGame({ state: 'discussion', discussion_end_time: new Date(Date.now() + 60000).toISOString() });
        }
    },
    async castVote(votedFor) {
        const { data, error } = await client.from('games').select('players').eq('id', GAME_ID).single();
        if (error) return ui.showToast('투표 실패', 'error');
        const players = data.players.map(p => p.userId === state.userId && !p.votedFor ? { ...p, votedFor } : p);
        await api.upsertGame({ players });
        if (players.filter(p => p.isAlive).every(p => p.votedFor) && state.game.players[0].userId === state.userId) {
            this.tallyVotes();
        }
    },
    async tallyVotes() {
        const { data, error } = await client.from('games').select('players').eq('id', GAME_ID).single();
        if (error) return;
        const votes = {};
        data.players.filter(p => p.isAlive && p.votedFor).forEach(p => votes[p.votedFor] = (votes[p.votedFor] || 0) + 1);
        let executedPlayer = null, maxVotes = 0;
        for (const player in votes) if (votes[player] > maxVotes) { maxVotes = votes[player]; executedPlayer = player; }
        const players = data.players.map(p => p.name === executedPlayer ? { ...p, isAlive: false } : p);
        const mafia = players.find(p => p.role === 'mafia');
        await api.upsertGame({ state: 'finished', players, winner: executedPlayer === mafia.name ? 'citizen' : 'mafia', executedPlayer });
    },
    async requestRematch() {
        const { data, error } = await client.from('games').select('players').eq('id', GAME_ID).single();
        if (error) return ui.showToast('재시작 요청 실패', 'error');
        const players = data.players.map(p => p.userId === state.userId ? { ...p, wantsRematch: true } : p);
        await api.upsertGame({ players });
        if (players.every(p => p.wantsRematch) && state.game.players[0].userId === state.userId) {
            await client.from('messages').delete().neq('id', -1);
            const newPlayers = players.map(p => ({ ...p, isAlive: true, role: null, votedFor: null, confirmed: false, wantsRematch: false }));
            const mafiaIndex = Math.floor(Math.random() * newPlayers.length);
            newPlayers[mafiaIndex].role = 'mafia';
            newPlayers.forEach((p, i) => { if (i !== mafiaIndex) p.role = 'citizen'; });
            await api.upsertGame({ state: 'waiting', players: newPlayers, winner: null, executedPlayer: null, discussion_end_time: null });
        }
    },
};

const moderator = {
    timeout: null,
    defaultDialogues: {
        wait_for_two: '플레이어 2명을 더 기다립니다...',
        wait_for_one: '마지막 플레이어를 기다립니다. 곧 시작합니다!',
        discussion: '토론 시간입니다. 마피아를 찾아내세요.',
        voting: '투표 시간입니다. 마피아를 지목해주세요.',
        mafia_win: '마피아가 승리했습니다! 마피아는 {mafia}님이었습니다.',
        citizen_win: '시민이 승리했습니다! 마피아 {executed}님을 찾아냈습니다.',
        countdown: '{number}...',
        game_start: '게임 시작! 밤이 되었습니다.',
    },
    speak(key, vars = {}) {
        const profile = state.game.moderator_profile;
        let text = (profile?.dialogue?.[key] || this.defaultDialogues[key] || '').replace(/{(\w+)}/g, (_, k) => vars[k] || '');
        ui.els.modText.textContent = text;
        ui.els.modView.classList.remove('opacity-0', '-translate-y-full');
        game.displayMessage({ user_id: 'system', content: text });
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => ui.els.modView.classList.add('opacity-0', '-translate-y-full'), 5000);
    },
};

const admin = {
    toggle() {
        if (state.isAdmin) {
            ui.els.modal.setAttribute('data-type', 'admin');
            ui.els.modal.innerHTML = `
                <div class="bg-gray-800 p-4 rounded-xl flex flex-col gap-2">
                    <button data-action="generate-world" class="bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">세계 창조</button>
                    <button data-action="save-world" class="bg-green-600 text-white py-2 rounded-md hover:bg-green-700 ${state.tempDesign ? '' : 'hidden'}">이걸로 할게</button>
                    <button data-action="generate-moderator" class="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">사회자 창조</button>
                    <button data-action="save-moderator" class="bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 ${state.tempModerator ? '' : 'hidden'}">이 사회자로</button>
                    <button data-action="assets" class="bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700">에셋 관리</button>
                    <button data-action="reset" class="bg-red-600 text-white py-2 rounded-md hover:bg-red-700">강제 초기화</button>
                </div>`;
            ui.els.modal.classList.add('visible');
        } else {
            ui.els.modal.setAttribute('data-type', 'password');
            ui.els.modal.innerHTML = `
                <div class="bg-gray-800 p-6 rounded-xl w-11/12 max-w-xs">
                    <h2 class="text-xl font-bold text-[var(--primary)]">관리자 접속</h2>
                    <input type="password" class="w-full p-3 bg-gray-700 rounded-xl mt-4" placeholder="****">
                    <button data-action="password" class="w-full bg-[var(--primary)] text-white py-3 rounded-xl mt-4">접속</button>
                </div>`;
            ui.els.modal.classList.add('visible');
        }
    },
    checkPassword(password) {
        if (password === ADMIN_PASSWORD) {
            state.isAdmin = true;
            ui.els.modal.classList.remove('visible');
            ui.showToast('관리자 모드 활성화', 'success');
        } else {
            ui.showToast('비밀번호 오류', 'error');
            ui.els.modal.querySelector('input').classList.add('animate-[shake_0.3s_ease-in-out]');
            setTimeout(() => ui.els.modal.querySelector('input').classList.remove('animate-[shake_0.3s_ease-in-out]'), 300);
        }
    },
    async resetGame() {
        try {
            await client.from('messages').delete().neq('id', -1);
            const { data } = await client.from('games').select('*').eq('id', GAME_ID).single();
            await api.upsertGame({
                state: 'waiting', players: [], observers: {}, winner: null, executedPlayer: null, discussion_end_time: null,
                design_theme: data.design_theme, moderator_profile: data.moderator_profile,
            });
            ui.showToast('게임이 초기화되었습니다.', 'success');
        } catch (error) {
            ui.showToast('게임 초기화 실패', 'error');
        }
    },
};

const ai = {
    async generateWorld() {
        ui.els.modal.setAttribute('data-type', 'ai-loading');
        ui.els.modal.querySelector('#ai-text').textContent = 'AI가 새로운 세계를 창조하는 중...';
        ui.els.modal.classList.add('visible');
        try {
            const theme = await api.invokeAI('generate-world-theme', {
                prompt: `Create a dramatic 2D anime-style mafia game theme. Provide themeName, font, colors {background, containerBg, primary, text, border}, bgPrompt, logoPrompt in JSON.`,
            });
            const [bgImage, logoImage] = await Promise.all([
                api.invokeAI('generate-image', { prompt: theme.bgPrompt, isLogo: false }),
                api.invokeAI('generate-image', { prompt: theme.logoPrompt, isLogo: true }),
            ]);
            state.tempDesign = { ...theme, bgImageUrl: bgImage, logoImageUrl: logoImage };
            ui.applyDesign(state.tempDesign);
            ui.els.modal.classList.remove('visible');
            ui.showToast('새로운 세계가 생성되었습니다.', 'success');
            admin.toggle(); // 관리자 패널 표시
        } catch (error) {
            ui.showToast('세계 창조 실패', 'error');
            ui.els.modal.classList.remove('visible');
        }
    },
    async saveWorld() {
        ui.els.modal.setAttribute('data-type', 'ai-loading');
        ui.els.modal.classList.add('visible');
        try {
            const { bgImageUrl, logoImageUrl, ...theme } = state.tempDesign;
            const bgFile = this.base64ToFile(bgImageUrl, `bg_${Date.now()}.png`);
            const logoFile = this.base64ToFile(logoImageUrl, `logo_${Date.now()}.png`);
            const [bgUrl, logoUrl] = await Promise.all([
                api.uploadAsset(bgFile, `public/bg_${Date.now()}.png`),
                api.uploadAsset(logoFile, `public/logo_${Date.now()}.png`),
            ]);
            await api.upsertGame({ design_theme: { ...theme, bgImageUrl: bgUrl, logoImageUrl: logoUrl } });
            state.tempDesign = null;
            ui.showToast('세계가 저장되었습니다.', 'success');
            admin.toggle();
        } catch (error) {
            ui.showToast('세계 저장 실패', 'error');
        }
        ui.els.modal.classList.remove('visible');
    },
    async generateModerator() {
        ui.els.modal.setAttribute('data-type', 'ai-loading');
        ui.els.modal.querySelector('#ai-text').textContent = 'AI가 새로운 사회자를 창조하는 중...';
        ui.els.modal.classList.add('visible');
        try {
            const profile = await api.invokeAI('generate-moderator-profile', {
                prompt: `Create a unique 2D anime-style mafia game moderator. Provide name, personality, image_prompt, dialogue {wait_for_two, wait_for_one, countdown, game_start, discussion, voting, mafia_win, citizen_win} in JSON.`,
            });
            const image = await api.invokeAI('generate-image', { prompt: profile.image_prompt, isLogo: true });
            state.tempModerator = { ...profile, imageUrl: image };
            ui.applyModerator(state.tempModerator);
            moderator.speak('game_start', { name: profile.name });
            ui.showToast('새로운 사회자가 생성되었습니다.', 'success');
            admin.toggle();
        } catch (error) {
            ui.showToast('사회자 창조 실패', 'error');
        }
        ui.els.modal.classList.remove('visible');
    },
    async saveModerator() {
        ui.els.modal.setAttribute('data-type', 'ai-loading');
        ui.els.modal.classList.add('visible');
        try {
            const { data } = await client.from('games').select('moderator_profile').eq('id', GAME_ID).single();
            if (!Object.prototype.hasOwnProperty.call(data, 'moderator_profile')) throw new Error('DB에 moderator_profile 컬럼이 없습니다.');
            const { imageUrl, ...profile } = state.tempModerator;
            const file = this.base64ToFile(imageUrl, `mod_${Date.now()}.png`);
            const url = await api.uploadAsset(file, `public/mod_${Date.now()}.png`);
            await api.upsertGame({ moderator_profile: { ...profile, imageUrl: url } });
            state.tempModerator = null;
            ui.showToast('사회자가 저장되었습니다.', 'success');
            admin.toggle();
        } catch (error) {
            ui.showToast(error.message, 'error');
        }
        ui.els.modal.classList.remove('visible');
    },
    base64ToFile(base64, filename) {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
        return new File([u8arr], filename, { type: mime });
    },
};

const assets = {
    async render() {
        try {
            const data = await api.fetchAssets();
            const types = { bg: 'asset-bg', logo: 'asset-logo', mod: 'asset-mod' };
            Object.entries(types).forEach(([type, id]) => {
                const list = ui.els.modal.querySelector(`#${id}`);
                list.innerHTML = data.filter(f => f.name.startsWith(type)).map(f => `
                    <img src="${f.url}" class="asset-item w-full h-24 object-cover ${f.url === state.selectedAssets[type] ? 'selected' : ''}" data-action="asset" data-type="${type}" data-url="${f.url}">
                `).join('');
            });
        } catch (error) {
            ui.showToast('에셋 로드 실패', 'error');
        }
    },
    select(type, url) {
        state.selectedAssets[type] = url;
        const list = ui.els.modal.querySelector(`#asset-${type}`);
        list.querySelectorAll('.asset-item').forEach(item => item.classList.toggle('selected', item.dataset.url === url));
    },
    async apply() {
        try {
            const { data } = await client.from('games').select('*').eq('id', GAME_ID).single();
            const update = {
                design_theme: {
                    ...data.design_theme,
                    bgImageUrl: state.selectedAssets.bg || data.design_theme?.bgImageUrl,
                    logoImageUrl: state.selectedAssets.logo || data.design_theme?.logoImageUrl,
                },
                moderator_profile: {
                    ...data.moderator_profile,
                    imageUrl: state.selectedAssets.mod || data.moderator_profile?.imageUrl,
                },
            };
            await api.upsertGame(update);
            ui.showToast('에셋이 적용되었습니다.', 'success');
            this.close();
        } catch (error) {
            ui.showToast('에셋 적용 실패', 'error');
        }
    },
    close() {
        ui.els.modal.classList.remove('visible');
        state.selectedAssets = { background: null, logo: null, moderator: null };
    },
};

window.addEventListener('DOMContentLoaded', () => game.init());