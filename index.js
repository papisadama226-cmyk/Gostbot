const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const readline = require("readline");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  if (!sock.authState.creds.registered) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Entrez votre numéro WhatsApp (225xxxxxxxxxx): ", async (number) => {
      const code = await sock.requestPairingCode(number);
      console.log(`Votre code : ${code}`);
      rl.close();
    });
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;

    const body =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    if (!body.startsWith(".")) return;

    const cmd = body.slice(1).split(" ")[0].toLowerCase();

    switch (cmd) {
      case "ping":
        await sock.sendMessage(from, {
          text: "🏓 Pong !"
        });
        break;

      case "menu":
        await sock.sendMessage(from, {
          text: `👿 GOSTBOT 👿

📋 Commandes :

.ping
.menu
.owner
.info`
        });
        break;

      case "owner":
        await sock.sendMessage(from, {
          text: "👑 Owner : Adama"
        });
        break;

      case "info":
        await sock.sendMessage(from, {
          text: "🤖 GostBot v1.0"
        });
        break;
    }
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ GostBot connecté");
    }

    if (connection === "close") {
      startBot();
    }
  });
}

startBot();
