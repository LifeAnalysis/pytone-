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
        /* Commented out spells for now, as requested
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
        */
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
            selectedActions: [null, null, null], // Azioni selezionate per ogni mostro
            defendersOnCooldown: [false, false, false], // Defender in cooldown che non possono difendere questo turno
            monstersHaveFought: [false, false, false] // Mostri che hanno già combattuto e non possono essere sostituiti
        },
        { // Player 2
            deck: [],
            hand: [],
            graveyard: [],
            lanes: [5, null, 5],
            champion: null,
            board: [null, null, null], // Carte mostri sul campo
            spells: [null, null, null], // Carte magia sul campo
            selectedActions: [null, null, null], // Azioni selezionate per ogni mostro
            defendersOnCooldown: [false, false, false], // Defender in cooldown che non possono difendere questo turno
            monstersHaveFought: [false, false, false] // Mostri che hanno già combattuto e non possono essere sostituiti
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
    updatePlayer1CardsUI: function (isCardReturned = false) {
        const p1Hand = document.querySelector('.player-area.user .hand');
        if (p1Hand) {
            // Svuota la mano attuale
            p1Hand.innerHTML = '';

            // Aggiungi le carte dei mostri
            this.players[PLAYERS.PLAYER1].hand.forEach((monster, index) => {
                const monsterCard = document.createElement('div');
                monsterCard.className = 'card monster-card';

                // Aggiungi classe per animazione se è una carta ritornata in mano
                if (isCardReturned && index === this.players[PLAYERS.PLAYER1].hand.length - 1) {
                    monsterCard.classList.add('new-card');
                }

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
        this.timeRemaining = 45; // Increased from 30 to 45 seconds
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

    // Traccia stato dei difensori per impedire la difesa in turni consecutivi
    resetDefenderStates: function () {
        // Per ogni giocatore
        for (let player = 0; player < 2; player++) {
            // Se non esiste l'array per tracciare i difensori, crealo
            if (!this.players[player].defendersDefendedLastTurn) {
                this.players[player].defendersDefendedLastTurn = [false, false, false];
            }

            // Resetta gli stati di difesa solo se necessario
            const currentActions = this.players[player].selectedActions;

            for (let i = 0; i < 3; i++) {
                // Se il mostro NON ha difeso in questo turno, rimuovi il blocco del turno precedente
                if (currentActions[i] !== ACTION_TYPES.DEFEND) {
                    this.players[player].defendersDefendedLastTurn[i] = false;
                }

                // Se ha difeso, il flag è già stato impostato in executeDefend
            }
        }

        // Debug log dello stato dei difensori dopo il reset
        logGameEvent(`Defender states after reset - Player 1: [${this.players[0].defendersDefendedLastTurn}], Player 2: [${this.players[1].defendersDefendedLastTurn}]`);
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

        // Posiziona mostri nelle posizioni vuote, ma non nella champion lane
        for (let position = 0; position < 3; position++) {
            // Salta la posizione centrale (champion lane)
            if (position === 1) continue;

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
            // Se c'è già un mostro ma non ha combattuto, possiamo sostituirlo
            else if (this.players[PLAYERS.PLAYER2].board[position] && !this.players[PLAYERS.PLAYER2].monstersHaveFought[position]) {
                // Cerca un mostro nella mano
                const monsterIndex = computerHand.findIndex(card => card.class); // Solo le carte mostro hanno class

                if (monsterIndex >= 0) {
                    // Salva il mostro esistente
                    const existingMonster = this.players[PLAYERS.PLAYER2].board[position];

                    // Rimetti il mostro esistente nella mano
                    if (existingMonster) {
                        // Aggiungi animazione visiva per il ritorno in mano
                        const slot = document.querySelector(`.player-area.opponent .monster-slot[data-position="${position}"]`);
                        if (slot && slot.querySelector('.card')) {
                            const cardElement = slot.querySelector('.card');
                            const cardRect = cardElement.getBoundingClientRect();

                            // Crea un clone per l'animazione
                            const cardClone = cardElement.cloneNode(true);
                            cardClone.style.position = 'fixed';
                            cardClone.style.top = `${cardRect.top}px`;
                            cardClone.style.left = `${cardRect.left}px`;
                            cardClone.style.width = `${cardRect.width}px`;
                            cardClone.style.height = `${cardRect.height}px`;
                            cardClone.classList.add('returning-to-hand');
                            document.body.appendChild(cardClone);

                            // Determina la destinazione dell'animazione (mano dell'avversario)
                            const oppHand = document.querySelector('.player-area.opponent .hand');
                            const handRect = oppHand.getBoundingClientRect();
                            cardClone.style.transition = 'all 0.8s ease-out';

                            // Anima verso la mano
                            setTimeout(() => {
                                cardClone.style.top = `${handRect.top}px`;
                                cardClone.style.left = `${handRect.left + 50}px`;
                                cardClone.style.transform = 'scale(0.5) rotate(10deg)';
                                cardClone.style.opacity = '0.7';
                            }, 10);

                            // Rimuovi il clone dopo l'animazione
                            setTimeout(() => {
                                cardClone.remove();
                            }, 800);
                        }

                        computerHand.push(existingMonster);
                        logGameEvent(`Computer returns ${existingMonster.name} from position ${position} to hand`);
                    }

                    // Posiziona il nuovo mostro
                    const monster = computerHand.splice(monsterIndex, 1)[0];
                    this.players[PLAYERS.PLAYER2].board[position] = monster;

                    // Aggiorna l'UI
                    this.updateComputerBoardUI(position, monster);

                    logGameEvent(`Computer replaces monster with ${monster.name} in position ${position}`);
                    showNotification(`Computer replaces a monster`, 'info');
                }
            }
        }

        // Posiziona magie nelle posizioni vuote, ma non nella champion lane
        for (let position = 0; position < 3; position++) {
            // Salta la posizione centrale (champion lane)
            if (position === 1) continue;

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
            // Se c'è già una magia, possiamo sostituirla
            else if (this.players[PLAYERS.PLAYER2].spells[position]) {
                // Cerca una magia nella mano
                const spellIndex = computerHand.findIndex(card => !card.class); // Le carte magia non hanno class

                if (spellIndex >= 0) {
                    // Salva la magia esistente
                    const existingSpell = this.players[PLAYERS.PLAYER2].spells[position];

                    // Rimetti la magia esistente nella mano
                    if (existingSpell) {
                        // Aggiungi animazione visiva per il ritorno in mano
                        const slot = document.querySelector(`.player-area.opponent .spell-slot[data-position="${position}"]`);
                        if (slot && slot.querySelector('.card')) {
                            const cardElement = slot.querySelector('.card');
                            const cardRect = cardElement.getBoundingClientRect();

                            // Crea un clone per l'animazione
                            const cardClone = cardElement.cloneNode(true);
                            cardClone.style.position = 'fixed';
                            cardClone.style.top = `${cardRect.top}px`;
                            cardClone.style.left = `${cardRect.left}px`;
                            cardClone.style.width = `${cardRect.width}px`;
                            cardClone.style.height = `${cardRect.height}px`;
                            cardClone.classList.add('returning-to-hand');
                            document.body.appendChild(cardClone);

                            // Determina la destinazione dell'animazione (mano dell'avversario)
                            const oppHand = document.querySelector('.player-area.opponent .hand');
                            const handRect = oppHand.getBoundingClientRect();
                            cardClone.style.transition = 'all 0.8s ease-out';

                            // Anima verso la mano
                            setTimeout(() => {
                                cardClone.style.top = `${handRect.top}px`;
                                cardClone.style.left = `${handRect.left + 50}px`;
                                cardClone.style.transform = 'scale(0.5) rotate(10deg)';
                                cardClone.style.opacity = '0.7';
                            }, 10);

                            // Rimuovi il clone dopo l'animazione
                            setTimeout(() => {
                                cardClone.remove();
                            }, 800);
                        }

                        computerHand.push(existingSpell);
                        logGameEvent(`Computer returns spell from position ${position} to hand`);
                    }

                    // Posiziona la nuova magia
                    const spell = computerHand.splice(spellIndex, 1)[0];
                    this.players[PLAYERS.PLAYER2].spells[position] = spell;

                    // Aggiorna l'UI
                    this.updateComputerSpellUI(position);

                    logGameEvent(`Computer replaces spell in position ${position}`);
                    showNotification(`Computer replaces a spell`, 'info');
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

        // Log dello stato dei difensori all'inizio della battaglia
        this.logDefendersCooldownState("Start of Battle");

        // Esegui le azioni di battaglia nell'ordine corretto
        setTimeout(() => {
            this.executeBattleActions();
        }, 1000);
    },

    // Esegui le azioni di battaglia nell'ordine corretto
    executeBattleActions: function () {
        // 1. Attivazione spell in ordine di priorità
        this.activateSpells();

        // 2. Raccogliamo tutte le azioni (pump, defend, attack)
        const allActions = this.collectAllActions();

        // 3. Ordina tutte le azioni per velocità (SPD)
        this.sortActionsBySpeed(allActions);

        // 4. Esegui tutte le azioni nell'ordine stabilito
        this.executeActions(allActions);

        // 5. Passa alla end phase dopo aver completato tutte le azioni
        setTimeout(() => {
            this.enterEndPhase();
        }, 3000);
    },

    // Raccoglie tutte le azioni (pump, defend, attack)
    collectAllActions: function () {
        const allActions = [];

        // Raccoglie le azioni di entrambi i giocatori
        for (let player = 0; player < 2; player++) {
            for (let position = 0; position < 3; position++) {
                if (this.players[player].board[position] && this.players[player].selectedActions[position]) {
                    const action = this.players[player].selectedActions[position];

                    allActions.push({
                        player: player,
                        position: position,
                        card: this.players[player].board[position],
                        action: action,
                        type: this.getActionType(action)
                    });
                }
            }
        }

        return allActions;
    },

    // Determina il tipo di azione (pump, defend, attack)
    getActionType: function (action) {
        if (action === ACTION_TYPES.PUMP) {
            return 'pump';
        } else if (action === ACTION_TYPES.DEFEND) {
            return 'defend';
        } else if (this.isAttackAction(action)) {
            return 'attack';
        } else {
            return 'special';
        }
    },

    // Ordina tutte le azioni in base alla velocità (SPD)
    sortActionsBySpeed: function (actions) {
        actions.sort((a, b) => {
            // Ordina prima per tipo (pump e defend prima degli attacchi)
            if (a.type !== b.type) {
                if (a.type === 'pump') return -1;
                if (b.type === 'pump') return 1;
                if (a.type === 'defend') return -1;
                if (b.type === 'defend') return 1;
            }

            // Per azioni dello stesso tipo, ordina per SPD (decrescente)
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

    // Esegui tutte le azioni nell'ordine stabilito
    executeActions: function (actions) {
        if (actions.length === 0) {
            logGameEvent('No actions to execute.');
            this.showBattleResolutionSummary([]);
            return;
        }

        logGameEvent('Executing actions in order of SPD...');

        // Array per tracciare tutti i risultati per il pop-up di riepilogo
        const battleResults = [];

        // Rivela gli attributi delle carte dell'avversario
        this.revealOpponentCards();

        // Elabora prima tutte le azioni non di attacco (pump, defend) in ordine di velocità
        const attackActions = [];
        const pumpResults = [];
        const defendResults = [];

        actions.forEach(action => {
            if (action.type === 'pump') {
                // Esegui l'azione pump
                const result = this.executePump(action);
                pumpResults.push(result);
                battleResults.push(result);
            } else if (action.type === 'defend') {
                // Registra l'azione defend
                const result = this.executeDefend(action);
                defendResults.push(result);
                battleResults.push(result);
            } else if (action.type === 'attack') {
                // Raccogli le azioni di attacco per elaborarle dopo
                attackActions.push(action);
            }
        });

        // Ora esegui gli attacchi in ordine di velocità
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

    // Esegui un'azione di pump
    executePump: function (action) {
        const { player, position, card } = action;

        // Valori originali
        const originalAtk = card.attack;
        const originalDef = card.defense;
        const originalSpd = card.speed;

        // Applica i bonus di base
        let atkBonus = 1;
        let defBonus = 1;
        let spdBonus = 1;

        // Se è un pumper, potrebbe avere bonus speciali
        if (card.class === "Pumper") {
            // Controlla l'effetto specifico (ma il default è +1/+1/+1)
            if (card.effect.includes("Attack")) {
                atkBonus = 2; // +2 ATK invece di +1
            } else if (card.effect.includes("Defense")) {
                defBonus = 2; // +2 DEF invece di +1
            } else if (card.effect.includes("Speed")) {
                spdBonus = 2; // +2 SPD invece di +1
            }
        }

        // Applica i bonus
        card.attack += atkBonus;
        card.defense += defBonus;
        card.speed += spdBonus;

        // Aggiorna visivamente la carta
        this.updateCardStats(player, position, card);

        // Log dell'azione
        logGameEvent(`Player ${player + 1}'s ${card.name} pumps: ATK +${atkBonus}, DEF +${defBonus}, SPD +${spdBonus}`);

        // Restituisci il risultato per il riepilogo battaglia
        return {
            type: 'pump',
            player: player,
            card: card,
            position: position,
            originalStats: {
                atk: originalAtk,
                def: originalDef,
                spd: originalSpd
            },
            newStats: {
                atk: card.attack,
                def: card.defense,
                spd: card.speed
            },
            bonuses: {
                atk: atkBonus,
                def: defBonus,
                spd: spdBonus
            }
        };
    },

    // Esegui un'azione di difesa
    executeDefend: function (action) {
        const { player, position, card } = action;

        // Log dell'azione
        logGameEvent(`Player ${player + 1}'s ${card.name} (Defender) takes defensive stance and will be on cooldown next turn.`);

        // Restituisci il risultato per il riepilogo battaglia
        return {
            type: 'defend',
            player: player,
            card: card,
            position: position
        };
    },

    // Attiva tutte le carte magia giocate
    activateSpells: function () {
        logGameEvent('Activating spell cards...');

        // Attiva le spell per entrambi i giocatori
        for (let player = 0; player < 2; player++) {
            for (let position = 0; position < 3; position++) {
                const spell = this.players[player].spells[position];
                if (spell) {
                    // Applica l'effetto della spell solo nella sua lane
                    this.applySpellEffect(player, position, spell);
                }
            }
        }
    },

    // Applica l'effetto di una spell nella sua lane
    applySpellEffect: function (player, position, spell) {
        const opponentPlayer = player === PLAYERS.PLAYER1 ? PLAYERS.PLAYER2 : PLAYERS.PLAYER1;

        logGameEvent(`Player ${player + 1}'s spell "${spell.name}" activates in lane ${position + 1}.`);
        showNotification(`Spell activated: ${spell.name}`, 'info');

        // Implementa gli effetti delle spell in base al nome
        switch (spell.name) {
            case "Power Surge":
                // Dà +3 attacco a un mostro amico nella stessa lane per un turno
                if (this.players[player].board[position]) {
                    this.players[player].board[position].attack += 3;
                    logGameEvent(`${spell.name} gives +3 ATK to ${this.players[player].board[position].name}.`);
                    // Aggiorna l'UI della carta potenziata
                    this.updateCardStats(player, position, this.players[player].board[position]);
                }
                break;

            case "Healing Wave":
                // Cura +2 Difesa a tutte le carte mostro amiche
                for (let i = 0; i < 3; i++) {
                    if (this.players[player].board[i]) {
                        this.players[player].board[i].defense += 2;
                        logGameEvent(`${spell.name} heals ${this.players[player].board[i].name} for 2 DEF.`);
                        // Aggiorna l'UI della carta curata
                        this.updateCardStats(player, i, this.players[player].board[i]);
                    }
                }
                break;

            case "Blinding Flash":
                // Riduce l'attacco di tutti i mostri nemici di 2 per un turno
                for (let i = 0; i < 3; i++) {
                    if (this.players[opponentPlayer].board[i]) {
                        this.players[opponentPlayer].board[i].attack = Math.max(0, this.players[opponentPlayer].board[i].attack - 2);
                        logGameEvent(`${spell.name} reduces ${this.players[opponentPlayer].board[i].name}'s ATK by 2.`);
                        // Aggiorna l'UI della carta indebolita
                        this.updateCardStats(opponentPlayer, i, this.players[opponentPlayer].board[i]);
                    }
                }
                break;

            case "Defensive Barrier":
                // Dà +3 difesa a un mostro amico nella stessa lane per un turno
                if (this.players[player].board[position]) {
                    this.players[player].board[position].defense += 3;
                    logGameEvent(`${spell.name} gives +3 DEF to ${this.players[player].board[position].name}.`);
                    // Aggiorna l'UI della carta potenziata
                    this.updateCardStats(player, position, this.players[player].board[position]);
                }
                break;

            case "Speed Boost":
                // Dà +3 velocità a un mostro amico nella stessa lane per un turno
                if (this.players[player].board[position]) {
                    this.players[player].board[position].speed += 3;
                    logGameEvent(`${spell.name} gives +3 SPD to ${this.players[player].board[position].name}.`);
                    // Aggiorna l'UI della carta potenziata
                    this.updateCardStats(player, position, this.players[player].board[position]);
                }
                break;

            case "Mana Drain":
                // Impedisce all'avversario di usare una carta magia nel prossimo turno
                this.players[opponentPlayer].cannotUseSpells = true;
                logGameEvent(`${spell.name} prevents opponent from using spells next turn.`);
                break;

            case "Summoner's Call":
                // Pesca due carte magia dal mazzo
                for (let i = 0; i < 2; i++) {
                    if (this.players[player].deck.length > 0) {
                        const drawnCard = this.players[player].deck.pop();
                        this.players[player].hand.push(drawnCard);
                        logGameEvent(`${spell.name} draws ${drawnCard.name} from deck.`);
                        // Aggiorna l'UI della mano
                        this.updatePlayerHandUI(player);
                    }
                }
                break;

            case "Unholy Frenzy":
                // Dà +2 attacco e -1 difesa a un mostro amico per un turno
                if (this.players[player].board[position]) {
                    this.players[player].board[position].attack += 2;
                    this.players[player].board[position].defense = Math.max(1, this.players[player].board[position].defense - 1);
                    logGameEvent(`${spell.name} gives +2 ATK and -1 DEF to ${this.players[player].board[position].name}.`);
                    // Aggiorna l'UI della carta
                    this.updateCardStats(player, position, this.players[player].board[position]);
                }
                break;

            case "Teleport":
                // Scambia la posizione di due mostri amici
                // Implementazione semplificata: scambia con un mostro adiacente se possibile
                const adjacentPosition = position === 0 ? 2 : 0;
                if (this.players[player].board[position] && this.players[player].board[adjacentPosition]) {
                    const temp = this.players[player].board[position];
                    this.players[player].board[position] = this.players[player].board[adjacentPosition];
                    this.players[player].board[adjacentPosition] = temp;
                    logGameEvent(`${spell.name} swaps positions of ${this.players[player].board[position].name} and ${this.players[player].board[adjacentPosition].name}.`);
                    // Aggiorna l'UI
                    this.updateBoardUI(player);
                }
                break;

            case "Quicksand":
                // Riduce la velocità di tutti i mostri nemici di 2 per un turno
                for (let i = 0; i < 3; i++) {
                    if (this.players[opponentPlayer].board[i]) {
                        this.players[opponentPlayer].board[i].speed = Math.max(1, this.players[opponentPlayer].board[i].speed - 2);
                        logGameEvent(`${spell.name} reduces ${this.players[opponentPlayer].board[i].name}'s SPD by 2.`);
                        // Aggiorna l'UI della carta
                        this.updateCardStats(opponentPlayer, i, this.players[opponentPlayer].board[i]);
                    }
                }
                break;

            case "Petrify":
                // Disabilita un mostro nemico per un turno
                if (this.players[opponentPlayer].board[position]) {
                    this.players[opponentPlayer].board[position].isPetrified = true;
                    // Disabilita le azioni per questa carta
                    this.players[opponentPlayer].selectedActions[position] = null;
                    logGameEvent(`${spell.name} petrifies ${this.players[opponentPlayer].board[position].name}, disabling it for one turn.`);
                    // Aggiorna visivamente la carta
                    const monsterSlot = document.querySelector(`.player-area.${opponentPlayer === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${position}"]`);
                    if (monsterSlot) {
                        monsterSlot.classList.add('petrified');
                    }
                }
                break;

            case "Sacrificial Ritual":
                // Distrugge un mostro amico per infliggere il suo ATK come danno diretto all'avversario
                if (this.players[player].board[position]) {
                    const sacrificedMonster = this.players[player].board[position];
                    const damage = sacrificedMonster.attack;

                    // Applica il danno direttamente alla lane dell'avversario
                    this.applyDamageToLane(opponentPlayer, position, damage);

                    // Distruggi il mostro sacrificato
                    logGameEvent(`${spell.name} sacrifices ${sacrificedMonster.name} to deal ${damage} damage to opponent's lane.`);
                    this.destroyCard(player, position);
                }
                break;

            case "Elemental Shift":
                // Scambia i valori di ATK e DEF di un mostro amico per un turno
                if (this.players[player].board[position]) {
                    const monster = this.players[player].board[position];
                    const tempAtk = monster.attack;
                    monster.attack = monster.defense;
                    monster.defense = tempAtk;
                    logGameEvent(`${spell.name} swaps ${monster.name}'s ATK (now ${monster.attack}) and DEF (now ${monster.defense}).`);
                    // Aggiorna l'UI della carta
                    this.updateCardStats(player, position, monster);
                }
                break;

            default:
                logGameEvent(`Effect for spell ${spell.name} not implemented yet.`);
        }

        // Rimuovi la spell dopo l'attivazione (use-once)
        this.players[player].spells[position] = null;

        // Aggiorna l'UI dello slot spell
        const spellSlot = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .spell-slot[data-position="${position}"]`);
        if (spellSlot) {
            spellSlot.innerHTML = "Spell";
            spellSlot.classList.add('empty');
        }
    },

    // Helper method to update board UI after teleport or similar effects
    updateBoardUI: function (player) {
        for (let position = 0; position < 3; position++) {
            const card = this.players[player].board[position];
            if (!card) continue;

            // Aggiorna l'UI
            if (player === PLAYERS.PLAYER1) {
                const slot = document.querySelector(`.player-area.user .monster-slot[data-position="${position}"]`);
                if (slot) {
                    slot.innerHTML = '';
                    slot.classList.remove('empty');

                    const cardElement = document.createElement('div');
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

                    slot.appendChild(cardElement);

                    // Aggiungi event listener per selezionare l'azione
                    cardElement.addEventListener('click', () => {
                        if (this.currentPhase === PHASES.STRATEGY) {
                            this.showActionMenu(player, position, cardElement);
                        }
                    });
                }
            } else {
                this.updateComputerBoardUI(position, card);
            }
        }
    },

    // Helper method to update player hand UI
    updatePlayerHandUI: function (player) {
        if (player === PLAYERS.PLAYER1) {
            this.updatePlayer1CardsUI();
        } else {
            this.updatePlayer2CardsUI();
        }
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

    // Calcola il danno in base alle statistiche delle carte
    calculateDamage: function (attackingCard, defendingCard, defenderAction) {
        // Verifica se il difensore sta usando protezione
        const isDefending = defenderAction === ACTION_TYPES.DEFEND;

        // Se il difensore sta proteggendo, non prende danni
        if (isDefending) {
            logGameEvent(`${defendingCard.name} is defending and will not take damage.`);
            return 0;
        }

        // Calcoliamo il valore effettivo di attacco
        let effectiveAttack = attackingCard.attack;

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
            targetType: 'none',
            excessDamage: 0,
            laneDamage: 0
        };

        // Se la posizione target non è valida, annulla l'attacco
        if (targetPosition === null) {
            logGameEvent(`Player ${player + 1}'s ${card.name} cannot attack in that direction.`);
            return attackResult;
        }

        // Ottieni il bersaglio (mostro o champion)
        const target = this.players[opponentPlayer].board[targetPosition];

        // Verifica se l'attacco alla champion lane è valido
        if (targetPosition === 1 && !target) {
            // Verifica se almeno una delle side lane dell'avversario è a zero
            const canAttackChampion = this.players[opponentPlayer].lanes[0] <= 0 ||
                this.players[opponentPlayer].lanes[2] <= 0;

            // Verifica se il mostro attaccante è adiacente a una side lane distrutta
            const isAdjacentToDestroyedLane =
                (position === 0 && this.players[opponentPlayer].lanes[0] <= 0) ||
                (position === 1) || // La posizione centrale può sempre attaccare il campione se permesso
                (position === 2 && this.players[opponentPlayer].lanes[2] <= 0);

            if (!canAttackChampion || !isAdjacentToDestroyedLane) {
                logGameEvent(`Player ${player + 1}'s ${card.name} cannot attack the champion lane yet. A side lane must be destroyed first.`);
                return attackResult;
            }
        }

        // Se c'è un bersaglio, aggiorna il risultato dell'attacco
        if (target) {
            attackResult.target.card = target;
            attackResult.target.initialHealth = target.defense;
            attackResult.targetType = 'monster';

            // Verifica se il difensore sta usando protezione
            const isDefending = this.players[opponentPlayer].selectedActions[targetPosition] === ACTION_TYPES.DEFEND;

            if (isDefending) {
                logGameEvent(`Player ${opponentPlayer + 1}'s ${target.name} is defending and reduces incoming damage.`);
            }
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
            attackResult.laneDamage = damage;
            attackResult.target.finalHealth = this.players[opponentPlayer].lanes[targetPosition];
            return attackResult;
        }

        // Calcola il danno in base alle regole
        const damage = this.calculateDamage(card, target, this.players[opponentPlayer].selectedActions[targetPosition]);

        // Aggiorna il risultato dell'attacco con il danno
        attackResult.damage = damage;

        // Se il danno è maggiore della difesa del mostro, calcola l'eccesso di danno
        let excessDamage = 0;

        if (damage >= target.defense) {
            // Calcola l'eccesso di danno che andrà applicato alla lane
            excessDamage = damage - target.defense;
            attackResult.excessDamage = excessDamage;

            // Distruggi la carta e applica l'eccesso di danno alla lane
            logGameEvent(`Player ${player + 1}'s ${card.name} destroys ${target.name} and deals ${excessDamage} excess damage to lane.`);

            // Applica prima tutto il danno alla carta
            this.applyDamageToCard(opponentPlayer, targetPosition, target.defense);

            // Poi applica il danno in eccesso alla lane
            if (excessDamage > 0) {
                // Salva la salute della lane prima di applicare il danno
                const initialLaneHealth = this.players[opponentPlayer].lanes[targetPosition];

                // Applica il danno in eccesso alla lane
                this.applyDamageToLane(opponentPlayer, targetPosition, excessDamage);

                // Aggiorna il risultato con le informazioni sulla lane
                attackResult.laneDamage = excessDamage;
                attackResult.target.initialLaneHealth = initialLaneHealth;
                attackResult.target.finalLaneHealth = this.players[opponentPlayer].lanes[targetPosition];
            }

            // Marca il bersaglio come distrutto
            attackResult.target.destroyed = true;
            attackResult.target.finalHealth = 0;
        } else {
            // Applica il danno senza eccesso
            this.applyDamageToCard(opponentPlayer, targetPosition, damage);
            attackResult.target.finalHealth = target.defense;
            attackResult.target.destroyed = false;
        }

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
            content.innerHTML = `<p>No actions were executed this turn.</p>`;
        } else {
            // Aggiungi una breve spiegazione delle regole di battaglia
            let html = `<div class="battle-timeline">`;

            // Mostra lo stato dei difensori all'inizio del riepilogo
            const defender1States = this.players[0].defendersOnCooldown || [false, false, false];
            const defender2States = this.players[1].defendersOnCooldown || [false, false, false];

            html += `
            <div class="section-header">Defender Status (Battle Start)</div>
            <div class="battle-event defender-status">
                <div class="battle-step">🛡️</div>
                <div class="battle-description">
                    <p class="defender-status-title"><strong>Current Defender Status:</strong></p>
                    <div class="defender-status-section">
                        <span class="player-1">Player 1 Defenders:</span>
                        <ul class="defender-list">`;

            // Player 1 defenders with names and positions
            for (let pos = 0; pos < 3; pos++) {
                const monster = this.players[0].board[pos];
                if (monster && monster.class === "Defender") {
                    const positionName = pos === 0 ? "Left" : pos === 1 ? "Center" : "Right";
                    const cooldownStatus = defender1States[pos] ?
                        '<span class="cooldown">ON COOLDOWN</span>' :
                        '<span class="ready">READY</span>';

                    html += `<li><strong>${monster.name}</strong> (${positionName}): ${cooldownStatus}${defender1States[pos] ? ' - Cannot defend this turn' : ' - Can defend this turn'}</li>`;
                }
            }

            // If no defenders found for Player 1
            if (!this.players[0].board.some(card => card && card.class === "Defender")) {
                html += `<li><em>No Defender monsters on the field</em></li>`;
            }

            html += `</ul>
                    </div>
                    <div class="defender-status-section">
                        <span class="player-2">Player 2 Defenders:</span>
                        <ul class="defender-list">`;

            // Player 2 defenders with names and positions
            for (let pos = 0; pos < 3; pos++) {
                const monster = this.players[1].board[pos];
                if (monster && monster.class === "Defender") {
                    const positionName = pos === 0 ? "Left" : pos === 1 ? "Center" : "Right";
                    const cooldownStatus = defender2States[pos] ?
                        '<span class="cooldown">ON COOLDOWN</span>' :
                        '<span class="ready">READY</span>';

                    html += `<li><strong>${monster.name}</strong> (${positionName}): ${cooldownStatus}${defender2States[pos] ? ' - Cannot defend this turn' : ' - Can defend this turn'}</li>`;
                }
            }

            // If no defenders found for Player 2
            if (!this.players[1].board.some(card => card && card.class === "Defender")) {
                html += `<li><em>No Defender monsters on the field</em></li>`;
            }

            html += `</ul>
                    </div>
                    <div class="defender-rule">
                        <p><strong>Defender Rule:</strong> After using defend action, a Defender cannot defend in the next turn.</p>
                    </div>
                </div>
            </div>
            `;

            // Filtra i risultati per tipo per organizzarli in sezioni
            const pumpActions = battleResults.filter(result => result.type === 'pump');
            const defendActions = battleResults.filter(result => result.type === 'defend');
            const attackActions = battleResults.filter(result => (result.targetType === 'monster' || result.targetType === 'lane'));

            // Sezione 1: Pump Actions (se presenti)
            if (pumpActions.length > 0) {
                html += `<div class="section-header">Step 1: Pump Actions (Stat Boosts)</div>`;

                pumpActions.forEach((result, index) => {
                    const playerName = result.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
                    const cardName = result.card.name;
                    const cardClass = result.card.class || "Unknown";
                    const cardSpeed = result.originalStats.spd;

                    html += `
                    <div class="battle-event">
                        <div class="battle-step">
                            <div class="speed-indicator">SPD: ${cardSpeed}</div>
                            ${index + 1}
                        </div>
                        <div class="battle-description">
                            <p><span class="player-${result.player + 1}">${playerName}'s ${cardName}</span> (${cardClass}) pumps its stats:</p>
                            <ul class="stats-change">
                                <li>ATK: ${result.originalStats.atk} → <span class="buff">${result.newStats.atk}</span> (+${result.bonuses.atk})</li>
                                <li>DEF: ${result.originalStats.def} → <span class="buff">${result.newStats.def}</span> (+${result.bonuses.def})</li>
                                <li>SPD: ${result.originalStats.spd} → <span class="buff">${result.newStats.spd}</span> (+${result.bonuses.spd})</li>
                            </ul>
                            <p class="action-explanation"><em>Pumper monsters can increase all stats, but cannot attack in the same turn.</em></p>
                        </div>
                    </div>
                    `;
                });
            }

            // Sezione 2: Defend Actions (se presenti)
            if (defendActions.length > 0) {
                html += `<div class="section-header">Step 2: Defend Actions</div>`;

                defendActions.forEach((result, index) => {
                    const playerName = result.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
                    const cardName = result.card.name;
                    const cardClass = result.card.class || "Unknown";
                    const cardSpeed = result.card.speed;

                    html += `
                    <div class="battle-event">
                        <div class="battle-step">
                            <div class="speed-indicator">SPD: ${cardSpeed}</div>
                            ${index + 1}
                        </div>
                        <div class="battle-description">
                            <p><span class="player-${result.player + 1}">${playerName}'s ${cardName}</span> (${cardClass}) takes defensive stance!</p>
                            <p class="defend-note">This monster will take no damage from attacks this turn, but <span class="cooldown">cannot defend next turn</span>.</p>
                            <p class="action-explanation"><em>Defender monsters can block all incoming damage, but must skip defending next turn.</em></p>
                        </div>
                    </div>
                    `;
                });
            }

            // Sezione 3: Attack Actions (sempre presenti)
            if (attackActions.length > 0) {
                html += `<div class="section-header">Step 3: Attack Actions</div>
                         <div class="attack-explanation">Attacks are resolved in order of Speed (SPD). Faster monsters attack first.</div>`;

                attackActions.forEach((result, index) => {
                    html += `
                    <div class="battle-event">
                        <div class="battle-step">
                `;

                    // Mostra la velocità dell'attaccante se disponibile
                    if (result.attacker && result.attacker.card) {
                        html += `<div class="speed-indicator">SPD: ${result.attacker.card.speed}</div>`;
                    }

                    html += `${index + 1}</div>
                        <div class="battle-description">
                    `;

                    if (result.targetType === 'monster') {
                        const attackerName = result.attacker.card.name;
                        const attackerPlayer = result.attacker.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
                        const targetPlayer = result.target.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
                        const attackerClass = result.attacker.card.class || "Unknown";
                        const targetName = result.target.card.name;
                        const targetClass = result.target.card.class || "Unknown";
                        const initialHealth = result.target.initialHealth;
                        const finalHealth = result.target.finalHealth;
                        const damage = result.damage;

                        // Determina il tipo di attacco (normale, diagonale)
                        let attackType = "vertical attack";
                        if (result.attacker.action === ACTION_TYPES.ATTACK_DIAGONAL_LEFT) {
                            attackType = "diagonal left attack";
                        } else if (result.attacker.action === ACTION_TYPES.ATTACK_DIAGONAL_RIGHT) {
                            attackType = "diagonal right attack";
                        }

                        html += `<p><span class="player-${result.attacker.player + 1}">${attackerPlayer}'s ${attackerName}</span> (${attackerClass}) used <strong>${attackType}</strong> against <span class="player-${result.target.player + 1}">${targetPlayer}'s ${targetName}</span> (${targetClass})</p>`;

                        // Verifica se il difensore sta usando protezione
                        const isDefending = this.players[result.target.player].selectedActions[result.target.position] === ACTION_TYPES.DEFEND;
                        const isDefenderClass = targetClass === "Defender";

                        if (isDefending) {
                            const defenderText = isDefenderClass ?
                                `<p><span class="player-${result.target.player + 1}">${targetName}</span> (Defender) is actively defending and takes no damage. <span class="cooldown">Will be on cooldown next turn.</span></p>` :
                                `<p><span class="player-${result.target.player + 1}">${targetName}</span> is defending and takes no damage.</p>`;

                            html += defenderText;
                        } else {
                            // Spiega il calcolo del danno
                            const attackerAtk = result.attacker.card.attack;
                            const defenderAtk = result.target.card.attack;

                            html += `<p>Dealt <span class="damage">${damage} damage</span> (DEF: ${initialHealth} → ${finalHealth})</p>`;

                            // Spiega come è stato calcolato il danno
                            if (attackerAtk > defenderAtk) {
                                html += `<p class="damage-explanation"><em>Damage = ATK difference (${attackerAtk} - ${defenderAtk} = ${attackerAtk - defenderAtk})</em></p>`;
                            } else if (attackerAtk === defenderAtk) {
                                html += `<p class="damage-explanation"><em>Equal ATK: Target DEF reduced to 1 (if greater)</em></p>`;
                            } else {
                                html += `<p class="damage-explanation"><em>ATK less than target's ATK: Damage = Attacker's ATK (${attackerAtk})</em></p>`;
                            }
                        }

                        if (result.target.destroyed) {
                            html += `<p class="destroyed"><span class="player-${result.target.player + 1}">${targetName}</span> was destroyed and sent to graveyard!</p>`;

                            // Aggiungi informazioni sul danno in eccesso
                            if (result.excessDamage && result.excessDamage > 0) {
                                html += `<p class="excess-damage">Excess damage (${result.excessDamage}) was applied to the lane!</p>`;

                                // Se la lane è stata distrutta dal danno in eccesso
                                if (result.target.finalLaneHealth <= 0) {
                                    html += `<p class="lane-destroyed">Lane was also destroyed from excess damage!</p>`;
                                }
                            }
                        }
                    } else if (result.targetType === 'lane') {
                        const attackerName = result.attacker.card.name;
                        const attackerPlayer = result.attacker.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
                        const targetPlayer = result.target.player === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
                        const attackerClass = result.attacker.card.class || "Unknown";
                        const position = result.target.position === 1 ? "Champion Lane" : `Side Lane ${result.target.position + 1}`;
                        const damage = result.damage;

                        html += `<p><span class="player-${result.attacker.player + 1}">${attackerPlayer}'s ${attackerName}</span> (${attackerClass}) attacked <span class="player-${result.target.player + 1}">${targetPlayer}'s ${position}</span> directly</p>`;
                        html += `<p>Dealt <span class="damage">${damage} damage</span> (Lane HP: ${result.target.initialHealth} → ${result.target.finalHealth})</p>`;
                        html += `<p class="damage-explanation"><em>Direct lane damage = Attacker's ATK (${damage})</em></p>`;

                        if (result.target.finalHealth <= 0) {
                            html += `<p class="destroyed"><span class="player-${result.target.player + 1}">${position}</span> was destroyed!</p>`;

                            if (result.target.position === 1) {
                                html += `<p class="victory"><span class="player-${result.attacker.player + 1}">${attackerPlayer}</span> has destroyed the opponent's Champion Lane!</p>`;
                            } else {
                                html += `<p class="lane-strategy"><em>A destroyed side lane allows attacks on the Champion Lane from that side.</em></p>`;
                            }
                        }
                    } else {
                        html += `<p>Action could not be executed</p>`;
                    }

                    html += `
                        </div>
                    </div>
                    `;
                });
            }

            // Calcola lo stato dei difensori per il prossimo turno
            const nextTurnDefender1States = [...this.players[0].defendersOnCooldown];
            const nextTurnDefender2States = [...this.players[1].defendersOnCooldown];

            // Aggiorna per riflettere i defender che hanno usato difesa in questo turno
            for (let player = 0; player < 2; player++) {
                for (let pos = 0; pos < 3; pos++) {
                    if (this.players[player].selectedActions[pos] === ACTION_TYPES.DEFEND) {
                        if (player === 0) nextTurnDefender1States[pos] = true;
                        if (player === 1) nextTurnDefender2States[pos] = true;
                    }
                }
            }

            // Aggiungi una riga per mostrare lo stato dei difensori per il prossimo turno
            html += `
            <div class="section-header">Defender Status (Next Turn)</div>
            <div class="battle-event defender-status">
                <div class="battle-step">🛡️</div>
                <div class="battle-description">
                    <p class="defender-status-title"><strong>Next Turn Defender Status:</strong></p>
                    <div class="defender-status-section">
                        <span class="player-1">Player 1 Defenders:</span>
                        <ul class="defender-list">`;

            // Player 1 defenders next turn status
            for (let pos = 0; pos < 3; pos++) {
                const monster = this.players[0].board[pos];
                if (monster && monster.class === "Defender") {
                    const positionName = pos === 0 ? "Left" : pos === 1 ? "Center" : "Right";
                    const cooldownStatus = nextTurnDefender1States[pos] ?
                        '<span class="cooldown">ON COOLDOWN</span>' :
                        '<span class="ready">READY</span>';

                    html += `<li><strong>${monster.name}</strong> (${positionName}): ${cooldownStatus}${nextTurnDefender1States[pos] ? ' - Cannot defend next turn' : ' - Can defend next turn'}</li>`;
                }
            }

            // If no defenders found for Player 1
            if (!this.players[0].board.some(card => card && card.class === "Defender")) {
                html += `<li><em>No Defender monsters on the field</em></li>`;
            }

            html += `</ul>
                    </div>
                    <div class="defender-status-section">
                        <span class="player-2">Player 2 Defenders:</span>
                        <ul class="defender-list">`;

            // Player 2 defenders next turn status
            for (let pos = 0; pos < 3; pos++) {
                const monster = this.players[1].board[pos];
                if (monster && monster.class === "Defender") {
                    const positionName = pos === 0 ? "Left" : pos === 1 ? "Center" : "Right";
                    const cooldownStatus = nextTurnDefender2States[pos] ?
                        '<span class="cooldown">ON COOLDOWN</span>' :
                        '<span class="ready">READY</span>';

                    html += `<li><strong>${monster.name}</strong> (${positionName}): ${cooldownStatus}${nextTurnDefender2States[pos] ? ' - Cannot defend next turn' : ' - Can defend next turn'}</li>`;
                }
            }

            // If no defenders found for Player 2
            if (!this.players[1].board.some(card => card && card.class === "Defender")) {
                html += `<li><em>No Defender monsters on the field</em></li>`;
            }

            html += `</ul>
                    </div>
                    <div class="defender-rule">
                        <p><strong>Defender Rule:</strong> After using defend action, a Defender cannot defend in the next turn.</p>
                    </div>
                </div>
            </div>
            `;

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

        // Se l'azione è pump, applica subito il bonus
        if (action === ACTION_TYPES.PUMP) {
            card.attack += 1;
            card.defense += 1;
            card.speed += 1;
            // Aggiorna l'UI della carta
            this.updateCardStats(player, position, card);
            logGameEvent(`Player ${player + 1}'s ${card.name} pumps all stats by +1`);
        }

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
                } else if (action === ACTION_TYPES.SPECIAL) {
                    actionIndicator.classList.add('special-action');
                }

                cardElement.appendChild(actionIndicator);
            }
        }

        // Notifica al player
        if (player === PLAYERS.PLAYER1) {
            showNotification(`${card.name} will ${this.getActionLabel(action)}`, 'info');
        }
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

        // Aggiungi carta al cimitero solo quando siamo in Battle Phase
        if (this.currentPhase === PHASES.BATTLE) {
            this.players[player].graveyard.push(card);

            // Aggiorna il contatore del cimitero
            const graveyardCount = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .graveyard .count`);
            if (graveyardCount) {
                graveyardCount.textContent = this.players[player].graveyard.length.toString();
            }

            logGameEvent(`Player ${player + 1}'s ${card.name} was destroyed and sent to the graveyard.`);
            showNotification(`${card.name} was destroyed!`, 'warning');
        }

        // Rimuovi carta dal campo
        this.players[player].board[position] = null;

        // Rimuovi la carta dall'interfaccia
        const slot = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${position}"]`);
        if (slot) {
            slot.innerHTML = "Monster";
            slot.classList.add('empty');
        }
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
                logGameEvent(`Player ${player + 1}'s lane ${position + 1} has been destroyed!`);
                showNotification(`Player ${player + 1}'s lane ${position + 1} has been destroyed!`, 'warning');
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
        if (this.currentPhase !== PHASES.STRATEGY) {
            return;
        }

        // Ottieni la carta dal game state
        const card = this.players[player].board[position];
        if (!card) return;

        // Apriamo sempre il popup laterale di dettaglio carta invece del menu contestuale
        const cardElement2 = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${position}"] .card`);
        if (cardElement2) {
            showCardDetails(cardElement2);
        }
    },

    // Ottiene le azioni disponibili per una carta
    getAvailableActions: function (card, position, player) {
        const actions = [];

        // Verifica che player sia definito
        if (player === undefined) {
            console.error('Player is undefined in getAvailableActions');
            return actions;
        }

        // Determina le azioni disponibili in base al tipo di mostro
        if (card.class === "Defender") {
            // I Defender possono attaccare verticalmente o difendere (ma non entrambi)
            actions.push(ACTION_TYPES.ATTACK_VERTICAL);

            // Verifica se il difensore è in cooldown
            const isOnCooldown = this.players[player].defendersOnCooldown[position];

            // Solo se NON è in cooldown, può difendere
            if (!isOnCooldown) {
                actions.push(ACTION_TYPES.DEFEND);
            } else {
                // Log quando un difensore non può difendere per cooldown
                console.log(`Defender at position ${position} for player ${player} cannot defend this turn (on cooldown)`);
                logGameEvent(`Player ${player + 1}'s Defender at position ${position + 1} cannot defend this turn (cooldown active).`);
            }
        }
        else if (card.class === "Pumper") {
            // I Pumper possono attaccare verticalmente o pompare statistiche (ma non entrambi)
            actions.push(ACTION_TYPES.ATTACK_VERTICAL);
            actions.push(ACTION_TYPES.PUMP);
        }
        else if (card.class === "All Rounder") {
            // Gli All Rounder possono attaccare verticalmente O in diagonale (ma non entrambi)
            actions.push(ACTION_TYPES.ATTACK_VERTICAL);

            // Verifica se gli attacchi diagonali sono validi in base alla posizione
            if (position > 0) {
                actions.push(ACTION_TYPES.ATTACK_DIAGONAL_LEFT);
            }
            if (position < 2) {
                actions.push(ACTION_TYPES.ATTACK_DIAGONAL_RIGHT);
            }
        }
        else {
            // Per le altre carte, solo attacco verticale
            actions.push(ACTION_TYPES.ATTACK_VERTICAL);
        }

        // Aggiungi abilità speciali se presenti
        if (card.effect && card.effect.includes("special")) {
            actions.push(ACTION_TYPES.SPECIAL);
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

        // Aggiorna lo stato dei cooldown dei difensori
        this.updateDefenderCooldowns();

        // Log dello stato dei difensori alla fine del turno
        this.logDefendersCooldownState("End of Turn");

        // Marca tutti i mostri sul campo come "hanno combattuto"
        this.markMonstersAsFought();

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

    // Log dello stato dei difensori in cooldown
    logDefendersCooldownState: function (phase) {
        logGameEvent(`${phase} - Defender Cooldown Status:`);
        logGameEvent(`Player 1 defenders on cooldown: [${this.players[0].defendersOnCooldown}]`);
        logGameEvent(`Player 2 defenders on cooldown: [${this.players[1].defendersOnCooldown}]`);
    },

    // Aggiorna i cooldown dei difensori alla fine del turno
    updateDefenderCooldowns: function () {
        // Per ogni giocatore
        for (let player = 0; player < 2; player++) {
            // Per ogni posizione
            for (let position = 0; position < 3; position++) {
                // Se è un difensore e ha usato l'azione difendi in questo turno
                if (this.players[player].board[position]?.class === "Defender" &&
                    this.players[player].selectedActions[position] === ACTION_TYPES.DEFEND) {

                    // Metti il difensore in cooldown per il prossimo turno
                    this.players[player].defendersOnCooldown[position] = true;
                    logGameEvent(`Player ${player + 1}'s Defender at position ${position + 1} is now on cooldown for next turn.`);
                }
                // Se è un difensore e non ha usato l'azione difendi in questo turno
                else if (this.players[player].board[position]?.class === "Defender" &&
                    this.players[player].selectedActions[position] !== ACTION_TYPES.DEFEND) {

                    // Rimuovi il cooldown
                    this.players[player].defendersOnCooldown[position] = false;
                    logGameEvent(`Player ${player + 1}'s Defender at position ${position + 1} cooldown has been reset.`);
                }
            }
        }
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
        // Controlla se la champion lane di uno dei giocatori è stata distrutta
        if (this.players[PLAYERS.PLAYER1].lanes[1] <= 0) {
            // Giocatore 1 ha perso
            this.winner = PLAYERS.PLAYER2;
            return true;
        }

        if (this.players[PLAYERS.PLAYER2].lanes[1] <= 0) {
            // Giocatore 2 ha perso
            this.winner = PLAYERS.PLAYER1;
            return true;
        }

        return false;
    },

    // Termina il gioco
    endGame: function () {
        logGameEvent('Game has ended!');
        const winnerName = this.winner === PLAYERS.PLAYER1 ? "Player 1" : "Player 2";
        showNotification(`Game has ended! ${winnerName} wins!`, 'success');

        // Crea un overlay per mostrare il vincitore
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';

        const container = document.createElement('div');
        container.className = 'game-over-container';

        container.innerHTML = `
            <h1>Game Over</h1>
            <h2>${winnerName} Wins!</h2>
            <p>The champion of ${this.winner === PLAYERS.PLAYER1 ? "Player 2" : "Player 1"} has been defeated!</p>
            <button class="restart-button">Play Again</button>
        `;

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Aggiungi l'event listener per il pulsante di restart
        document.querySelector('.restart-button').addEventListener('click', function () {
            location.reload(); // Ricarica la pagina per iniziare una nuova partita
        });
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
    },

    // Marca tutti i mostri sul campo come "hanno combattuto"
    markMonstersAsFought: function () {
        // Per ogni giocatore
        for (let player = 0; player < 2; player++) {
            // Per ogni posizione
            for (let position = 0; position < 3; position++) {
                // Se c'è un mostro in questa posizione
                if (this.players[player].board[position]) {
                    // Marca il mostro come "ha combattuto"
                    this.players[player].monstersHaveFought[position] = true;
                    logGameEvent(`Monster in position ${position + 1} for Player ${player + 1} marked as 'has fought' and cannot be replaced.`);
                }
            }
        }
    },

    // Verifica se un mostro può essere sostituito
    canReplaceMonster: function (player, position) {
        // Se non c'è un mostro in questa posizione, si può sempre posizionare
        if (!this.players[player].board[position]) {
            return true;
        }

        // Se c'è un mostro e ha già combattuto, non può essere sostituito
        if (this.players[player].monstersHaveFought[position]) {
            return false;
        }

        // Altrimenti può essere sostituito
        return true;
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

            // Se è una carta campione e siamo nella fase strategica, mostra il menu degli effetti speciali
            if (card.classList.contains('champion') && gameState.currentPhase === PHASES.STRATEGY) {
                const playerArea = card.closest('.player-area');
                if (playerArea && playerArea.classList.contains('user')) {
                    // Solo il giocatore umano può attivare effetti campione
                    showChampionEffectsMenu(card);
                }
            }
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
    let isChampion = card.classList.contains('champion');

    if (isChampion) {
        cardType = 'Champion';
    }

    // Troviamo ATK, DEF, SPD dai contenuti della carta
    let atk = "N/A", def = "N/A", spd = "N/A", desc = "N/A", cardClass = "N/A";

    if (cardType === 'Monster' || cardType === 'Champion') {
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
                desc = "Can EITHER attack vertically OR defend (cannot defend in consecutive turns). When defending, takes no damage.";
            } else if (cardClass === "Pumper") {
                desc = "Can EITHER attack vertically OR pump stats (+1 ATK, +1 DEF, +1 SPD) for one turn.";
            } else if (cardClass === "All Rounder") {
                desc = "Can EITHER attack vertically OR attack diagonally to target any adjacent opponent monster.";
            } else if (cardClass === "Champion") {
                // Trova il campione corrispondente nel catalogo
                const champion = findChampionByName(cardName);
                if (champion && champion.effect) {
                    desc = champion.effect;
                } else {
                    desc = "Main card. When its DEF is reduced to 0, you lose the game.";
                }
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
            // Trova la posizione della carta sul campo e il giocatore
            const cardElement = card.closest('.monster-slot');
            if (cardElement) {
                const position = parseInt(cardElement.dataset.position);
                const isPlayer1 = cardElement.closest('.player-area.user') !== null;
                const player = isPlayer1 ? PLAYERS.PLAYER1 : PLAYERS.PLAYER2;

                // Solo se siamo nella fase strategica e la carta è del giocatore 1
                if (gameState.currentPhase === PHASES.STRATEGY && isPlayer1) {
                    // Ottieni le azioni disponibili
                    const actions = gameState.getAvailableActions(
                        gameState.players[player].board[position],
                        position,
                        player
                    );

                    // Crea pulsanti per ogni azione
                    actions.forEach(action => {
                        const actionButton = document.createElement('button');
                        actionButton.className = 'action-button clickable';
                        actionButton.textContent = gameState.getActionLabel(action);
                        actionButton.setAttribute('data-action', action);

                        // Aggiungi evento click
                        actionButton.addEventListener('click', () => {
                            gameState.selectAction(player, position, action);

                            // Chiudi il visualizzatore dopo la selezione
                            detailViewer.style.display = 'none';
                        });

                        actionList.appendChild(actionButton);
                    });

                    // Aggiungi messaggio per selezionare azione
                    const actionMessage = document.createElement('div');
                    actionMessage.className = 'action-message';

                    // Messaggio personalizzato in base al tipo di mostro
                    if (cardClass === "Defender") {
                        actionMessage.textContent = 'Choose ONE action: Attack OR Defend. Defend prevents all damage but has 1 turn cooldown.';
                    } else if (cardClass === "Pumper") {
                        actionMessage.textContent = 'Choose ONE action: Attack OR Pump (+1 to all stats).';
                    } else if (cardClass === "All Rounder") {
                        actionMessage.textContent = 'Choose ONE attack direction: Vertical OR Diagonal.';
                    } else {
                        actionMessage.textContent = 'Click on an action button to select it for this turn.';
                    }

                    actionList.appendChild(actionMessage);
                } else {
                    // Mostra solo informazioni sulle azioni disponibili senza pulsanti
                    if (cardClass === "Defender") {
                        actionList.innerHTML = `
                            <div class="action-title">Defender Abilities:</div>
                            <div class="action-badges">
                                <div class="action-badge">Attack ↑</div>
                                <div class="action-badge">Defend 🛡️</div>
                            </div>
                            <div class="action-explanation">
                                <p><strong>CHOOSE ONE ACTION PER TURN:</strong></p>
                                <p>• Attack vertically against opponent</p>
                                <p>• Defend to block all incoming damage</p>
                                <p class="emphasis">Cannot defend in consecutive turns (1 turn cooldown)</p>
                            </div>
                        `;
                    } else if (cardClass === "Pumper") {
                        actionList.innerHTML = `
                            <div class="action-title">Pumper Abilities:</div>
                            <div class="action-badges">
                                <div class="action-badge">Attack ↑</div>
                                <div class="action-badge">Pump +1/+1/+1</div>
                            </div>
                            <div class="action-explanation">
                                <p><strong>CHOOSE ONE ACTION PER TURN:</strong></p>
                                <p>• Attack vertically against opponent</p>
                                <p>• Pump to gain +1 ATK, +1 DEF, and +1 SPD</p>
                                <p class="emphasis">Some pumpers get stronger bonuses to specific stats</p>
                            </div>
                        `;
                    } else if (cardClass === "All Rounder") {
                        actionList.innerHTML = `
                            <div class="action-title">All Rounder Abilities:</div>
                            <div class="action-badges">
                                <div class="action-badge">Attack ↑</div>
                                <div class="action-badge">Attack ↖</div>
                                <div class="action-badge">Attack ↗</div>
                            </div>
                            <div class="action-explanation">
                                <p><strong>CHOOSE ONE ATTACK DIRECTION PER TURN:</strong></p>
                                <p>• Attack vertically (directly forward)</p>
                                <p>• Attack diagonally left (if available)</p>
                                <p>• Attack diagonally right (if available)</p>
                                <p class="emphasis">Cannot attack multiple directions in one turn</p>
                            </div>
                        `;
                    } else {
                        actionList.innerHTML = `
                            <div class="action-badge">Attack ↑</div>
                        `;
                    }
                }
            } else {
                // Carta nella mano
                actionList.innerHTML = '<div class="action-note">Place on board to use actions</div>';
            }
        } else if (cardType === 'Champion') {
            // Per il campione, mostra l'opzione per attivare l'effetto speciale
            const isPlayer1Champion = card.closest('.player-area.user') !== null;

            if (isPlayer1Champion && gameState.currentPhase === PHASES.STRATEGY) {
                const champion = findChampionByName(cardName);

                if (champion) {
                    const activateButton = document.createElement('button');
                    activateButton.className = 'champion-action-button clickable';
                    activateButton.textContent = 'Activate Special Effect';

                    activateButton.addEventListener('click', () => {
                        activateChampionEffect(champion);
                        detailViewer.style.display = 'none';
                    });

                    actionList.appendChild(activateButton);

                    const effectExplanation = document.createElement('div');
                    effectExplanation.className = 'champion-effect-explanation';
                    effectExplanation.textContent = champion.effect;
                    actionList.appendChild(effectExplanation);
                }
            } else {
                actionList.innerHTML = '<div class="action-note">Champion: When its DEF reaches 0, you lose the game</div>';
            }
        } else {
            // Spell card
            actionList.innerHTML = '<div class="action-note">Spells activate automatically during Battle Phase</div>';
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
    // Crea l'oggetto per tracciare gli effetti dei campioni
    gameState.championEffects = {
        canAttackBlockedChampion: false,
        splashDamage: false,
        multiAttack: false,
        frozenMonsters: []
    };

    // Aggiungi metodi per gli effetti dei campioni
    gameState.freezeMonster = function (player, position) {
        this.championEffects.frozenMonsters.push({ player, position });
        // Visualizza l'effetto di congelamento
        const monsterSlot = document.querySelector(`.player-area.${player === PLAYERS.PLAYER1 ? 'user' : 'opponent'} .monster-slot[data-position="${position}"]`);
        if (monsterSlot) {
            monsterSlot.classList.add('frozen');
        }
    };

    gameState.healTarget = function (player, position, amount) {
        if (position === 1) {
            // Cura il campione (aumenta la vita della lane)
            this.players[player].lanes[position] += amount;
            // Aggiorna l'UI
            this.updateLaneLabels();
        } else {
            // Cura un mostro
            const monster = this.players[player].board[position];
            if (monster) {
                monster.defense += amount;
                // Aggiorna l'UI
                this.updateCardStats(player, position, monster);
            }
        }
    };

    // Inizializza il gioco
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
        const cardType = window.draggedElement?.dataset?.cardType;
        if (!cardType) return;

        const slotType = this.dataset.slotType;
        const position = parseInt(this.dataset.position);

        // Blocca il drop nella posizione centrale (champion lane) perché è riservata ai campioni
        if (position === 1) {
            this.classList.add('slot-error');
            return;
        }

        // Verifica se un mostro può essere sostituito (se c'è già un mostro in quello slot)
        if (cardType === 'monster' && !this.classList.contains('empty')) {
            // Se il mostro ha già combattuto, non può essere sostituito
            const playerIndex = gameState.activePlayer;
            if (!gameState.canReplaceMonster(playerIndex, position)) {
                this.classList.add('slot-error');
                return;
            }
        }

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

        const cardType = window.draggedElement?.dataset?.cardType;
        if (!cardType) return;

        const slotType = this.dataset.slotType;
        const cardId = window.draggedElement.dataset.cardId;
        const position = parseInt(this.dataset.position);

        // Blocca il drop nella lane del campione (centro, posizione 1)
        if (position === 1) {
            showNotification("Cannot place cards in the Champion Lane. This lane is reserved for Champions only.", "error");
            return false;
        }

        // Verifica se un mostro può essere sostituito
        if (cardType === 'monster' && !this.classList.contains('empty')) {
            const playerIndex = gameState.activePlayer;
            if (!gameState.canReplaceMonster(playerIndex, position)) {
                showNotification("Cannot replace a monster that has already fought in battle.", "error");
                return false;
            }
        }

        // Verifica se il tipo di carta è compatibile con lo slot
        if (cardType === slotType) {
            // Riferimento alla carta esistente (se presente)
            const existingCard = this.querySelector('.card');
            let existingCardData = null;
            const slotElement = this; // Salva il riferimento allo slot

            // Se stiamo sostituendo una carta esistente, salvala per rimetterla nella mano
            if (existingCard) {
                const playerIndex = gameState.activePlayer;

                // Crea una copia visiva della carta per l'animazione di ritorno in mano
                const cardRect = existingCard.getBoundingClientRect();
                const cardClone = existingCard.cloneNode(true);
                cardClone.style.position = 'fixed';
                cardClone.style.top = `${cardRect.top}px`;
                cardClone.style.left = `${cardRect.left}px`;
                cardClone.style.width = `${cardRect.width}px`;
                cardClone.style.height = `${cardRect.height}px`;
                cardClone.classList.add('returning-to-hand');
                document.body.appendChild(cardClone);

                // Calcola la posizione finale dell'animazione (verso la mano del giocatore)
                const hand = document.querySelector('.player-area.user .hand');
                const handRect = hand.getBoundingClientRect();
                cardClone.style.transition = 'all 0.8s ease-out';

                // Anima la carta verso la mano
                setTimeout(() => {
                    cardClone.style.top = `${handRect.top}px`;
                    cardClone.style.left = `${handRect.left + 50}px`;
                    cardClone.style.transform = 'scale(0.5) rotate(10deg)';
                    cardClone.style.opacity = '0.7';
                }, 10);

                // Rimuovi il clone dopo l'animazione
                setTimeout(() => {
                    cardClone.remove();
                }, 800);

                if (cardType === 'monster' && slotType === 'monster') {
                    existingCardData = gameState.players[playerIndex].board[position];

                    // Rimuoviamo la carta dal campo prima di aggiungere quella nuova
                    gameState.players[playerIndex].board[position] = null;
                } else if (cardType === 'spell' && slotType === 'spell') {
                    existingCardData = gameState.players[playerIndex].spells[position];

                    // Rimuoviamo la carta dal campo prima di aggiungere quella nuova
                    gameState.players[playerIndex].spells[position] = null;
                }

                // Aggiungiamo la carta rimossa alla mano del giocatore
                if (existingCardData) {
                    gameState.players[playerIndex].hand.push(existingCardData);
                    logGameEvent(`Player ${playerIndex + 1}'s ${cardType} returned to hand from position ${position + 1}`);
                    showNotification(`${cardType.charAt(0).toUpperCase() + cardType.slice(1)} card returned to your hand`, "info");

                    // Aggiorna l'UI della mano del giocatore con animazione dopo che l'animazione
                    // di ritorno è quasi completa per un effetto fluido
                    setTimeout(() => {
                        gameState.updatePlayer1CardsUI(true); // Passa true per indicare che è una carta ritornata
                    }, 600);
                }
            }

            // Crea una copia della carta e inseriscila nello slot
            const cardClone = window.draggedElement.cloneNode(true);

            // Rimuovi l'attributo draggable dalla carta sul campo
            cardClone.removeAttribute('draggable');

            // Ottieni riferimento al dettaglio della carta se è visualizzato
            const detailViewer = document.querySelector('.card-detail-viewer');
            const isDetailViewerOpen = detailViewer && detailViewer.style.display === 'block';

            // Verifica se stiamo visualizzando i dettagli della carta in questo slot
            const currentSlot = document.querySelector(`.monster-slot[data-position="${position}"]`);
            const currentCard = currentSlot ? currentSlot.querySelector('.card') : null;
            const isViewingThisSlot = isDetailViewerOpen && currentCard &&
                detailViewer.querySelector('#card-name').textContent ===
                (currentCard.innerText.split('\n')[0] || '');

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
                gameState.players[playerIndex].board[position] = card;

                // Rimuovi la carta dalla mano nel gameState
                gameState.players[playerIndex].hand.splice(originalCardIndex, 1);

                // Reset dello stato "ha combattuto" per questa posizione
                gameState.players[playerIndex].monstersHaveFought[position] = false;

                // Aggiungi event listener per selezionare l'azione
                cardClone.addEventListener('click', function () {
                    // Se siamo nella fase strategica
                    if (gameState.currentPhase === PHASES.STRATEGY) {
                        gameState.showActionMenu(playerIndex, position, this);
                    }
                });

                // Se il dettaglio della carta era aperto per questa posizione, aggiorna il popup
                if (isViewingThisSlot) {
                    showCardDetails(cardClone);
                }
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
                    gameState.players[playerIndex].spells[position] = card;
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

// Aggiungi stili CSS per indicare i mostri che hanno combattuto e non possono essere sostituiti
const foughtMonsterStyles = document.createElement('style');
foughtMonsterStyles.textContent = `
    .card.fought {
        position: relative;
    }
    
    .card.fought::after {
        content: "⚔️";
        position: absolute;
        top: 5px;
        right: 5px;
        font-size: 16px;
        background-color: rgba(255, 0, 0, 0.7);
        color: white;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 1s infinite alternate;
    }
    
    @keyframes pulse {
        from { transform: scale(1); }
        to { transform: scale(1.2); }
    }
    
    .monster-slot:has(.card.fought) {
        pointer-events: none;
    }
    
    .monster-slot:has(.card.fought):hover::before {
        content: "This monster has fought and cannot be replaced";
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10;
    }
`;
document.head.appendChild(foughtMonsterStyles);
