import { Server } from 'socket.io';

let io;
const onlinePlayers = new Map(); // socket.id -> { username, userId }
const activeTrades = new Map();  // tradeId -> { p1: socketId, p2: socketId, p1Offer: null, p2Offer: null, p1Confirm: false, p2Confirm: false }

export function getIO() { return io; }

export function initSocket(server, allowedOrigin) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigin ? allowedOrigin : '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Player joins the global lobby
    socket.on('join_lobby', (data) => {
      onlinePlayers.set(socket.id, { username: data.username, userId: data.userId });
      io.emit('online_players', Array.from(onlinePlayers.entries()).map(([id, info]) => ({ id, ...info })));
    });

    // Request to trade
    socket.on('trade_request', (targetSocketId) => {
      const sender = onlinePlayers.get(socket.id);
      if (sender && onlinePlayers.has(targetSocketId)) {
        io.to(targetSocketId).emit('trade_request_received', { fromId: socket.id, fromUsername: sender.username });
      }
    });

    // Accept trade
    socket.on('trade_accept', (targetSocketId) => {
      const p1 = targetSocketId; // The one who requested
      const p2 = socket.id;      // The one who accepted
      const tradeId = `${p1}-${p2}`;
      
      activeTrades.set(tradeId, { p1, p2, p1Offer: null, p2Offer: null, p1Confirm: false, p2Confirm: false });
      
      io.to(p1).emit('trade_started', { tradeId, partnerUsername: onlinePlayers.get(p2)?.username });
      io.to(p2).emit('trade_started', { tradeId, partnerUsername: onlinePlayers.get(p1)?.username });
    });

    // Reject trade
    socket.on('trade_reject', (targetSocketId) => {
      io.to(targetSocketId).emit('trade_rejected');
    });

    // Offer item/pokemon
    socket.on('trade_offer', (data) => {
      const { tradeId, offer } = data;
      const trade = activeTrades.get(tradeId);
      if (!trade) return;

      if (trade.p1 === socket.id) {
        trade.p1Offer = offer;
        io.to(trade.p2).emit('trade_partner_offer', offer);
      } else if (trade.p2 === socket.id) {
        trade.p2Offer = offer;
        io.to(trade.p1).emit('trade_partner_offer', offer);
      }
      
      trade.p1Confirm = false;
      trade.p2Confirm = false;
      io.to(trade.p1).emit('trade_confirm_status', { p1: false, p2: false });
      io.to(trade.p2).emit('trade_confirm_status', { p1: false, p2: false });
    });

    // Confirm trade
    socket.on('trade_confirm', (tradeId) => {
      const trade = activeTrades.get(tradeId);
      if (!trade) return;

      if (trade.p1 === socket.id) trade.p1Confirm = true;
      if (trade.p2 === socket.id) trade.p2Confirm = true;

      io.to(trade.p1).emit('trade_confirm_status', { p1: trade.p1Confirm, p2: trade.p2Confirm });
      io.to(trade.p2).emit('trade_confirm_status', { p1: trade.p1Confirm, p2: trade.p2Confirm });

      // If both confirmed, execute trade
      if (trade.p1Confirm && trade.p2Confirm) {
        io.to(trade.p1).emit('trade_execute', trade.p2Offer);
        io.to(trade.p2).emit('trade_execute', trade.p1Offer);
        activeTrades.delete(tradeId);
      }
    });

    // Cancel trade
    socket.on('trade_cancel', (tradeId) => {
      const trade = activeTrades.get(tradeId);
      if (trade) {
        io.to(trade.p1).emit('trade_cancelled');
        io.to(trade.p2).emit('trade_cancelled');
        activeTrades.delete(tradeId);
      }
    });

    socket.on('disconnect', () => {
      onlinePlayers.delete(socket.id);
      io.emit('online_players', Array.from(onlinePlayers.entries()).map(([id, info]) => ({ id, ...info })));
      
      // Cleanup trades
      for (const [tradeId, trade] of activeTrades.entries()) {
        if (trade.p1 === socket.id || trade.p2 === socket.id) {
          const partner = trade.p1 === socket.id ? trade.p2 : trade.p1;
          io.to(partner).emit('trade_cancelled', 'Партнёр отключился');
          activeTrades.delete(tradeId);
        }
      }
    });
  });
}
