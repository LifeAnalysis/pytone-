// Animazioni e interazioni per il gioco
document.addEventListener('DOMContentLoaded', function () {
    console.log('TridimensionalDuels game board loaded');

    // Inizializza Socket.IO per la comunicazione real-time
    initializeSocket();

    // Implementazione del drag-and-drop per le carte
    setupDragAndDrop();

    // Inizializzazione della logica di gioco
    initializeGameFlow();

    // Configurazione delle animazioni delle carte
    setupCardAnimations();

    // Configurazione del log di gioco e notifiche
    setupGameLog();

    // Setup del visualizzatore dettagli carta
    setupCardDetailViewer();

    // Click sulle carte per visualizzare i dettagli
    setupCardClickHandlers();

    // Animazioni 3D per le carte nella mano
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        // Rotazione 3D al movimento del mouse sulla carta
        card.addEventListener('mousemove', function (e) {
            // Skip animation if card is being dragged
            if (this.classList.contains('dragging')) return;

            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // Coordinata X relativa alla carta
            const y = e.clientY - rect.top;  // Coordinata Y relativa alla carta

            // Calcolo degli angoli di rotazione basati sulla posizione del mouse
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Limitiamo la rotazione tra -15 e 15 gradi
            const rotateY = ((x - centerX) / centerX) * 15;
            const rotateX = ((centerY - y) / centerY) * 10;

            // Skip animation if the card is on the board
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            // Effetto parallasse per dare profondità
            this.style.transform = `translateY(-15px) scale(1.1) perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;

            // Aggiungiamo un effetto di brillantezza che segue il mouse
            let baseColor1, baseColor2;
            if (this.classList.contains('monster-card')) {
                baseColor1 = '#1E3A8A';
                baseColor2 = '#1E40AF';
            } else {
                baseColor1 = '#5B21B6';
                baseColor2 = '#7E22CE';
            }

            const shine = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2), transparent 40%)`;
            this.style.backgroundImage = `linear-gradient(45deg, ${baseColor1}, ${baseColor2}), ${shine}`;
        });

        // Ripristina la posizione originale quando il mouse esce dalla carta
        card.addEventListener('mouseleave', function () {
            // Skip if the card is on the board
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            if (!this.classList.contains('dragging')) {
                this.style.transform = '';

                if (this.classList.contains('monster-card')) {
                    this.style.backgroundImage = 'linear-gradient(45deg, #1E3A8A, #1E40AF)';
                } else {
                    this.style.backgroundImage = 'linear-gradient(45deg, #5B21B6, #7E22CE)';
                }
            }
        });

        // Effetto click
        card.addEventListener('mousedown', function () {
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            this.style.transform = 'translateY(-5px) scale(0.95)';
        });

        card.addEventListener('mouseup', function () {
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            const rect = this.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            this.style.transform = `translateY(-15px) scale(1.1) perspective(1000px) rotateY(0deg) rotateX(0deg)`;
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
        });
    });

    // Animazioni per gli slot delle carte
    const slots = document.querySelectorAll('.monster-slot, .spell-slot');
    slots.forEach(slot => {
        if (!slot.classList.contains('empty')) {
            // Effetto luce pulsante quando il mouse è sopra uno slot
            slot.addEventListener('mouseenter', function () {
                this.style.boxShadow = '0 0 15px rgba(124, 58, 237, 0.6)';

                // Aggiungiamo una leggera rotazione per dare profondità
                this.style.transform = 'translateY(-3px) scale(1.05) perspective(500px) rotateX(5deg)';
            });

            slot.addEventListener('mouseleave', function () {
                this.style.boxShadow = '';
                this.style.transform = '';
            });

            // Effetto click
            slot.addEventListener('mousedown', function () {
                this.style.transform = 'scale(0.98)';
            });

            slot.addEventListener('mouseup', function () {
                this.style.transform = 'translateY(-3px) scale(1.05)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 300);
            });
        }
    });

    // Effetto brillantezza per i deck e graveyard
    const cardBacks = document.querySelectorAll('.card-back');
    cardBacks.forEach(cardBack => {
        cardBack.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calcolo degli angoli di rotazione
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = ((x - centerX) / centerX) * 10;
            const rotateX = ((centerY - y) / centerY) * 8;

            this.style.transform = `scale(1.1) perspective(500px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        });

        cardBack.addEventListener('mouseleave', function () {
            this.style.transform = '';
        });
    });
});

// Connessione Socket.IO
let socket;

function initializeSocket() {
    // Connessione al server Socket.IO
    socket = io();

    // Event listeners per Socket.IO
    socket.on('connect', function () {
        console.log('Connected to server');
        showNotification('Connected to server', 'success');
    });

    socket.on('disconnect', function () {
        console.log('Disconnected from server');
        showNotification('Disconnected from server', 'error');
    });

    socket.on('phase_update', function (data) {
        console.log('Phase update received:', data);
        // Qui andrà la logica per aggiornare l'UI in base alla fase
    });

    socket.on('card_update', function (data) {
        console.log('Card update received:', data);
        // Qui andrà la logica per aggiornare le carte sul tabellone
    });

    socket.on('action_update', function (data) {
        console.log('Action update received:', data);
        // Qui andrà la logica per aggiornare le azioni delle carte
    });
}

// Sistema di gestione del flusso di gioco
const PHASES = {
    SETUP: 'setup',
    DRAW: 'draw',
    STRATEGY: 'strategy',
    BATTLE: 'battle',
    END: 'end'
};

const PLAYERS = {
    PLAYER1: 0,
    PLAYER2: 1
};

// Sistemi di gioco e azioni
const ACTION_TYPES = {
    ATTACK_VERTICAL: 'attack_vertical',
    ATTACK_DIAGONAL_LEFT: 'attack_diagonal_left',
    ATTACK_DIAGONAL_RIGHT: 'attack_diagonal_right',
    DEFEND: 'defend',
    PUMP: 'pump',
    SPECIAL: 'special'
};

// Catalogo di tutte le carte
const cardCatalog = {
    champions: [
        { name: "Invictus", attack: 3, defense: 20, speed: 3, effect: "Can attack opponent's Champion even if both lanes are occupied by monsters and still alive." },
        { name: "Frost Sentinel", attack: 4, defense: 18, speed: 4, effect: "Can freeze one opponent's monster for a turn, making it unable to attack or use its ability." },
        { name: "Flamewarden", attack: 6, defense: 15, speed: 5, effect: "Deals 2 splash damage to adjacent opponent's monsters when attacking." },
        { name: "Ethereal Wisper", attack: 3, defense: 25, speed: 2, effect: "Can heal 3 Defense points to one of your monsters or your own Champion once per turn." },
        { name: "Stormbringer", attack: 7, defense: 14, speed: 6, effect: "Can attack both opponent's monsters simultaneously in a single turn." }
    ],
    monsters: [
        { name: "Iron Guardian", attack: 3, defense: 8, speed: 2, class: "Defender", effect: "When protecting, adds +1 Defense to itself." },
        { name: "Arcane Pumper", attack: 2, defense: 6, speed: 4, class: "Pumper", effect: "Gains +2 Attack instead of +1 when pumping." },
        { name: "Swift Striker", attack: 4, defense: 4, speed: 8, class: "All Rounder", effect: "Can attack twice in a row if the first attack is successful." },
        { name: "Earthen Bulwark", attack: 2, defense: 10, speed: 3, class: "Defender", effect: "Reduces all incoming damage by 1." },
        { name: "Windcharger", attack: 3, defense: 5, speed: 7, class: "Pumper", effect: "Gains +2 Speed instead of +1 when pumping." },
        { name: "Shadow Hunter", attack: 5, defense: 3, speed: 6, class: "All Rounder", effect: "Can bypass the protect action of Defenders." },
        { name: "Aquatic Golem", attack: 4, defense: 8, speed: 2, class: "Defender", effect: "Heals 2 Defense when protecting." },
        { name: "Pyro Fiend", attack: 6, defense: 4, speed: 4, class: "Pumper", effect: "Gains +2 Defense instead of +1 when pumping." },
        { name: "Lightning Bolt", attack: 7, defense: 2, speed: 9, class: "All Rounder", effect: "Speed is reduced by 3 after attacking." },
        { name: "Noble Knight", attack: 4, defense: 7, speed: 3, class: "Defender", effect: "Gains +1 Attack when protecting." },
        { name: "Mystic Channel", attack: 3, defense: 5, speed: 5, class: "Pumper", effect: "Can transfer its pumping effect to another friendly monster." },
        { name: "Warped Archer", attack: 5, defense: 4, speed: 7, class: "All Rounder", effect: "Deals 1 additional damage when using diagonal attack." },
        { name: "Stone Protector", attack: 3, defense: 9, speed: 2, class: "Defender", effect: "Can protect two adjacent friendly cards at once." },
        { name: "Life Leech", attack: 2, defense: 6, speed: 6, class: "Pumper", effect: "Heals itself for 1 when pumping." }
    ],
    spells: [
        { name: "Power Surge", effect: "Gives a friendly Monster card +3 Attack for one turn." },
        { name: "Healing Wave", effect: "Heals all friendly Monster cards for 2 Defense." },
        { name: "Blinding Flash", effect: "Reduces the Attack of all enemy Monster cards by 2 for one turn." },
        { name: "Defensive Barrier", effect: "Gives a friendly Monster card +3 Defense for one turn." },
        { name: "Speed Boost", effect: "Gives a friendly Monster card +3 Speed for one turn." },
        { name: "Mana Drain", effect: "Prevents an enemy from using a Spell card next turn." },
        { name: "Summoner's Call", effect: "Draw two Spells cards from your deck." },
        { name: "Unholy Frenzy", effect: "Gives a friendly Monster card +2 Attack and -1 Defense for one turn." },
        { name: "Teleport", effect: "Switch the position of two friendly Monster cards." },
        { name: "Quicksand", effect: "Reduces the Speed of all enemy Monster cards by 2 for one turn." },
        { name: "Mirror Image", effect: "Creates a duplicate of a friendly Monster card with half of its original stats (rounded down)." },
        { name: "Petrify", effect: "Disables an enemy Monster card for one turn (it cannot attack or use abilities)." },
        { name: "Sacrificial Ritual", effect: "Destroy a friendly Monster card to deal its Attack as direct damage to the opponent." },
        { name: "Mind Control", effect: "Take control of an enemy Monster card with 3 or less Attack for one turn." },
        { name: "Elemental Shift", effect: "Swap the Attack and Defense values of a friendly Monster card for one turn." }
    ]
};

// Stato del gioco
const gameState = {
    currentPhase: PHASES.SETUP,
    currentTurn: 1,
    activePlayer: PLAYERS.PLAYER1,
    timer: null,
    timeRemaining: 30,
    players: [
        { // Player 1
            deck: [],
            hand: [],
            graveyard: [],
            lanes: [5, null, 5], // [leftLane, championLane, rightLane]
            champion: null,
            board: [null, null, null], // Carte mostri sul campo
            spells: [null, null, null], // Carte magia sul campo
            selectedActions: [null, null, null] // Azioni selezionate per ogni mostro
        },
        { // Player 2
            deck: [],
            hand: [],
            graveyard: [],
            lanes: [5, null, 5],
            champion: null,
            board: [null, null, null], // Carte mostri sul campo
            spells: [null, null, null], // Carte magia sul campo
            selectedActions: [null, null, null] // Azioni selezionate per ogni mostro
        }
    ],
    pendingActions: [], // Azioni in attesa per la Battle Phase

    // Inizializza il gioco
    initialize: function () {
        // Per ora simuliamo solo il flusso di gioco senza implementare la logica completa
        logGameEvent('Game initialized. Starting with setup phase.');
        this.setupGame();
    },

    // Setup iniziale del gioco
    setupGame: function () {
        logGameEvent('Setting up the game...');

        // Inizializza deck e mani dei giocatori con carte dal catalogo
        this.initializeDecksAndHands();

        showNotification('Game setup: each player starts with 5 monster cards in hand and Champion on board', 'info');

        // Aggiorna manualmente l'UI delle carte in mano del giocatore 2 (computer)
        this.updatePlayer2CardsUI();

        // Per ora simuliamo solo il setup
        this.currentPhase = PHASES.SETUP;
        this.updateUI();

        showNotification('Game setup in progress...', 'info');

        // Mostra le carte di entrambi i giocatori prima di iniziare
        this.showInitialHandsReveal();
    },

    // Mostra le mani iniziali di entrambi i giocatori
    showInitialHandsReveal: function () {
        // Crea l'overlay per mostrare le carte
        const overlay = document.createElement('div');
        overlay.className = 'reveal-cards-overlay';

        // Crea il contenitore
        const container = document.createElement('div');
        container.className = 'reveal-cards-container';

        // Header
        const header = document.createElement('div');
        header.className = 'reveal-header';
        header.textContent = 'Initial Hands Reveal';
        container.appendChild(header);

        // Sezione giocatore 1
        const p1Section = document.createElement('div');
        p1Section.className = 'reveal-player-section';

        const p1Name = document.createElement('div');
        p1Name.className = 'reveal-player-name';
        p1Name.textContent = 'Player 1 Hand';
        p1Section.appendChild(p1Name);

        const p1Cards = document.createElement('div');
        p1Cards.className = 'reveal-cards';

        // Aggiungi le carte del giocatore 1
        this.players[PLAYERS.PLAYER1].hand.forEach(card => {
            const cardElement = this.createCardElement(card, true);
            cardElement.classList.add('reveal-card');
            p1Cards.appendChild(cardElement);
        });

        p1Section.appendChild(p1Cards);
        container.appendChild(p1Section);

        // Sezione giocatore 2
        const p2Section = document.createElement('div');
        p2Section.className = 'reveal-player-section';

        const p2Name = document.createElement('div');
        p2Name.className = 'reveal-player-name';
        p2Name.textContent = 'Player 2 Hand';
        p2Section.appendChild(p2Name);

        const p2Cards = document.createElement('div');
        p2Cards.className = 'reveal-cards';

        // Aggiungi le carte del giocatore 2
        this.players[PLAYERS.PLAYER2].hand.forEach(card => {
            const cardElement = this.createCardElement(card, true);
            cardElement.classList.add('reveal-card');
            p2Cards.appendChild(cardElement);
        });

        p2Section.appendChild(p2Cards);
        container.appendChild(p2Section);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'reveal-footer';

        const startButton = document.createElement('button');
        startButton.className = 'reveal-button';
        startButton.textContent = 'Start Game';
        startButton.addEventListener('click', () => {
            overlay.remove(); // Rimuovi l'overlay

            // Dopo la rimozione dell'overlay, inizia il primo turno
            setTimeout(() => {
                this.startNewTurn();
            }, 500);
        });

        footer.appendChild(startButton);
        container.appendChild(footer);

        overlay.appendChild(container);
        document.body.appendChild(overlay);
    },

    // Crea un elemento carta dal dato carta
    createCardElement: function (card, showFull = false) {
        const cardElement = document.createElement('div');

        if (card.class) { // Se ha la classe, è un mostro
            cardElement.className = 'card monster-card';

            // Determina la classe CSS appropriata per il tipo di mostro
            if (card.class === "Defender") {
                cardElement.classList.add('defender');
            } else if (card.class === "Pumper") {
                cardElement.classList.add('pumper');
            } else if (card.class === "All Rounder") {
                cardElement.classList.add('all-rounder');
            }

            cardElement.innerHTML = `
                ${card.name}
                <div class="card-stats">
                    ATK: ${card.attack}<br>
                    DEF: ${card.defense}<br>
                    SPD: ${card.speed}
                </div>
                <div class="card-class">${card.class}</div>
                <div class="card-effect">${card.effect}</div>
            `;
        } else { // Altrimenti è una magia
            cardElement.className = 'card spell-card';
            cardElement.innerHTML = `
                ${card.name}
                <div class="card-desc">${card.effect}</div>
            `;
        }

        return cardElement;
    },

    // Inizializza i deck e le mani dei giocatori con carte dal catalogo
    initializeDecksAndHands: function () {
        // Shuffle le carte del catalogo
        const shuffledMonsters = [...cardCatalog.monsters].sort(() => Math.random() - 0.5);
        const shuffledSpells = [...cardCatalog.spells].sort(() => Math.random() - 0.5);
        const shuffledChampions = [...cardCatalog.champions].sort(() => Math.random() - 0.5);

        // Per il giocatore 1 (umano)
        // Assegna un campione random
        this.players[PLAYERS.PLAYER1].champion = shuffledChampions[0];

        // Assegna 5 mostri casuali alla mano
        this.players[PLAYERS.PLAYER1].hand = shuffledMonsters.slice(0, 5);

        // Metti 10 spell nel deck
        this.players[PLAYERS.PLAYER1].deck = shuffledSpells.slice(0, 10);

        // Per il giocatore 2 (computer)
        // Assegna un campione random
        this.players[PLAYERS.PLAYER2].champion = shuffledChampions[1];

        // Assegna 5 mostri casuali alla mano
        this.players[PLAYERS.PLAYER2].hand = shuffledMonsters.slice(5, 10);

        // Metti 10 spell nel deck
        this.players[PLAYERS.PLAYER2].deck = shuffledSpells.slice(5, 15);

        // Aggiorna l'UI delle carte in mano del giocatore 1 (umano)
        this.updatePlayer1CardsUI();

        // Aggiorna i contatori dei mazzi (10 carte spell)
        const p1DeckCount = document.querySelector('.player-area.user .deck .count');
        const p2DeckCount = document.querySelector('.player-area.opponent .deck .count');

        if (p1DeckCount) {
            p1DeckCount.textContent = this.players[PLAYERS.PLAYER1].deck.length.toString();
        }

        if (p2DeckCount) {
            p2DeckCount.textContent = this.players[PLAYERS.PLAYER2].deck.length.toString();
        }

        // Posiziona i campioni nel tabellone
        this.placeChampionsOnBoard();
    },

    // Aggiorna l'UI delle carte in mano del giocatore 1 (umano)
    updatePlayer1CardsUI: function () {
        const p1Hand = document.querySelector('.player-area.user .hand');
        if (p1Hand) {
            // Svuota la mano attuale
            p1Hand.innerHTML = '';

            // Aggiungi le carte dei mostri
            this.players[PLAYERS.PLAYER1].hand.forEach((monster, index) => {
                const monsterCard = document.createElement('div');
                monsterCard.className = 'card monster-card';
                monsterCard.setAttribute('draggable', 'true');
                monsterCard.setAttribute('data-card-type', 'monster');
                monsterCard.setAttribute('data-card-id', `monster-${index}`);

                // Determina la classe CSS appropriata per il tipo di mostro
                let monsterClass = "";
                if (monster.class === "Defender") {
                    monsterClass = "defender";
                } else if (monster.class === "Pumper") {
                    monsterClass = "pumper";
                } else if (monster.class === "All Rounder") {
                    monsterClass = "all-rounder";
                }
                monsterCard.classList.add(monsterClass);

                monsterCard.innerHTML = `
                    ${monster.name}
                    <div class="card-stats">
                        ATK: ${monster.attack}<br>
                        DEF: ${monster.defense}<br>
                        SPD: ${monster.speed}
                    </div>
                    <div class="card-class">${monster.class}</div>
                    <div class="card-effect">${monster.effect}</div>
                `;

                p1Hand.appendChild(monsterCard);

                // Aggiungi gli event listeners per trascinare le carte
                monsterCard.addEventListener('dragstart', function (e) {
                    // Verifica se è possibile trascinare la carta in base alla fase di gioco
                    if (gameState.currentPhase !== PHASES.STRATEGY) {
                        e.preventDefault();
                        showNotification("Cards can only be placed during the Strategy Phase.", "warning");
                        return false;
                    }

                    this.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', this.dataset.cardType);

                    // Crea un'immagine trasparente per il drag
                    const img = new Image();
                    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    e.dataTransfer.setDragImage(img, 0, 0);

                    // Salva l'elemento trascinato per accedervi globalmente
                    window.draggedElement = this;
                });

                monsterCard.addEventListener('dragend', function () {
                    this.classList.remove('dragging');
                    // Ripulisci lo stile che potrebbe essere stato applicato
                    this.style.opacity = '';

                    // Rimuovi la variabile globale
                    window.draggedElement = null;
                });
            });
        }
    },

    // Aggiorna l'UI delle carte in mano del giocatore 2 (computer)
    updatePlayer2CardsUI: function () {
        const p2Hand = document.querySelector('.player-area.opponent .hand');
        if (p2Hand) {
            // Svuota la mano attuale
            p2Hand.innerHTML = '';

            // Aggiungi 5 carte coperte per il giocatore 2
            for (let i = 0; i < 5; i++) {
                const card = document.createElement('div');
                card.className = 'card';
                card.textContent = `Card ${i + 1}`;
                p2Hand.appendChild(card);
            }
        }
    },

    // Posiziona i campioni nel tabellone
    placeChampionsOnBoard: function () {
        const p1Champion = document.querySelector('.player-area.user .monster-slot.champion');
        const p2Champion = document.querySelector('.player-area.opponent .monster-slot.champion');

        if (p1Champion && p2Champion) {
            // Posiziona il campione del giocatore 1
            const champion1 = this.players[PLAYERS.PLAYER1].champion;
            p1Champion.innerHTML = `
                <div class="card monster-card champion">
                    ${champion1.name}
                    <div class="card-stats">
                        ATK: ${champion1.attack}<br>
                        DEF: ${champion1.defense}<br>
                        SPD: ${champion1.speed}
                    </div>
                    <div class="card-effect">${champion1.effect}</div>
                </div>
            `;

            // Posiziona il campione del giocatore 2 (solo nome visibile per il giocatore)
            const champion2 = this.players[PLAYERS.PLAYER2].champion;
            p2Champion.innerHTML = `
                <div class="card monster-card champion">
                    ${champion2.name}
                    <div class="card-stats">
                        ATK: ${champion2.attack}<br>
                        DEF: ${champion2.defense}<br>
                        SPD: ${champion2.speed}
                    </div>
                    <div class="card-effect">${champion2.effect}</div>
                </div>
            `;
        }

        // Imposta la difesa del lane del campione in base alla statistica del campione
        this.players[PLAYERS.PLAYER1].lanes[1] = this.players[PLAYERS.PLAYER1].champion.defense;
        this.players[PLAYERS.PLAYER2].lanes[1] = this.players[PLAYERS.PLAYER2].champion.defense;

        // Aggiorna le etichette delle lane
        this.updateLaneLabels();
    },

    // Aggiorna le etichette delle lane
    updateLaneLabels: function () {
        const p1LaneLabels = document.querySelectorAll('.player-area.user .lane-label');
        const p2LaneLabels = document.querySelectorAll('.player-area.opponent .lane-label');

        if (p1LaneLabels.length === 3 && p2LaneLabels.length === 3) {
            // Aggiorna le etichette delle lane del giocatore 1
            p1LaneLabels[0].textContent = `Side Lane [${this.players[PLAYERS.PLAYER1].lanes[0]}]`;
            p1LaneLabels[1].textContent = `Champion Lane [${this.players[PLAYERS.PLAYER1].lanes[1]}]`;
            p1LaneLabels[2].textContent = `Side Lane [${this.players[PLAYERS.PLAYER1].lanes[2]}]`;

            // Aggiorna le etichette delle lane del giocatore 2
            p2LaneLabels[0].textContent = `Side Lane [${this.players[PLAYERS.PLAYER2].lanes[0]}]`;
            p2LaneLabels[1].textContent = `Champion Lane [${this.players[PLAYERS.PLAYER2].lanes[1]}]`;
            p2LaneLabels[2].textContent = `Side Lane [${this.players[PLAYERS.PLAYER2].lanes[2]}]`;
        }
    },

    // Inizia un nuovo turno
    startNewTurn: function () {
        logGameEvent(`Starting turn ${this.currentTurn}...`);
        this.currentPhase = PHASES.DRAW;
        this.updateUI();

        // Aggiorniamo gli indicatori di giocatore attivo (entrambi i giocatori sono attivi simultaneamente)
        document.querySelector('.player-area.user').classList.add('active');
        document.querySelector('.player-area.opponent').classList.add('active');

        // Aggiorna l'indicatore del giocatore attivo per mostrare entrambi
        const activePlayerIndicator = document.querySelector('.active-player');
        if (activePlayerIndicator) {
            activePlayerIndicator.textContent = `Active Players: Player 1 and Player 2 (Synchronous Turn)`;
        }

        // Entrambi i giocatori pescano una carta dal loro mazzo
        this.drawCardsForPlayers();

        describePhase('draw');

        // Dopo 1.5 secondi, passa alla strategy phase
        setTimeout(() => {
            this.enterStrategyPhase();
        }, 1500);
    },

    // Gestisce la pescata di carte per entrambi i giocatori
    drawCardsForPlayers: function () {
        logGameEvent(`Both players draw a card at the beginning of turn ${this.currentTurn}.`);
        showNotification(`Player 1 and Player 2 both draw a card`, 'info');

        // Giocatore 1 (umano) pesca una carta
        if (this.players[PLAYERS.PLAYER1].deck.length > 0) {
            const drawnCard = this.players[PLAYERS.PLAYER1].deck.pop();

            // Aggiorna il contatore del mazzo
            const p1DeckCount = document.querySelector('.player-area.user .deck .count');
            if (p1DeckCount) {
                p1DeckCount.textContent = this.players[PLAYERS.PLAYER1].deck.length.toString();
            }

            // Aggiungi la carta pescata alla mano del giocatore 1
            const p1Hand = document.querySelector('.player-area.user .hand');
            if (p1Hand) {
                const spellCard = document.createElement('div');
                spellCard.className = 'card spell-card';
                spellCard.setAttribute('draggable', 'true');
                spellCard.setAttribute('data-card-type', 'spell');
                spellCard.setAttribute('data-card-id', `spell-${this.currentTurn}`);

                spellCard.innerHTML = `
                    ${drawnCard.name}
                    <div class="card-desc">${drawnCard.effect}</div>
                `;

                p1Hand.appendChild(spellCard);

                // Aggiungi gli event listeners per trascinare la carta
                spellCard.addEventListener('dragstart', function (e) {
                    // Verifica se è possibile trascinare la carta in base alla fase di gioco
                    if (gameState.currentPhase !== PHASES.STRATEGY) {
                        e.preventDefault();
                        showNotification("Cards can only be placed during the Strategy Phase.", "warning");
                        return false;
                    }

                    this.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', this.dataset.cardType);

                    // Crea un'immagine trasparente per il drag
                    const img = new Image();
                    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    e.dataTransfer.setDragImage(img, 0, 0);

                    // Salva l'elemento trascinato per accedervi globalmente
                    window.draggedElement = this;
                });

                spellCard.addEventListener('dragend', function () {
                    this.classList.remove('dragging');
                    // Ripulisci lo stile che potrebbe essere stato applicato
                    this.style.opacity = '';

                    // Rimuovi la variabile globale
                    window.draggedElement = null;
                });
            }
        } else {
            logGameEvent(`Player 1 has no more cards to draw!`);
            showNotification(`Player 1 has no more cards to draw! Watch out for deck-out.`, 'warning');
        }

        // Giocatore 2 (computer) pesca una carta
        if (this.players[PLAYERS.PLAYER2].deck.length > 0) {
            const drawnCard = this.players[PLAYERS.PLAYER2].deck.pop();

            // Aggiorna il contatore del mazzo
            const p2DeckCount = document.querySelector('.player-area.opponent .deck .count');
            if (p2DeckCount) {
                p2DeckCount.textContent = this.players[PLAYERS.PLAYER2].deck.length.toString();
            }

            // Aggiungi una carta generica alla mano del giocatore 2 (computer)
            const p2Hand = document.querySelector('.player-area.opponent .hand');
            if (p2Hand) {
                const newCard = document.createElement('div');
                newCard.className = 'card';
                newCard.textContent = `Card ${p2Hand.children.length + 1}`;
                p2Hand.appendChild(newCard);
            }
        } else {
            logGameEvent(`Player 2 has no more cards to draw!`);
            showNotification(`Player 2 has no more cards to draw! The computer is close to losing.`, 'warning');
        }
    },

    // Entra nella strategy phase
    enterStrategyPhase: function () {
        logGameEvent('Entering Strategy Phase - Both players select their actions simultaneously');
        this.currentPhase = PHASES.STRATEGY;
        this.timeRemaining = 30; // Reset del timer a 30 secondi
        this.updateUI();

        showNotification('Strategy Phase - Both players place cards and select actions simultaneously', 'info');
        describePhase('strategy');

        // Reset delle azioni selezionate
        this.players[PLAYERS.PLAYER1].selectedActions = [null, null, null];
        this.players[PLAYERS.PLAYER2].selectedActions = [null, null, null];

        // Simula anche il turno del computer
        setTimeout(() => {
            // Posiziona carte dal computer
            this.computerPlaceCards();

            // Seleziona azioni per le carte sul campo del computer
            this.computerSelectActions();

            // Non passiamo ancora alla battaglia - aspettiamo che anche il giocatore faccia le sue scelte
            showNotification(`Computer has made its choices. Your turn to select actions.`, 'info');
        }, 1500);

        // Avvia il timer per la Strategy Phase
        this.startStrategyTimer();
    },

    // Esegui il turno del computer (Player 2)
    executeComputerTurn: function () {
        logGameEvent('Computer is making decisions...');
        showNotification('Computer is deciding its strategy', 'info');

        // 1. Posiziona carte dal computer
        this.computerPlaceCards();

        // 2. Seleziona azioni per le carte sul campo
        this.computerSelectActions();

        // 3. Dopo un breve ritardo, passa alla battaglia
        setTimeout(() => {
            this.enterBattlePhase();
        }, 1500);
    },

    // Posiziona carte per il computer
    computerPlaceCards: function () {
        // Ottieni la mano del computer
        const computerHand = this.players[PLAYERS.PLAYER2].hand;

        // Posiziona mostri nelle posizioni vuote
        for (let position = 0; position < 3; position++) {
            // Se la posizione è vuota e abbiamo un mostro disponibile
            if (!this.players[PLAYERS.PLAYER2].board[position]) {
                // Cerca un mostro nella mano
                const monsterIndex = computerHand.findIndex(card => card.class); // Solo le carte mostro hanno class

                if (monsterIndex >= 0) {
                    // Posiziona il mostro
                    const monster = computerHand.splice(monsterIndex, 1)[0];
                    this.players[PLAYERS.PLAYER2].board[position] = monster;

                    // Aggiorna l'UI
                    this.updateComputerBoardUI(position, monster);

                    logGameEvent(`Computer places ${monster.name} in position ${position}`);
                    showNotification(`Computer places a monster`, 'info');
                }
            }
        }

        // Posiziona magie nelle posizioni vuote
        for (let position = 0; position < 3; position++) {
            // Se la posizione è vuota e abbiamo una magia disponibile
            if (!this.players[PLAYERS.PLAYER2].spells[position]) {
                // Cerca una magia nella mano
                const spellIndex = computerHand.findIndex(card => !card.class); // Le carte magia non hanno class

                if (spellIndex >= 0) {
                    // Posiziona la magia
                    const spell = computerHand.splice(spellIndex, 1)[0];
                    this.players[PLAYERS.PLAYER2].spells[position] = spell;

                    // Aggiorna l'UI
                    this.updateComputerSpellUI(position);

                    logGameEvent(`Computer places a spell in position ${position}`);
                    showNotification(`Computer places a spell`, 'info');
                }
            }
        }

        // Aggiorna l'UI della mano del computer
        this.updatePlayer2CardsUI();
    },

    // Aggiorna l'UI del mostro sul campo per il computer
    updateComputerBoardUI: function (position, monster) {
        const slot = document.querySelector(`.player-area.opponent .monster-slot[data-position="${position}"]`);
        if (slot) {
            slot.innerHTML = '';
            slot.classList.remove('empty');

            const cardElement = document.createElement('div');
            cardElement.className = 'card monster-card hidden-monster';

            // Salva i dati della carta in attributi data, ma non mostrare i dettagli
            cardElement.setAttribute('data-name', monster.name);
            cardElement.setAttribute('data-attack', monster.attack);
            cardElement.setAttribute('data-defense', monster.defense);
            cardElement.setAttribute('data-speed', monster.speed);
            cardElement.setAttribute('data-class', monster.class);
            cardElement.setAttribute('data-effect', monster.effect);

            // Mostro solo che è stata posizionata una carta mostro, senza dettagli
            cardElement.innerHTML = `
                <div class="card-back-text">Unknown Monster</div>
            `;

            slot.appendChild(cardElement);
        }
    },

    // Aggiorna l'UI della magia sul campo per il computer
    updateComputerSpellUI: function (position) {
        const slot = document.querySelector(`.player-area.opponent .spell-slot[data-position="${position}"]`);
        if (slot) {
            slot.innerHTML = '';
            slot.classList.remove('empty');

            const cardElement = document.createElement('div');
            cardElement.className = 'card spell-card';
            cardElement.textContent = 'Hidden Spell';

            slot.appendChild(cardElement);
        }
    },

    // Seleziona azioni per le carte del computer
    computerSelectActions: function () {
        for (let position = 0; position < 3; position++) {
            const card = this.players[PLAYERS.PLAYER2].board[position];
            if (!card) continue;

            // Ottiene le azioni disponibili per questa carta
            const availableActions = this.getAvailableActions(card);

            // Ottiene l'azione migliore in base alla situazione di gioco
            const bestAction = this.computerChooseBestAction(position, card, availableActions);

            // Seleziona l'azione
            if (bestAction) {
                this.selectAction(PLAYERS.PLAYER2, position, bestAction);
            }
        }
    },

    // AI per scegliere la migliore azione per una carta
    computerChooseBestAction: function (position, card, availableActions) {
        if (availableActions.length === 0) return null;

        // Ottieni la situazione del campo di gioco
        const opponentBoard = this.players[PLAYERS.PLAYER1].board;

        // Strategia semplice: preferisci sempre attaccare se possibile

        // Verifica se c'è un nemico nella stessa colonna
        const hasDirectOpponent = !!opponentBoard[position];

        // Se c'è un nemico diretto e possiamo attaccare verticalmente, fallo
        if (hasDirectOpponent && availableActions.includes(ACTION_TYPES.ATTACK_VERTICAL)) {
            return ACTION_TYPES.ATTACK_VERTICAL;
        }

        // Controlla se siamo un All Rounder e c'è un nemico nelle colonne diagonali
        if (availableActions.includes(ACTION_TYPES.ATTACK_DIAGONAL_LEFT) && position > 0 && opponentBoard[position - 1]) {
            return ACTION_TYPES.ATTACK_DIAGONAL_LEFT;
        }

        if (availableActions.includes(ACTION_TYPES.ATTACK_DIAGONAL_RIGHT) && position < 2 && opponentBoard[position + 1]) {
            return ACTION_TYPES.ATTACK_DIAGONAL_RIGHT;
        }

        // Se non ci sono nemici da attaccare ma possiamo attaccare verticalmente, fallo comunque
        // per danneggiare direttamente la lane
        if (availableActions.includes(ACTION_TYPES.ATTACK_VERTICAL)) {
            return ACTION_TYPES.ATTACK_VERTICAL;
        }

        // Se siamo un defender e non possiamo attaccare, difendiamo
        if (availableActions.includes(ACTION_TYPES.DEFEND)) {
            return ACTION_TYPES.DEFEND;
        }

        // Se siamo un pumper e non possiamo attaccare, usiamo il pump
        if (availableActions.includes(ACTION_TYPES.PUMP)) {
            return ACTION_TYPES.PUMP;
        }

        // Fallback: scegli un'azione casuale
        return availableActions[Math.floor(Math.random() * availableActions.length)];
    },

    // Gestisce il timer della Strategy Phase
    startStrategyTimer: function () {
        // Aggiorna l'UI del timer ogni secondo
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerUI();

            // Alert when 10 seconds remaining
            if (this.timeRemaining === 10) {
                showNotification('10 seconds remaining!', 'warning');

                // Mostra l'avviso di 10 secondi grande
                this.showTimeWarning();

                // Aggiungi la classe low-time al timer
                const timerElement = document.querySelector('.timer');
                if (timerElement) {
                    timerElement.classList.add('low-time');
                }
            }

            // Quando il timer arriva a 0, passa alla Battle Phase
            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);

                // Rimuovi la classe low-time dal timer
                const timerElement = document.querySelector('.timer');
                if (timerElement) {
                    timerElement.classList.remove('low-time');
                }

                showNotification('Time\'s up! Moving to Battle Phase', 'warning');
                this.enterBattlePhase();
            }
        }, 1000);
    },

    // Mostra un avviso grande di 10 secondi rimanenti
    showTimeWarning: function () {
        // Rimuovi eventuali avvisi precedenti
        const existingWarning = document.querySelector('.time-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        // Crea l'avviso
        const warning = document.createElement('div');
        warning.className = 'time-warning';
        warning.textContent = '10 SECONDS REMAINING!';

        // Aggiungi al DOM
        document.body.appendChild(warning);

        // Rimuovi dopo l'animazione (2 secondi)
        setTimeout(() => {
            warning.remove();
        }, 2000);
    },

    // Entra nella battle phase
    enterBattlePhase: function () {
        logGameEvent('Entering Battle Phase - Resolving all actions in order of Speed');
        this.currentPhase = PHASES.BATTLE;
        this.updateUI();

        // Rimuovi tutti i menu d'azione aperti
        document.querySelectorAll('.action-menu').forEach(menu => menu.remove());

        // Simula il processamento delle azioni in battaglia
        logGameEvent('Processing battle actions...');
        showNotification('Battle Phase - Resolving combat based on Speed', 'info');
        describePhase('battle');

        // Esegui le azioni di battaglia nell'ordine corretto
        setTimeout(() => {
            this.executeBattleActions();
        }, 1000);
    },

    // Esegui le azioni di battaglia nell'ordine corretto
    executeBattleActions: function () {
        // 1. Attivazione spell in ordine di priorità
        this.activateSpells();

        // 2. Crea lista di tutte le azioni di attacco da eseguire
        const attackActions = this.collectAttackActions();

        // 3. Ordina per velocità (SPD), poi per ATK, poi per DEF
        this.sortActionsBySpeed(attackActions);

        // 4. Esegui gli attacchi nell'ordine stabilito
        this.executeAttacks(attackActions);

        // 5. Passa alla end phase dopo aver completato tutte le azioni
        setTimeout(() => {
            this.enterEndPhase();
        }, 3000);
    },

    // Attiva tutte le carte magia giocate
    activateSpells: function () {
        logGameEvent('Activating spell cards...');

        // Implementazione futura
        // Per ora un messaggio informativo
        showNotification('Spell cards would activate here', 'info');
    },

    // Raccoglie tutte le azioni di attacco da entrambi i giocatori
    collectAttackActions: function () {
        const attackActions = [];

        // Raccogli azioni del giocatore 1
        for (let i = 0; i < 3; i++) {
            if (this.players[PLAYERS.PLAYER1].board[i] && this.players[PLAYERS.PLAYER1].selectedActions[i]) {
                const action = this.players[PLAYERS.PLAYER1].selectedActions[i];
                if (this.isAttackAction(action)) {
                    // Verifica se l'attacco in diagonale è valido
                    if ((action === ACTION_TYPES.ATTACK_DIAGONAL_LEFT && i === 0) ||
                        (action === ACTION_TYPES.ATTACK_DIAGONAL_RIGHT && i === 2)) {
                        // Attacco in diagonale non valido, ignora
                        logGameEvent(`Player 1's monster at position ${i} cannot attack diagonally outside the board.`);
                        continue;
                    }
                    attackActions.push({
                        player: PLAYERS.PLAYER1,
                        position: i,
                        card: this.players[PLAYERS.PLAYER1].board[i],
                        action: action
                    });
                }
            }
        }

        // Raccogli azioni del giocatore 2 (computer)
        for (let i = 0; i < 3; i++) {
            if (this.players[PLAYERS.PLAYER2].board[i] && this.players[PLAYERS.PLAYER2].selectedActions[i]) {
                const action = this.players[PLAYERS.PLAYER2].selectedActions[i];
                if (this.isAttackAction(action)) {
                    // Verifica se l'attacco in diagonale è valido
                    if ((action === ACTION_TYPES.ATTACK_DIAGONAL_LEFT && i === 0) ||
                        (action === ACTION_TYPES.ATTACK_DIAGONAL_RIGHT && i === 2)) {
                        // Attacco in diagonale non valido, ignora
                        logGameEvent(`Player 2's monster at position ${i} cannot attack diagonally outside the board.`);
                        continue;
                    }
                    attackActions.push({
                        player: PLAYERS.PLAYER2,
                        position: i,
                        card: this.players[PLAYERS.PLAYER2].board[i],
                        action: action
                    });
                }
            }
        }

        return attackActions;
    },

    // Verifica se un'azione è di tipo attacco
    isAttackAction: function (action) {
        return action === ACTION_TYPES.ATTACK_VERTICAL ||
            action === ACTION_TYPES.ATTACK_DIAGONAL_LEFT ||
            action === ACTION_TYPES.ATTACK_DIAGONAL_RIGHT;
    },

    // Ordina le azioni di attacco in base alla velocità (SPD)
    sortActionsBySpeed: function (attackActions) {
        attackActions.sort((a, b) => {
            // Ordina per SPD (decrescente)
            if (b.card.speed !== a.card.speed) {
                return b.card.speed - a.card.speed;
            }

            // In caso di parità, ordina per ATK (decrescente)
            if (b.card.attack !== a.card.attack) {
                return b.card.attack - a.card.attack;
            }

            // In caso di ulteriore parità, ordina per DEF (decrescente)
            return b.card.defense - a.card.defense;
        });
    },

    // Esegui gli attacchi nell'ordine stabilito
    executeAttacks: function (attackActions) {
        if (attackActions.length === 0) {
            logGameEvent('No attack actions to execute.');
            this.showBattleResolutionSummary([]);
            return;
        }

        logGameEvent('Executing attacks in order of SPD...');

        // Array per tracciare tutti i risultati degli attacchi per il pop-up di riepilogo
        const battleResults = [];

        // Rivela gli attributi delle carte dell'avversario
        this.revealOpponentCards();

        // Per ogni azione di attacco
        let index = 0;
        const executeNextAttack = () => {
            if (index >= attackActions.length) {
                // Tutti gli attacchi sono stati eseguiti, mostra il riepilogo
                this.showBattleResolutionSummary(battleResults);
                return;
            }

            const attackAction = attackActions[index];
            const result = this.executeAttack(attackAction);

            // Aggiungi il risultato all'array dei risultati
            battleResults.push(result);

            // Incrementa l'indice e procedi con il prossimo attacco dopo un ritardo
            index++;
            setTimeout(executeNextAttack, 800);
        };

        // Inizia l'esecuzione degli attacchi
        executeNextAttack();
    },

    // Rivela gli attributi delle carte dell'avversario durante la battaglia
    revealOpponentCards: function () {
        // Trova tutte le carte avversarie nascoste
        const hiddenCards = document.querySelectorAll('.player-area.opponent .monster-card.hidden-monster');

        hiddenCards.forEach(card => {
            // Rimuovi la classe 'hidden-monster'
            card.classList.remove('hidden-monster');

            // Ottieni gli attributi dalla carta
            const name = card.getAttribute('data-name');
            const attack = card.getAttribute('data-attack');
            const defense = card.getAttribute('data-defense');
            const speed = card.getAttribute('data-speed');
            const monsterClass = card.getAttribute('data-class');
            const effect = card.getAttribute('data-effect');

            // Determina la classe CSS appropriata per il tipo di mostro
            if (monsterClass === "Defender") {
                card.classList.add('defender');
            } else if (monsterClass === "Pumper") {
                card.classList.add('pumper');
            } else if (monsterClass === "All Rounder") {
                card.classList.add('all-rounder');
            }

            // Aggiorna HTML per mostrare le statistiche
            card.innerHTML = `
                ${name}
                <div class="card-stats">
                    ATK: ${attack}<br>
                    DEF: ${defense}<br>
                    SPD: ${speed}
                </div>
                <div class="card-class">${monsterClass}</div>
                <div class="card-effect">${effect}</div>
            `;
        });

        // Aggiungi un'animazione di rivelazione
        document.querySelectorAll('.player-area.opponent .monster-card').forEach(card => {
            card.classList.add('revealed');
            setTimeout(() => card.classList.remove('revealed'), 1000);
        });
    },

    // Esegui un singolo attacco
    executeAttack: function (attackAction) {
        const { player, position, card, action } = attackAction;
        const opponentPlayer = player === PLAYERS.PLAYER1 ? PLAYERS.PLAYER2 : PLAYERS.PLAYER1;

        // Determina la posizione bersaglio in base al tipo di attacco
        let targetPosition;
        if (action === ACTION_TYPES.ATTACK_VERTICAL) {
            targetPosition = position;
        } else if (action === ACTION_TYPES.ATTACK_DIAGONAL_LEFT) {
            targetPosition = position === 0 ? null : position - 1;
        } else if (action === ACTION_TYPES.ATTACK_DIAGONAL_RIGHT) {
            targetPosition = position === 2 ? null : position + 1;
        }

        // Prepara l'oggetto risultato dell'attacco
        const attackResult = {
            attacker: {
                player: player,
                position: position,
                card: card,
                action: action
            },
            target: {
                player: opponentPlayer,
                position: targetPosition,
                card: null,
                initialHealth: null,
                finalHealth: null,
                destroyed: false
            },
            damage: 0,
            targetType: 'none'
        };

        // Se la posizione target non è valida, annulla l'attacco
        if (targetPosition === null) {
            logGameEvent(`Player ${player + 1}'s ${card.name} cannot attack in that direction.`);
            return attackResult;
        }

        // Ottieni il bersaglio (mostro o champion)
        const target = this.players[opponentPlayer].board[targetPosition];

        // Se c'è un bersaglio, aggiorna il risultato dell'attacco
        if (target) {
            attackResult.target.card = target;
            attackResult.target.initialHealth = target.defense;
            attackResult.targetType = 'monster';
        } else {
            // Bersaglio è una lane
            attackResult.target.initialHealth = this.players[opponentPlayer].lanes[targetPosition];
            attackResult.targetType = 'lane';
        }

        // Se non c'è un bersaglio, danneggia direttamente la lane
        if (!target) {
            const damage = card.attack;
            this.applyDamageToLane(opponentPlayer, targetPosition, damage);
            logGameEvent(`Player ${player + 1}'s ${card.name} attacks empty position and deals ${damage} damage to lane.`);
            this.animateAttack(player, position, opponentPlayer, targetPosition, false);

            // Aggiorna il risultato dell'attacco
            attackResult.damage = damage;
            attackResult.target.finalHealth = this.players[opponentPlayer].lanes[targetPosition];
            return attackResult;
        }

        // Calcola il danno in base alle regole
        const damage = this.calculateDamage(card, target);

        // Applica il danno al bersaglio
        this.applyDamageToCard(opponentPlayer, targetPosition, damage);

        // Aggiorna il risultato dell'attacco
        attackResult.damage = damage;
        attackResult.target.finalHealth = target.defense > 0 ? target.defense : 0;
        attackResult.target.destroyed = target.defense <= 0;

        logGameEvent(`Player ${player + 1}'s ${card.name} attacks Player ${opponentPlayer + 1}'s ${target.name} and deals ${damage} damage.`);
        this.animateAttack(player, position, opponentPlayer, targetPosition, true);

        return attackResult;
    },

    // Mostra un popup di riepilogo della risoluzione della battaglia
    showBattleResolutionSummary: function (battleResults) {
        // Rimuovi eventuali popup esistenti
        const existingPopup = document.querySelector('.battle-resolution-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Crea il popup
        const popup = document.createElement('div');
        popup.className = 'battle-resolution-popup';

        // Crea l'header
        const header = document.createElement('div');
        header.className = 'battle-popup-header';
        header.innerHTML = `<h2>Battle Resolution</h2>`;
        popup.appendChild(header);

        // Crea il contenuto
        const content = document.createElement('div');
        content.className = 'battle-popup-content';

        if (battleResults.length === 0) {
            content.innerHTML = `<p>No attacks were executed this turn.</p>`;
        } else {
            let html = `<div class="battle-timeline">`;

            // Aggiungi ogni risultato di attacco
            battleResults.forEach((result, index) => {
                const attackerName = result.attacker.card.name;
                const attackerPlayer = result.attacker.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
                const targetPlayer = result.target.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";

                html += `
                <div class="battle-event">
                    <div class="battle-step">${index + 1}</div>
                    <div class="battle-description">
                `;

                if (result.targetType === 'monster') {
                    const targetName = result.target.card.name;
                    const initialHealth = result.target.initialHealth;
                    const finalHealth = result.target.finalHealth;
                    const damage = result.damage;

                    html += `<p><span class="player-${result.attacker.player + 1}">${attackerPlayer}'s ${attackerName}</span> attacked <span class="player-${result.target.player + 1}">${targetPlayer}'s ${targetName}</span></p>`;
                    html += `<p>Dealt <span class="damage">${damage} damage</span> (DEF: ${initialHealth} → ${finalHealth})</p>`;

                    if (result.target.destroyed) {
                        html += `<p class="destroyed"><span class="player-${result.target.player + 1}">${targetName}</span> was destroyed!</p>`;
                    }
                } else if (result.targetType === 'lane') {
                    const position = result.target.position === 1 ? "Champion Lane" : `Side Lane ${result.target.position + 1}`;
                    const damage = result.damage;
                    html += `<p><span class="player-${result.attacker.player + 1}">${attackerPlayer}'s ${attackerName}</span> attacked <span class="player-${result.target.player + 1}">${targetPlayer}'s ${position}</span> directly</p>`;
                    html += `<p>Dealt <span class="damage">${damage} damage</span> (HP: ${result.target.initialHealth} → ${result.target.finalHealth})</p>`;

                    if (result.target.finalHealth <= 0) {
                        html += `<p class="destroyed"><span class="player-${result.target.player + 1}">${position}</span> was destroyed!</p>`;
                    }
                } else {
                    html += `<p>Attack could not be executed</p>`;
                }

                html += `
                    </div>
                </div>
                `;
            });

            html += `</div>`;
            content.innerHTML = html;
        }

        popup.appendChild(content);

        // Crea un footer con pulsante di chiusura
        const footer = document.createElement('div');
        footer.className = 'battle-popup-footer';

        const closeButton = document.createElement('button');
        closeButton.className = 'battle-popup-close';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => popup.remove());

        footer.appendChild(closeButton);
        popup.appendChild(footer);

        // Aggiungi il popup al DOM
        document.body.appendChild(popup);

        // Aggiungi un evento di chiusura anche cliccando fuori dal popup
        popup.addEventListener('click', function (e) {
            if (e.target === popup) {
                popup.remove();
            }
        });
    },

    // Seleziona un'azione per una carta
    selectAction: function (player, position, action) {
        // Salva l'azione selezionata nel game state
        this.players[player].selectedActions[position] = action;

        // Ottieni la carta
        const card = this.players[player].board[position];

        // Log dell'azione
        logGameEvent(`Player ${player + 1}'s ${card.name} will ${this.getActionLabel(action)}`);

        // Aggiorna l'UI per mostrare l'azione selezionata solo al player che l'ha scelta
        if (player === PLAYERS.PLAYER1) {
            const cardElement = document.querySelector(`.player-area.user .monster-slot[data-position="${position}"] .card`);
            if (cardElement) {
                // Rimuovi tutti gli indicatori di azione precedenti
                cardElement.querySelectorAll('.action-indicator').forEach(indicator => indicator.remove());

                // Crea un nuovo indicatore
                const actionIndicator = document.createElement('div');
                actionIndicator.className = 'action-indicator';
                actionIndicator.textContent = this.getActionLabel(action);

                // Aggiungi classe di stile in base al tipo di azione
                if (this.isAttackAction(action)) {
                    actionIndicator.classList.add('attack-action');
                } else if (action === ACTION_TYPES.DEFEND) {
                    actionIndicator.classList.add('defend-action');
                } else if (action === ACTION_TYPES.PUMP) {
                    actionIndicator.classList.add('pump-action');
                }

                cardElement.appendChild(actionIndicator);
            }
        }

        // Notifica al player
        if (player === PLAYERS.PLAYER1) {
            showNotification(`${card.name} will ${this.getActionLabel(action)}`, 'info');
        }
    },

    // Calcola il danno in base alle statistiche delle carte
    calculateDamage: function (attackingCard, defendingCard) {
        // Verifica se il difensore sta usando protezione
        const isDefending = defendingCard.selectedAction === ACTION_TYPES.DEFEND;

        // Calcoliamo il valore effettivo di attacco
        let effectiveAttack = attackingCard.attack;

        // Se il difensore sta proteggendo, riduce il danno del suo ATK
        if (isDefending) {
            effectiveAttack = Math.max(0, effectiveAttack - defendingCard.attack);
        }

        // Formula di calcolo del danno come specificato nel documento
        let damage;
        if (effectiveAttack > defendingCard.attack) {
            // Se l'attacco è maggiore, danno = differenza
            damage = effectiveAttack - defendingCard.attack;
        } else if (effectiveAttack === defendingCard.attack) {
            // Se l'attacco è uguale, difesa ridotta a 1 (se maggiore di 1)
            damage = Math.max(0, defendingCard.defense - 1);
        } else {
            // Se l'attacco è minore, danno = attacco effettivo
            damage = effectiveAttack;
        }

        return damage;
    },

    // Applica danno a una carta
    applyDamageToCard: function (player, position, damage) {
        const card = this.players[player].board[position];

        if (!card) return;

        // Riduci difesa
        card.defense -= damage;

        // Se la difesa va a zero o meno, la carta viene distrutta
        if (card.defense <= 0) {
            this.destroyCard(player, position);
        } else {
            // Aggiorna visivamente la difesa della carta
            this.updateCardStats(player, position, card);
        }
    },

    // Distrugge una carta e la manda al cimitero
    destroyCard: function (player, position) {
        const card = this.players[player].board[position];

        if (!card) return;

        // Aggiungi carta al cimitero
        this.players[player].graveyard.push(card);

        // Rimuovi carta dal campo
        this.players[player].board[position] = null;

        // Aggiorna il contatore del cimitero
        const graveyardCount = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .graveyard .count`);
        if (graveyardCount) {
            graveyardCount.textContent = this.players[player].graveyard.length.toString();
        }

        // Rimuovi la carta dall'interfaccia
        const slot = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${position}"]`);
        if (slot) {
            slot.innerHTML = "Monster";
            slot.classList.add('empty');
        }

        logGameEvent(`Player ${player + 1}'s ${card.name} was destroyed and sent to the graveyard.`);
        showNotification(`${card.name} was destroyed!`, 'warning');
    },

    // Applica danno a una lane
    applyDamageToLane: function (player, position, damage) {
        // Assicurati che la posizione sia valida
        if (position < 0 || position > 2) return;

        // Applica danno alla lane
        if (this.players[player].lanes[position] !== null) {
            this.players[player].lanes[position] -= damage;

            // Se la vita della lane va a zero o meno, la lane è distrutta
            if (this.players[player].lanes[position] <= 0) {
                this.players[player].lanes[position] = 0;
                logGameEvent(`Player ${player + 1}'s lane ${position} has been destroyed!`);
                showNotification(`Player ${player + 1}'s lane ${position} has been destroyed!`, 'warning');
            }

            // Aggiorna l'interfaccia delle lane
            this.updateLaneLabels();
        }
    },

    // Aggiorna le statistiche di una carta visivamente
    updateCardStats: function (player, position, card) {
        const slot = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${position}"]`);
        if (slot) {
            const cardElement = slot.querySelector('.card');
            if (cardElement) {
                const statsElement = cardElement.querySelector('.card-stats');
                if (statsElement) {
                    statsElement.innerHTML = `
                        ATK: ${card.attack}<br>
                        DEF: ${card.defense}<br>
                        SPD: ${card.speed}
                    `;
                }
            }
        }
    },

    // Animazione di attacco
    animateAttack: function (attackerPlayer, attackerPosition, defenderPlayer, defenderPosition, hasTarget) {
        // Ottieni gli elementi slot
        const attackerSlot = document.querySelector(`.player-area.${attackerPlayer === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${attackerPosition}"]`);
        const defenderSlot = document.querySelector(`.player-area.${defenderPlayer === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${defenderPosition}"]`);

        if (!attackerSlot) return;

        // Crea un elemento per l'animazione di attacco
        const attackAnimation = document.createElement('div');
        attackAnimation.className = 'attack-animation';
        document.body.appendChild(attackAnimation);

        // Posiziona l'animazione di attacco
        const attackerRect = attackerSlot.getBoundingClientRect();
        const attackerCenter = {
            x: attackerRect.left + attackerRect.width / 2,
            y: attackerRect.top + attackerRect.height / 2
        };

        let targetCenter;
        if (defenderSlot && hasTarget) {
            const defenderRect = defenderSlot.getBoundingClientRect();
            targetCenter = {
                x: defenderRect.left + defenderRect.width / 2,
                y: defenderRect.top + defenderRect.height / 2
            };
        } else {
            // Se non c'è un bersaglio, usa la posizione del difensore come punto di arrivo
            const gameContainer = document.querySelector('.game-container');
            const containerRect = gameContainer.getBoundingClientRect();
            targetCenter = {
                x: attackerCenter.x,
                y: defenderPlayer === PLAYERS.PLAYER1 ? containerRect.top + 200 : containerRect.bottom - 200
            };
        }

        // Posiziona l'animazione
        attackAnimation.style.left = `${attackerCenter.x}px`;
        attackAnimation.style.top = `${attackerCenter.y}px`;

        // Aggiungi classe per l'animazione
        attackAnimation.classList.add('attack-start');

        // Dopo un breve ritardo, avvia l'animazione di movimento
        setTimeout(() => {
            // Rimuovi la classe iniziale
            attackAnimation.classList.remove('attack-start');

            // Calcola la trasformazione
            const dx = targetCenter.x - attackerCenter.x;
            const dy = targetCenter.y - attackerCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            // Applica la trasformazione
            attackAnimation.style.transform = `rotate(${angle}deg) scaleX(${distance / 30})`;
            attackAnimation.classList.add('attack-move');

            // Dopo l'animazione di movimento, mostra l'impatto
            setTimeout(() => {
                attackAnimation.remove();

                // Animazione di impatto
                if (defenderSlot && hasTarget) {
                    defenderSlot.classList.add('hit-impact');
                    setTimeout(() => {
                        defenderSlot.classList.remove('hit-impact');
                    }, 300);
                }
            }, 300);
        }, 100);
    },

    // Funzione per mostrare il menu delle azioni per una carta
    showActionMenu: function (player, position, cardElement) {
        // Solo il giocatore attivo può selezionare azioni durante la fase strategica
        if (this.currentPhase !== PHASES.STRATEGY || player !== this.activePlayer) {
            return;
        }

        // Rimuovi tutti i menu esistenti
        document.querySelectorAll('.action-menu').forEach(menu => menu.remove());

        // Ottieni la carta dal game state
        const card = this.players[player].board[position];
        if (!card) return;

        // Crea il menu delle azioni
        const actionMenu = document.createElement('div');
        actionMenu.className = 'action-menu';

        // Determina le azioni disponibili in base al tipo di carta
        const actions = this.getAvailableActions(card);

        // Crea pulsanti per ogni azione
        actions.forEach(action => {
            const actionButton = document.createElement('button');
            actionButton.className = 'action-button';
            actionButton.textContent = this.getActionLabel(action);
            actionButton.setAttribute('data-action', action);

            // Aggiungi evento click
            actionButton.addEventListener('click', () => {
                this.selectAction(player, position, action);
                actionMenu.remove();
            });

            actionMenu.appendChild(actionButton);
        });

        // Posiziona il menu all'interno della carta
        cardElement.appendChild(actionMenu);
    },

    // Ottiene le azioni disponibili per una carta
    getAvailableActions: function (card) {
        const actions = [];

        // Tutte le carte possono attaccare verticalmente
        actions.push(ACTION_TYPES.ATTACK_VERTICAL);

        // Le carte All Rounder possono attaccare in diagonale
        if (card.class === "All Rounder") {
            // La posizione della carta determinerà se può attaccare in diagonale in entrambe le direzioni
            // Questa logica sarà gestita durante la raccolta delle azioni
            actions.push(ACTION_TYPES.ATTACK_DIAGONAL_LEFT);
            actions.push(ACTION_TYPES.ATTACK_DIAGONAL_RIGHT);
        }

        // Le carte Defender possono difendere
        if (card.class === "Defender") {
            actions.push(ACTION_TYPES.DEFEND);
        }

        // Le carte Pumper possono potenziare le statistiche
        if (card.class === "Pumper") {
            actions.push(ACTION_TYPES.PUMP);
        }

        return actions;
    },

    // Ottiene un'etichetta leggibile per un'azione
    getActionLabel: function (action) {
        switch (action) {
            case ACTION_TYPES.ATTACK_VERTICAL:
                return "Attack ↑";
            case ACTION_TYPES.ATTACK_DIAGONAL_LEFT:
                return "Attack ↖";
            case ACTION_TYPES.ATTACK_DIAGONAL_RIGHT:
                return "Attack ↗";
            case ACTION_TYPES.DEFEND:
                return "Defend 🛡️";
            case ACTION_TYPES.PUMP:
                return "Pump +1/+1/+1";
            case ACTION_TYPES.SPECIAL:
                return "Special ✨";
            default:
                return "Action";
        }
    },

    // Entra nella end phase
    enterEndPhase: function () {
        logGameEvent('Entering End Phase...');
        this.currentPhase = PHASES.END;
        this.updateUI();

        // Simula aggiornamenti di fine turno
        logGameEvent('Applying damage, updating stats, checking win conditions...');
        showNotification('End Phase - Updating game state', 'info');
        describePhase('end');

        // Dopo 2 secondi, passa al turno successivo o termina il gioco
        setTimeout(() => {
            // Controlla le condizioni di vittoria (simulato)
            if (this.checkWinConditions()) {
                this.endGame();
            } else {
                // Incrementa il turno
                this.currentTurn++;
                showNotification(`Turn ${this.currentTurn} begins for both players`, 'success');
                this.startNewTurn();
            }
        }, 2000);
    },

    // Cambia il giocatore attivo
    switchActivePlayer: function () {
        // Non cambiamo più il giocatore attivo, entrambi giocano simultaneamente
        logGameEvent(`Starting new synchronous turn for both players`);

        // Entrambi i giocatori sono attivi
        document.querySelector('.player-area.user').classList.add('active');
        document.querySelector('.player-area.opponent').classList.add('active');

        // Aggiorna l'indicatore per mostrare che entrambi i giocatori sono attivi
        const activePlayerIndicator = document.querySelector('.active-player');
        if (activePlayerIndicator) {
            activePlayerIndicator.textContent = `Active Players: Player 1 and Player 2 (Synchronous Turn)`;
        }
    },

    // Aggiorna l'UI del giocatore attivo
    updateActivePlayerUI: function () {
        // Rimuovi la classe active da tutte le aree giocatore
        document.querySelectorAll('.player-area').forEach(area => {
            area.classList.remove('active');
        });

        // Aggiungi la classe active all'area del giocatore attivo
        if (this.activePlayer === PLAYERS.PLAYER1) {
            document.querySelector('.player-area.user').classList.add('active');
        } else {
            document.querySelector('.player-area.opponent').classList.add('active');
        }

        // Aggiorna l'indicatore del giocatore attivo
        const activePlayerIndicator = document.querySelector('.active-player');
        if (activePlayerIndicator) {
            activePlayerIndicator.textContent = `Active Player: Player ${this.activePlayer + 1}`;
        }
    },

    // Avanza manualmente alla fase successiva (per il pulsante End Turn)
    advancePhase: function () {
        // Ferma il timer se è attivo
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // Passa alla fase successiva in base alla fase corrente
        switch (this.currentPhase) {
            case PHASES.STRATEGY:
                logGameEvent('Strategy Phase ended early by player action.');
                showNotification('Strategy Phase ended. Proceeding to Battle Phase', 'info');
                this.enterBattlePhase();
                break;
            case PHASES.BATTLE:
                logGameEvent('Battle Phase advanced by player action.');
                showNotification('Battle Phase skipped. Proceeding to End Phase', 'info');
                this.enterEndPhase();
                break;
            default:
                logGameEvent(`Cannot advance from ${this.currentPhase} phase.`);
                showNotification('Cannot advance from current phase', 'error');
        }
    },

    // Verifica le condizioni di vittoria (simulato)
    checkWinConditions: function () {
        // Per ora, ritorniamo sempre false per continuare il gioco
        return false;
    },

    // Termina il gioco
    endGame: function () {
        logGameEvent('Game has ended!');
        showNotification('Game has ended!', 'success');
        // Qui andrebbe implementata la logica di fine gioco
    },

    // Aggiorna l'interfaccia utente per mostrare la fase corrente
    updateUI: function () {
        const phaseIndicator = document.querySelector('.phase-indicator');
        if (phaseIndicator) {
            phaseIndicator.textContent = `Phase: ${this.currentPhase.charAt(0).toUpperCase() + this.currentPhase.slice(1)}`;
        }

        // Aggiunta/rimozione classi di fase per lo styling
        document.body.classList.remove('phase-setup', 'phase-draw', 'phase-strategy', 'phase-battle', 'phase-end');
        document.body.classList.add(`phase-${this.currentPhase}`);

        // Aggiorniamo anche il timer se siamo nella Strategy Phase
        this.updateTimerUI();

        // Aggiorniamo il turno corrente
        const turnInfo = document.querySelector('.turn-info');
        if (turnInfo) {
            turnInfo.textContent = `Turn: ${this.currentTurn}`;
        }

        // Aggiorniamo il testo del pulsante End Turn in base alla fase
        const actionButton = document.querySelector('.action-button');
        if (actionButton) {
            if (this.currentPhase === PHASES.STRATEGY) {
                actionButton.textContent = 'End Strategy';
                actionButton.disabled = false;
            } else if (this.currentPhase === PHASES.BATTLE) {
                actionButton.textContent = 'Skip Battle';
                actionButton.disabled = false;
            } else {
                actionButton.textContent = 'Waiting...';
                actionButton.disabled = true;
            }
        }

        // Notifica al server del cambio fase
        if (socket) {
            socket.emit('phase_change', {
                phase: this.currentPhase,
                turn: this.currentTurn,
                activePlayer: this.activePlayer
            });
        }
    },

    // Aggiorna l'UI del timer
    updateTimerUI: function () {
        const timerElement = document.querySelector('.timer');
        if (timerElement) {
            if (this.currentPhase === PHASES.STRATEGY) {
                timerElement.textContent = `Time: ${this.timeRemaining}s`;

                // Effetto di urgenza quando il tempo sta per scadere
                if (this.timeRemaining <= 10) {
                    timerElement.classList.add('low-time');
                } else {
                    timerElement.classList.remove('low-time');
                    timerElement.style.color = '#FFD740';
                    timerElement.style.fontWeight = '600';
                }
            } else {
                timerElement.textContent = `Time: --`;
                timerElement.classList.remove('low-time');
                timerElement.style.color = '#FFD740';
                timerElement.style.fontWeight = '600';
            }
        }
    }
};

