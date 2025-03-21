# TridimensionalDuels

Una implementazione in Python e HTML del gioco di carte strategico TridimensionalDuels.

## Requisiti

- Python 3.6 o superiore
- Flask
- Flask-SocketIO

## Installazione

1. Clona questo repository o scarica i file

2. Crea un ambiente virtuale (opzionale ma consigliato):
   ```
   python -m venv venv
   ```

3. Attiva l'ambiente virtuale:
   - Su Windows:
     ```
     venv\Scripts\activate
     ```
   - Su macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Installa le dipendenze:
   ```
   pip install flask flask-socketio
   ```

## Esecuzione

1. Avvia l'applicazione:
   ```
   python app.py
   ```

2. Apri il browser e vai a:
   ```
   http://localhost:5000
   ```

## Struttura del Progetto

- `app.py`: Applicazione Flask principale con WebSocket
- `templates/`: Template HTML
  - `index.html`: Pagina principale del gioco
- `static/`: File statici
  - `css/style.css`: Stili CSS
  - `js/game.js`: Logica di gioco e turni

## Meccaniche di Gioco Implementate

### Flusso di Gioco
Il gioco segue un ciclo di turni, ognuno con quattro fasi distinte:

1. **Fase di Pescata (Draw)**:
   - Il giocatore attivo pesca una carta
   - Verifica delle condizioni di fine gioco (deck vuoto)

2. **Fase Strategica (Strategy)**:
   - Timer di 30 secondi per le decisioni
   - Posizionamento delle carte mostro e spell
   - Selezione delle azioni per le carte sul campo

3. **Fase di Battaglia (Battle)**:
   - Risoluzione automatica delle azioni
   - Attivazione delle spell in ordine di priorità
   - Attacchi dei mostri in ordine di velocità (SPD)

4. **Fase Finale (End)**:
   - Applicazione del danno
   - Aggiornamento dello stato delle carte
   - Verifica delle condizioni di vittoria
   - Passaggio del turno al giocatore successivo

### Sistema di Drag-and-Drop
- Posizionamento di carte mostro e spell nelle rispettive zone
- Validazione del tipo di carta per slot specifici
- Feedback visivo durante il trascinamento

### WebSocket per Multiplayer
- Comunicazione in tempo reale tra client e server
- Broadcast degli aggiornamenti di stato
- Sincronizzazione delle azioni tra i giocatori

## Fase di Sviluppo Attuale

- ✅ Griglia di gioco statica con drag-and-drop
- ✅ Flusso completo di gioco con tutte le fasi
- ✅ Timer per la fase strategica
- ✅ Sistema di notifiche e log di gioco
- ✅ Supporto WebSocket per comunicazione client-server
- 🔄 Effetti delle carte (in sviluppo)
- 🔄 Sistema di combattimento (in sviluppo)
- 🔄 IA per l'avversario (in sviluppo)

## Prossimi Passi

1. Implementare il sistema di effetti delle carte
2. Sviluppare la logica di combattimento completa
3. Creare un'IA semplice per l'avversario
4. Implementare il deck builder
5. Aggiungere il supporto per partite multiplayer 