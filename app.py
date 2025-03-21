from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tridimensional-duels-secret'
socketio = SocketIO(app)

@app.route('/')
def index():
    # Per ora restituiamo solo il template base con la griglia statica
    return render_template('index.html')

# Gestione degli eventi WebSocket
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('phase_change')
def handle_phase_change(data):
    # Riceve notifiche di cambio fase dal client e le ritrasmette
    # In futuro, qui andrà implementata la logica per validare le azioni
    print(f"Phase change: {data['phase']}")
    socketio.emit('phase_update', data)

@socketio.on('card_placed')
def handle_card_placed(data):
    # Riceve notifiche di carte posizionate e le ritrasmette
    print(f"Card placed: {data['card_type']} in position {data['position']}")
    socketio.emit('card_update', data)

@socketio.on('card_action')
def handle_card_action(data):
    # Riceve notifiche di azioni sulle carte e le ritrasmette
    print(f"Card action: {data['action']} on {data['card_id']}")
    socketio.emit('action_update', data)

if __name__ == '__main__':
    socketio.run(app, debug=True) 