// Mostra una descrizione dettagliata della fase corrente
function describePhase(phase) {
    let description = '';

    switch (phase) {
        case 'draw':
            description = `
                <strong>Draw Phase</strong>
                <ul>
                    <li>Both players draw one card from their deck</li>
                    <li>If deck is empty, player loses</li>
                </ul>
            `;
            break;
        case 'strategy':
            description = `
                <strong>Strategy Phase (30 seconds)</strong>
                <ul>
                    <li>Place monster cards in empty positions</li>
                    <li>Place spell cards face-down in back row</li>
                    <li>Select actions for monsters (attack/protect/pump)</li>
                    <li>Use Champion abilities if available</li>
                </ul>
            `;
            break;
        case 'battle':
            description = `
                <strong>Battle Phase</strong>
                <ul>
                    <li>Spells activate in priority</li>
                    <li>Monsters attack in order of highest SPD</li>
                    <li>Damage is calculated based on ATK vs DEF</li>
                    <li>Destroyed cards go to graveyard</li>
                </ul>
            `;
            break;
        case 'end':
            description = `
                <strong>End Phase</strong>
                <ul>
                    <li>Apply damage to cards and lanes</li>
                    <li>Update defense values on damaged cards</li>
                    <li>Check win conditions</li>
                    <li>End turn and switch active player</li>
                </ul>
            `;
            break;
    }

    // Aggiorna il box info con la descrizione della fase
    const phaseInfoBox = document.querySelector('.phase-info-box');
    if (phaseInfoBox) {
        phaseInfoBox.innerHTML = description;
        phaseInfoBox.style.display = 'block';
    }
}

// Configurazione delle animazioni delle carte
function setupCardAnimations() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        // Rotazione 3D al movimento del mouse sulla carta
        card.addEventListener('mousemove', function (e) {
            // Skip animation if card is being dragged
            if (this.classList.contains('dragging')) return;

            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // Coordinata X relativa alla carta
            const y = e.clientY - rect.top;  // Coordinata Y relativa alla carta

            // Calcolo degli angoli di rotazione basati sulla posizione del mouse
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Limitiamo la rotazione tra -15 e 15 gradi
            const rotateY = ((x - centerX) / centerX) * 15;
            const rotateX = ((centerY - y) / centerY) * 10;

            // Skip animation if the card is on the board
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            // Effetto parallasse per dare profondità
            this.style.transform = `translateY(-15px) scale(1.1) perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;

            // Aggiungiamo un effetto di brillantezza che segue il mouse
            let baseColor1, baseColor2;
            if (this.classList.contains('monster-card')) {
                baseColor1 = '#1E3A8A';
                baseColor2 = '#1E40AF';
            } else {
                baseColor1 = '#5B21B6';
                baseColor2 = '#7E22CE';
            }

            const shine = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2), transparent 40%)`;
            this.style.backgroundImage = `linear-gradient(45deg, ${baseColor1}, ${baseColor2}), ${shine}`;
        });

        // Ripristina la posizione originale quando il mouse esce dalla carta
        card.addEventListener('mouseleave', function () {
            // Skip if the card is on the board
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            if (!this.classList.contains('dragging')) {
                this.style.transform = '';

                if (this.classList.contains('monster-card')) {
                    this.style.backgroundImage = 'linear-gradient(45deg, #1E3A8A, #1E40AF)';
                } else {
                    this.style.backgroundImage = 'linear-gradient(45deg, #5B21B6, #7E22CE)';
                }
            }
        });

        // Effetto click
        card.addEventListener('mousedown', function () {
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            this.style.transform = 'translateY(-5px) scale(0.95)';
        });

        card.addEventListener('mouseup', function () {
            if (this.closest('.monster-slot') || this.closest('.spell-slot')) return;

            const rect = this.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            this.style.transform = `translateY(-15px) scale(1.1) perspective(1000px) rotateY(0deg) rotateX(0deg)`;
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
        });
    });

    // Animazioni per gli slot delle carte
    const slots = document.querySelectorAll('.monster-slot, .spell-slot');
    slots.forEach(slot => {
        if (!slot.classList.contains('empty')) {
            // Effetto luce pulsante quando il mouse è sopra uno slot
            slot.addEventListener('mouseenter', function () {
                this.style.boxShadow = '0 0 15px rgba(124, 58, 237, 0.6)';

                // Aggiungiamo una leggera rotazione per dare profondità
                this.style.transform = 'translateY(-3px) scale(1.05) perspective(500px) rotateX(5deg)';
            });

            slot.addEventListener('mouseleave', function () {
                this.style.boxShadow = '';
                this.style.transform = '';
            });

            // Effetto click
            slot.addEventListener('mousedown', function () {
                this.style.transform = 'scale(0.98)';
            });

            slot.addEventListener('mouseup', function () {
                this.style.transform = 'translateY(-3px) scale(1.05)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 300);
            });
        }
    });

    // Effetto brillantezza per i deck e graveyard
    const cardBacks = document.querySelectorAll('.card-back');
    cardBacks.forEach(cardBack => {
        cardBack.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calcolo degli angoli di rotazione
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = ((x - centerX) / centerX) * 10;
            const rotateX = ((centerY - y) / centerY) * 8;

            this.style.transform = `scale(1.1) perspective(500px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        });

        cardBack.addEventListener('mouseleave', function () {
            this.style.transform = '';
        });
    });
}

// Setup del visualizzatore dettagli carta
function setupCardDetailViewer() {
    // Crea il visualizzatore dettagli carta se non esiste
    if (!document.querySelector('.card-detail-viewer')) {
        const detailViewer = document.createElement('div');
        detailViewer.className = 'card-detail-viewer';
        detailViewer.innerHTML = `
            <div class="detail-header">Card Details</div>
            <div class="detail-content">
                <div class="detail-name">Name: <span id="card-name"></span></div>
                <div class="detail-type">Type: <span id="card-type"></span></div>
                <div class="detail-stats">
                    <div class="stat-atk">ATK: <span id="card-atk"></span></div>
                    <div class="stat-def">DEF: <span id="card-def"></span></div>
                    <div class="stat-spd">SPD: <span id="card-spd"></span></div>
                </div>
                <div class="detail-desc">Effect: <span id="card-desc"></span></div>
                <div class="available-actions">
                    <div class="available-actions-title">Available Actions</div>
                    <div class="action-list" id="action-list"></div>
                </div>
            </div>
            <div class="detail-close">Close</div>
        `;
        document.querySelector('.game-container').appendChild(detailViewer);

        // Aggiungi l'event listener per il pulsante di chiusura
        document.querySelector('.detail-close').addEventListener('click', function () {
            document.querySelector('.card-detail-viewer').style.display = 'none';
        });
    }

    // Crea anche il box informativo sulle fasi se non esiste
    if (!document.querySelector('.phase-info-box')) {
        const phaseInfoBox = document.createElement('div');
        phaseInfoBox.className = 'phase-info-box';
        document.querySelector('.game-container').appendChild(phaseInfoBox);
    }
}

// Setup dei gestori di click per le carte
function setupCardClickHandlers() {
    // Aggiungi event listeners per tutte le carte (sia nella mano che sul campo)
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.card');
        if (card) {
            showCardDetails(card);
        }
    });
}

// Mostra i dettagli di una carta
function showCardDetails(card) {
    const detailViewer = document.querySelector('.card-detail-viewer');
    if (!detailViewer) return;

    // Estrai informazioni dalla carta
    let cardName = card.innerText.split('\n')[0];
    let cardType = card.classList.contains('monster-card') ? 'Monster' : 'Spell';

    // Troviamo ATK, DEF, SPD dai contenuti della carta
    let atk = "N/A", def = "N/A", spd = "N/A", desc = "N/A", cardClass = "N/A";

    if (cardType === 'Monster') {
        const statsText = card.querySelector('.card-stats')?.innerText;
        if (statsText) {
            const atkMatch = statsText.match(/ATK:\s*(\d+)/);
            const defMatch = statsText.match(/DEF:\s*(\d+)/);
            const spdMatch = statsText.match(/SPD:\s*(\d+)/);

            if (atkMatch) atk = atkMatch[1];
            if (defMatch) def = defMatch[1];
            if (spdMatch) spd = spdMatch[1];
        }

        // Ottieni l'effetto dalla carta
        const effectEl = card.querySelector('.card-effect');
        if (effectEl) {
            desc = effectEl.innerText;
        }

        // Ottieni il tipo di mostro
        const classEl = card.querySelector('.card-class');
        if (classEl) {
            cardClass = classEl.innerText;
        } else {
            // Fallback basato sulle classi CSS
            if (card.classList.contains('defender')) {
                cardClass = "Defender";
            } else if (card.classList.contains('pumper')) {
                cardClass = "Pumper";
            } else if (card.classList.contains('all-rounder')) {
                cardClass = "All Rounder";
            } else if (card.classList.contains('champion')) {
                cardClass = "Champion";
            }
        }

        // Fallback per la descrizione
        if (!desc) {
            if (cardClass === "Defender") {
                desc = "Can attack vertically or protect (cannot protect in consecutive turns). Protects for value equal to ATK.";
            } else if (cardClass === "Pumper") {
                desc = "Can attack vertically or pump stats (+1 ATK, +1 DEF, +1 SPD) for one turn.";
            } else if (cardClass === "All Rounder") {
                desc = "Can attack vertically or diagonally, targeting any opponent monster.";
            } else if (cardClass === "Champion") {
                desc = "Main card. When its DEF is reduced to 0, you lose the game.";
            }
        }
    } else {
        const descEl = card.querySelector('.card-desc');
        if (descEl) desc = descEl.innerText;
        atk = "—";
        def = "—";
        spd = "—";
    }

    // Aggiorna i campi nel visualizzatore
    document.getElementById('card-name').textContent = cardName;
    document.getElementById('card-type').textContent = cardType;
    document.getElementById('card-atk').textContent = atk;
    document.getElementById('card-def').textContent = def;
    document.getElementById('card-spd').textContent = spd;
    document.getElementById('card-desc').textContent = desc;

    // Mostra le azioni disponibili per questo tipo di carta
    const actionsContainer = detailViewer.querySelector('.available-actions');
    if (!actionsContainer) {
        const newActionsContainer = document.createElement('div');
        newActionsContainer.className = 'available-actions';

        newActionsContainer.innerHTML = `
            <div class="available-actions-title">Available Actions</div>
            <div class="action-list" id="action-list"></div>
        `;

        detailViewer.querySelector('.detail-content').appendChild(newActionsContainer);
    }

    // Aggiorna l'elenco delle azioni disponibili
    const actionList = detailViewer.querySelector('#action-list');
    if (actionList) {
        actionList.innerHTML = '';

        if (cardType === 'Monster') {
            // Azioni di base
            const baseAction = document.createElement('div');
            baseAction.className = 'action-badge';
            baseAction.textContent = 'Attack ↑';
            actionList.appendChild(baseAction);

            // Azioni basate sul tipo di mostro
            if (cardClass === "All Rounder") {
                const diag1 = document.createElement('div');
                diag1.className = 'action-badge';
                diag1.textContent = 'Attack ↖';
                actionList.appendChild(diag1);

                const diag2 = document.createElement('div');
                diag2.className = 'action-badge';
                diag2.textContent = 'Attack ↗';
                actionList.appendChild(diag2);
            }

            if (cardClass === "Defender") {
                const defend = document.createElement('div');
                defend.className = 'action-badge';
                defend.textContent = 'Defend 🛡️';
                actionList.appendChild(defend);
            }

            if (cardClass === "Pumper") {
                const pump = document.createElement('div');
                pump.className = 'action-badge';
                pump.textContent = 'Pump +1/+1/+1';
                actionList.appendChild(pump);
            }
        }
    }

    // Mostra il visualizzatore
    detailViewer.style.display = 'block';
}

// Configurazione del log di gioco
function setupGameLog() {
    // Toggle per mostrare/nascondere il log di gioco
    const logToggle = document.querySelector('.game-log-toggle');
    const gameLog = document.querySelector('.game-log');

    if (logToggle && gameLog) {
        logToggle.addEventListener('click', function () {
            if (gameLog.style.display === 'none') {
                gameLog.style.display = 'block';
                logToggle.textContent = 'Hide Game Log';
            } else {
                gameLog.style.display = 'none';
                logToggle.textContent = 'Show Game Log';
            }
        });
    }

    // Configura il pulsante End Turn
    const endTurnButton = document.querySelector('.action-button');
    if (endTurnButton) {
        endTurnButton.addEventListener('click', function () {
            // Aggiungi un effetto di pulsazione quando viene cliccato
            this.classList.add('button-pulse');

            // Avanzamento alla fase successiva
            gameState.advancePhase();

            // Rimuovi l'effetto di pulsazione
            setTimeout(() => {
                this.classList.remove('button-pulse');
            }, 500);
        });
    }
}

// Funzione per mostrare notifiche
function showNotification(message, type = 'info') {
    const notificationContent = document.querySelector('.notification-content');

    if (notificationContent) {
        // Rimuovi tutte le classi di tipo
        notificationContent.classList.remove('success', 'warning', 'error', 'info');

        // Aggiungi la classe di tipo appropriata
        notificationContent.classList.add(type);

        // Imposta il messaggio
        notificationContent.textContent = message;

        // Aggiungi animazione di fade-in
        notificationContent.style.animation = 'none';
        notificationContent.offsetHeight; // Trigger reflow
        notificationContent.style.animation = 'notification-fadeIn 0.5s ease-out';

        // Logga anche nel log di gioco
        logGameEvent(message);
    }
}

// Funzione per aggiungere un evento al log di gioco
function logGameEvent(message) {
    console.log(message);

    const gameLog = document.querySelector('.game-log');
    if (gameLog) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;

        // Aggiungi l'entry all'inizio del log
        gameLog.insertBefore(logEntry, gameLog.firstChild);
    }
}

// Funzione di inizializzazione del flusso di gioco
function initializeGameFlow() {
    gameState.initialize();
}

// Funzione per configurare il sistema di drag-and-drop
function setupDragAndDrop() {
    const draggableCards = document.querySelectorAll('.hand .card[draggable="true"]');
    const dropTargets = document.querySelectorAll('.monster-slot, .spell-slot');

    // Per ogni carta draggabile nella mano
    draggableCards.forEach(card => {
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
    });

    // Per ogni potenziale slot di destinazione
    dropTargets.forEach(slot => {
        slot.addEventListener('dragover', dragOver);
        slot.addEventListener('dragenter', dragEnter);
        slot.addEventListener('dragleave', dragLeave);
        slot.addEventListener('drop', drop);
    });

    // Funzioni per gestire il drag-and-drop
    function dragStart(e) {
        // Verifica se è possibile trascinare la carta in base alla fase di gioco
        if (gameState.currentPhase !== PHASES.STRATEGY) {
            e.preventDefault();
            showNotification("Cards can only be placed during the Strategy Phase.", "warning");
            return false;
        }

        this.classList.add('dragging');
        e.dataTransfer.setData('text/plain', this.dataset.cardType);

        // Crea un'immagine trasparente per il drag
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        // Salva l'elemento trascinato per accedervi globalmente
        window.draggedElement = this;
    }

    function dragEnd() {
        this.classList.remove('dragging');
        // Ripulisci lo stile che potrebbe essere stato applicato
        this.style.opacity = '';

        // Rimuovi la variabile globale
        window.draggedElement = null;
    }

    function dragOver(e) {
        e.preventDefault(); // Necessario per permettere il drop
    }

    function dragEnter(e) {
        e.preventDefault();

        // Controlliamo se il tipo di carta corrisponde al tipo di slot
        const cardType = window.draggedElement.dataset.cardType;
        const slotType = this.dataset.slotType;

        // Aggiungi la classe appropriata in base alla compatibilità
        if (cardType === slotType) {
            this.classList.add('drag-over');
        } else {
            this.classList.add('slot-error');
        }
    }

    function dragLeave() {
        // Rimuovi tutte le classi di feedback visivo
        this.classList.remove('drag-over');
        this.classList.remove('slot-error');
    }

    function drop(e) {
        e.preventDefault();

        // Verifica se è possibile posizionare la carta in base alla fase di gioco
        if (gameState.currentPhase !== PHASES.STRATEGY) {
            showNotification("Cards can only be placed during the Strategy Phase.", "warning");
            return false;
        }

        // Rimuovi le classi di feedback visivo
        this.classList.remove('drag-over');
        this.classList.remove('slot-error');

        const cardType = window.draggedElement.dataset.cardType;
        const slotType = this.dataset.slotType;
        const cardId = window.draggedElement.dataset.cardId;
        const position = this.dataset.position;

        // Verifica se il tipo di carta è compatibile con lo slot
        if (cardType === slotType) {
            // Crea una copia della carta e inseriscila nello slot
            const cardClone = window.draggedElement.cloneNode(true);

            // Rimuovi l'attributo draggable dalla carta sul campo
            cardClone.removeAttribute('draggable');

            // Svuota lo slot e poi aggiungi la carta
            this.textContent = '';
            this.classList.remove('empty');
            this.appendChild(cardClone);

            // Quando un mostro viene posizionato, registralo nel game state
            if (cardType === 'monster') {
                const playerIndex = gameState.activePlayer;
                const originalCardIndex = cardId.split('-')[1];
                const card = gameState.players[playerIndex].hand[originalCardIndex];

                // Salva la carta nel gameState
                gameState.players[playerIndex].board[parseInt(position)] = card;

                // Rimuovi la carta dalla mano nel gameState
                gameState.players[playerIndex].hand.splice(originalCardIndex, 1);

                // Aggiungi event listener per selezionare l'azione
                cardClone.addEventListener('click', function () {
                    // Se siamo nella fase strategica
                    if (gameState.currentPhase === PHASES.STRATEGY) {
                        gameState.showActionMenu(playerIndex, parseInt(position), this);
                    }
                });
            }

            // Quando una magia viene posizionata, registrala nel game state
            if (cardType === 'spell') {
                const playerIndex = gameState.activePlayer;
                const deckIndex = cardId.split('-')[1];
                let card;

                // Per carte già pescate dal deck
                if (deckIndex.startsWith('drawn')) {
                    // Trova la carta nella mano
                    const drawnTurn = parseInt(deckIndex.replace('drawn-card-', ''));
                    const drawnCardIndex = gameState.players[playerIndex].hand.findIndex(c => c.name === cardClone.textContent.trim());
                    if (drawnCardIndex >= 0) {
                        card = gameState.players[playerIndex].hand[drawnCardIndex];
                        gameState.players[playerIndex].hand.splice(drawnCardIndex, 1);
                    }
                } else {
                    // Per carte iniziali
                    card = gameState.players[playerIndex].hand[deckIndex];
                    gameState.players[playerIndex].hand.splice(deckIndex, 1);
                }

                // Salva la carta nel gameState
                if (card) {
                    gameState.players[playerIndex].spells[parseInt(position)] = card;
                }
            }

            // Rimuovi la carta originale dalla mano
            window.draggedElement.remove();

            // Notifica il server del posizionamento della carta
            if (socket) {
                socket.emit('card_placed', {
                    card_id: cardId,
                    card_type: cardType,
                    position: position,
                    player: gameState.activePlayer
                });
            }

            // Segnala che la carta è stata posizionata con successo
            showNotification(`Card placed in ${slotType} slot`, 'success');

            // Verifica se la partita può continuare
            checkGameState();
        } else {
            // Segnala che il posizionamento è fallito
            if (cardType !== slotType) {
                showNotification(`Cannot place ${cardType} in ${slotType} slot`, 'error');
            } else {
                showNotification('Slot already occupied', 'error');
            }

            // Aggiungi feedback visivo temporaneo
            this.classList.add('slot-error');
            setTimeout(() => {
                this.classList.remove('slot-error');
            }, 500);
        }
    }

    // Verifica stato del gioco
    function checkGameState() {
        // In una implementazione reale, qui verrebbe verificato lo stato del gioco
        logGameEvent('Checking game state...');

        // Esempio: contiamo quante carte sono state giocate
        const cardsInHand = document.querySelectorAll('.hand .card').length;
        const cardsOnBoard = document.querySelectorAll('.monster-slot .card, .spell-slot .card').length;

        logGameEvent(`Cards in hand: ${cardsInHand}, Cards on board: ${cardsOnBoard}`);
    }
} 