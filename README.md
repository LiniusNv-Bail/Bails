l
<div align="center">
  <img src="https://cdn.imagetourls.com/uploads/tyImg/bu4HRyoM.png" width="180" alt="LiniusNv"/>

  # LiniusNv

  **Advanced WhatsApp WebSocket Library for Node.js**

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![GitHub](https://img.shields.io/badge/source-GitHub-black.svg)](https://github.com/LiniusNv-Bail/Bails)
  [![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)

  A powerful WebSocket-based library for interacting with WhatsApp Web through Node.js.

  LiniusNv is an enhanced fork of [Baileys](https://github.com/WhiskeySockets/Baileys), originally developed by WhiskeySockets, with additional features and custom implementations.
</div>

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Import](#import)
- [Getting Started](#getting-started)
  - [QR Code Authentication](#1-qr-code-authentication)
  - [Pairing Code Authentication](#2-pairing-code-authentication)
- [Data Storage](#data-storage)
- [Ban Sentinel (Auto-Disconnect)](#ban-sentinel-auto-disconnect)
- [Messaging](#messaging)
  - [Message Synchronization](#message-synchronization)
  - [Order Message](#order-message)
  - [Poll Result Snapshot](#poll-result-snapshot)
  - [Product Message](#product-message)
  - [Interactive Message](#interactive-message)
  - [Group Label](#group-label)
  - [Send to Group Members](#send-to-group-members)
- [Message Helpers](#message-helpers)
- [Credits](#credits)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## Overview

LiniusNv provides a convenient interface for connecting applications and automation systems to WhatsApp Web.

### Key Features

- QR Code authentication.
- Pairing Code authentication.
- WebSocket-based communication.
- Message sending and relaying.
- Interactive messages and media support.
- Polls and quiz messages.
- Group messaging utilities.
- Custom message synchronization options.
- **Ban Sentinel — Auto-Disconnect on Ban Detection.**
- In-memory data storage.
- Compatibility with existing Baileys-based projects.

---

## Installation

LiniusNv is distributed directly through GitHub and is not currently published on the npm registry.

### Install directly

```bash
npm install github:LiniusNv-Bail/Bails
```

Manual package configuration

Add the following dependency to your package.json:

```json
{
  "dependencies": {
    "@liniusnv/baileys": "github:LiniusNv-Bail/Bails"
  }
}
```

Migration from original Baileys

Already using @whiskeysockets/baileys?

You can replace the original package with LiniusNv without changing your existing require() or import statements.

```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "github:LiniusNv-Bail/Bails"
  }
}
```

Your existing code can continue using:

```javascript
const baileys = require('@whiskeysockets/baileys');
```

Install a specific branch or commit

```bash
npm install github:LiniusNv-Bail/Bails#main
```

---

Import

Import the required functions from the package:

```javascript
const {
  default: makeWASocket,
  Browsers
} = require('@LiniusNv-Bail/Bails');
```

---

Getting Started

1. QR Code Authentication

The simplest way to connect your WhatsApp account is through a QR Code.

```javascript
const {
  default: makeWASocket,
  Browsers
} = require('@LiniusNv-Bail/Bails');

const client = makeWASocket({
  browser: Browsers.LiniusNv('Chrome'),
  printQRInTerminal: true
});
```

Scan the generated QR Code using the Linked Devices feature in WhatsApp.

2. Pairing Code Authentication

You can also authenticate using a phone number and a pairing code.

```javascript
const {
  default: makeWASocket,
  fetchLatestWAWebVersion,
  Browsers
} = require('@LiniusNv-Bail/Bails');

const client = makeWASocket({
  browser: Browsers.LiniusNv('Chrome'),
  printQRInTerminal: false,
  version: await fetchLatestWAWebVersion(),
  aiLabel: false
});

const number = '628XXXXXXXXXX';

const code = await client.requestPairingCode(
  number.trim()
);

console.log('Your pairing code: ' + code);
```

Custom Pairing Code

You can optionally provide a custom pairing code:

```javascript
const code = await client.requestPairingCode(
  number,
  'YYYYYYYY'
);
```

---

Data Storage

LiniusNv supports in-memory storage for maintaining contact and event information during runtime.

```javascript
const {
  default: makeWASocket,
  makeInMemoryStore
} = require('@LiniusNv-Bail/Bails');

const pino = require('pino');

const store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store'
  })
});

const client = makeWASocket({
  // Your socket configuration
});

store.bind(client.ev);

client.ev.on('contacts.upsert', () => {
  console.log(
    'New contact:',
    Object.values(store.contacts)
  );
});
```

---

Ban Sentinel (Auto-Disconnect)

LiniusNv includes a built-in Ban Sentinel system that automatically detects signs of an impending WhatsApp ban and immediately disconnects the socket to prevent a permanent account block.

How It Works

The sentinel monitors every outgoing message and every connection event. If it detects any of the following signs, it will:

1. Force-close the WebSocket connection.
2. Write a cooldown timestamp to .baileys-ban-guard.json in your project root.
3. Block new socket creation until the cooldown expires.

Detection Triggers

Trigger Description
Ban Keywords Errors containing restricted, banned, forbidden, spam, rate limit, too many requests, account blocked, temporarily blocked, not-authorized, invalid session.
HTTP Status Codes 401 (Unauthorized), 403 (Forbidden), 429 (Too Many Requests), 440 (Conflict).
Stream Errors Server-sent stream:error with codes 400, 401, 403, 409, 429, 440, 500, 503.
Rate Limiter 5 or more message failures within 30 seconds.
Disconnect Codes 401, 403, 440.

Cooldown Behavior

· Default Cooldown: 60 minutes.
· After the sentinel triggers, makeWASocket() will refuse to create a new connection until the cooldown expires.
· A file named .baileys-ban-guard.json will be created in your project root:

```json
{
  "cooldownUntil": 1762443600000,
  "reason": "Ban keyword detected: \"restricted\"",
  "lastTrigger": "2026-11-06T10:00:00.000Z"
}
```

Configuration

You can customize the sentinel behavior by editing src/Utils/ban-sentinel.js:

```javascript
const CONFIG = {
  FAIL_WINDOW_MS: 30000,          // Detection window (ms)
  MAX_FAILS_IN_WINDOW: 5,         // Max failures before trigger
  COOLDOWN_MINUTES: 60,           // Cooldown duration
  BAN_KEYWORDS: [                 // Keywords to trigger
    'restricted', 'banned', 'forbidden',
    'too many requests', 'rate limit', 'ratelimit',
    'spam', 'account blocked', 'account has been',
    'temporarily blocked', 'not-authorized',
    'not authorized', 'invalid session'
  ],
  BAN_CLOSE_CODES: [401, 403, 440],
  STREAM_ERROR_CODES: [400, 401, 403, 409, 429, 440, 500, 503]
};
```

Manual Cooldown Reset

If you want to reset the cooldown manually (e.g., after your account has recovered), simply:

1. Delete the .baileys-ban-guard.json file, or
2. Edit the file and set "cooldownUntil": 0.

Then restart your bot.

Checking Cooldown Status

You can programmatically check the cooldown status from your bot:

```javascript
const {
  isOnCooldown,
  getCooldownRemaining,
  loadGuard
} = require('@LiniusNv-Bail/Bails/lib/Utils/ban-sentinel');

if (isOnCooldown()) {
  const remaining = getCooldownRemaining();
  console.log(`Cooldown active: ${remaining} minutes remaining.`);
  console.log('Reason:', loadGuard().reason);
}
```

⚠️ Important: The Ban Sentinel is designed to protect your account, not to bypass WhatsApp's Terms of Service. It only reacts to official ban signals. Sending bulk or abusive messages will still result in a permanent ban regardless of the sentinel.

---

Messaging

LiniusNv provides several methods for sending and relaying different WhatsApp message types.

Message Synchronization (noSelfSync & participant)

LiniusNv provides two powerful options to control message synchronization behavior: noSelfSync and participant.

1. noSelfSync

The noSelfSync option controls whether a relayed message is synchronized with your other linked devices.

This option applies to private one-to-one chats and does not prevent delivery to the recipient.

Configuration Behavior
true Sends the message without syncing it to your other linked devices. Message still appears in your primary chat.
false Sends the message and allows normal synchronization.

Disable synchronization

```javascript
await client.relayMessage(
  m.chat,
  {
    conversation: 'Hello from LiniusNv'
  },
  {
    noSelfSync: true
  }
);
```

Enable synchronization (default)

```javascript
await client.relayMessage(
  m.chat,
  {
    conversation: 'Hello from LiniusNv'
  },
  {
    noSelfSync: false
  }
);
```

Using sendMessage

```javascript
await client.sendMessage(
  m.chat,
  {
    text: 'Hello from LiniusNv'
  },
  {
    noSelfSync: true
  }
);
```

---

2. participant (Stealth Send)

The participant option allows you to send a message without it ever appearing in your own chat. This is useful for stealth messaging, silent notifications, or bot automation where the sender should not see the outgoing message in their WhatsApp app.

When participant is provided:

· The message will be delivered to the recipient's phone.
· The message will NOT appear in the sender's chat (no new chat, no message bubble).
· The message will NOT be synced to any of your linked devices.
· The noSelfSync option is automatically forced to true.

Configuration Behavior
participant: { jid: "target@s.whatsapp.net" } Message sent to target, not visible in sender's chat.
No participant Message sent and visible in sender's chat (normal behavior).

Stealth Send (hidden from sender)

```javascript
await client.sendMessage(
  '6281234567890@s.whatsapp.net',
  {
    text: 'This message will NOT appear in your own chat.'
  },
  {
    participant: { jid: '6281234567890@s.whatsapp.net' }
  }
);
```

Stealth Relay Message

```javascript
await client.relayMessage(
  '6281234567890@s.whatsapp.net',
  {
    conversation: 'Silent message from LiniusNv'
  },
  {
    participant: { jid: '6281234567890@s.whatsapp.net' },
    noSelfSync: true
  }
);
```

⚠️ Important Notes:

· The participant.jid must exactly match the target jid, otherwise encryption will fail.
· This option only works in private 1-on-1 chats. Group chats do not support this feature.
· When using participant, the message is not stored in the sender's message history, so the sender won't see any record of it.
· The recipient will still see the message as coming from your WhatsApp number.

---

Order Message

Send an order-style message containing a product thumbnail, store name, and payment information.

```javascript
const fs = require('fs');

const thumbnail = fs.readFileSync('./liniusnvthumb.jpg');

await client.sendMessage(m.chat, {
  thumbnail,
  message: 'Order summary',
  orderTitle: 'My Store',
  totalAmount1000: 72502,
  totalCurrencyCode: 'IDR'
}, {
  quoted: m
});
```

---

Poll Result Snapshot

Send a poll result snapshot with newsletter information.

```javascript
await client.sendMessage(m.chat, {
  pollResultMessage: {
    name: 'My Poll',
    options: [
      { optionName: 'Option 1' },
      { optionName: 'Option 2' }
    ],
    newsletter: {
      newsletterName: '0X8 - Society',
      newsletterJid: '120363424944937940@newsletter'
    }
  }
});
```

---

Product Message

Send a product-style message containing product information, pricing, and an external URL button.

```javascript
await client.relayMessage(m.chat, {
  productMessage: {
    title: 'Product.pdf',
    description: 'Product description',
    thumbnail: {
      url: './liniusnvthumb.jpg'
    },
    productId: 'EXAMPLE_TOKEN',
    retailerId: 'EXAMPLE_RETAILER_ID',
    url: 'https://example.com',
    body: 'Body text',
    footer: 'Footer',
    buttons: [
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: 'Visit',
          url: 'https://example.com'
        })
      }
    ],
    priceAmount1000: 72502,
    currencyCode: 'IDR'
  }
});
```

---

Interactive Message

Create interactive messages with media, titles, descriptions, footers, and configurable buttons.

```javascript
await client.sendMessage(m.chat, {
  image: {
    url: './liniusnvimg.jpg'
  },
  text: 'body',
  title: 'title',
  footer: 'footer',
  interactiveButtons: [
    {
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: '\0'
      })
    }
  ],
  messageParams: JSON.stringify({
    bottom_sheet: {
      // Additional configuration
    }
  })
});
```

---

Group Label

Send a message containing a custom group member label.

```javascript
await client.sendMessage(m.chat, {
  groupLabel: {
    labelText: 'Tagged members appear here'
  }
});
```

---

Send to Group Members

Use sendMessageMembers() to send a message through the group members messaging helper.

```javascript
await client.sendMessageMembers(m.chat, {
  extendedTextMessage: {
    text: 'Hello members'
  }
}, {});
```

---

Message Helpers

LiniusNv includes convenient helper methods for common messaging operations.

These methods simplify sending text, images, videos, audio, locations, polls, quizzes, and status mentions.

Send Text

```javascript
await client.sendText(
  m.chat,
  'Hello!',
  {
    contextInfo: {
      mentionedJid: [m.chat]
    }
  },
  {
    key: {
      remoteJid: 'status@broadcast',
      participant: m.sender,
      fromMe: true
    },
    message: {
      conversation: '\0'
    }
  }
);
```

Send Image

```javascript
await client.sendImage(
  m.chat,
  { url: './liniusnvimg.jpg' },
  'Caption',
  {
    contextInfo: {
      mentionedJid: [m.chat]
    }
  },
  {
    key: {
      remoteJid: 'status@broadcast',
      participant: m.sender,
      fromMe: true
    },
    message: {
      conversation: '\0'
    }
  }
);
```

Send Video

```javascript
await client.sendVideo(
  m.chat,
  { url: './liniusnvvideo.mp4' },
  'Caption',
  {
    contextInfo: {
      mentionedJid: [m.chat]
    }
  },
  {
    key: {
      remoteJid: 'status@broadcast',
      participant: m.sender,
      fromMe: true
    },
    message: {
      conversation: '\0'
    }
  }
);
```

Send Audio

```javascript
await client.sendAudio(
  m.chat,
  { url: './liniusnvaudio.mp3' },
  {
    contextInfo: {
      mentionedJid: [m.chat]
    }
  },
  {
    key: {
      remoteJid: 'status@broadcast',
      participant: m.sender,
      fromMe: true
    },
    message: {
      conversation: '\0'
    }
  }
);
```

Send Location

```javascript
await client.sendLocation(
  m.chat,
  'Caption',
  90.0,
  90.0,
  'https://example.com',
  '1234567890',
  {
    contextInfo: {
      mentionedJid: [m.chat]
    }
  },
  {
    key: {
      remoteJid: 'status@broadcast',
      participant: m.sender,
      fromMe: true
    },
    message: {
      conversation: '\0'
    }
  }
);
```

Send Poll

```javascript
await client.sendPoll(
  m.chat,
  'Pick one',
  ['1', '2', '3'],
  true,
  {
    contextInfo: {
      mentionedJid: [m.chat]
    }
  },
  {
    key: {
      remoteJid: 'status@broadcast',
      participant: m.sender,
      fromMe: true
    },
    message: {
      conversation: '\0'
    }
  }
);
```

Send Quiz

```javascript
await client.sendQuiz(
  m.chat,
  'Quiz question',
  ['1', '2', '3'],
  '2',
  {
    contextInfo: {
      mentionedJid: [m.chat]
    }
  },
  {
    key: {
      remoteJid: 'status@broadcast',
      participant: m.sender,
      fromMe: true
    },
    message: {
      conversation: '\0'
    }
  }
);
```

Send Status Mention

Send a message through the status mention helper.

```javascript
await client.statusMention(m.chat, {
  extendedTextMessage: {
    text: 'Mentioned in status'
  }
});
```

---

Credits

LiniusNv is built upon the foundation of Baileys.

Special thanks to:

· Adhiraj Singh — Original creator of Baileys.
· WhiskeySockets — Maintainers of the Baileys project.
· Open-source contributors — Developers who help maintain and improve the underlying ecosystem.

All credits for the original protocol implementation belong to their respective authors and contributors.

For licensing information, see LICENSE.

---

Contributing

Contributions are welcome.

If you encounter bugs, have feature requests, or want to improve the project, please refer to:

· CONTRIBUTING.md
· GitHub Repository

Before submitting a contribution, make sure your changes are properly tested and documented.

---

Disclaimer

LiniusNv is an independent, unofficial project and is not affiliated with, endorsed by, or sponsored by WhatsApp or Meta.

This library interacts with WhatsApp Web through an unofficial implementation.

Users are responsible for ensuring that their usage complies with applicable laws and WhatsApp's Terms of Service.

Sending bulk, unsolicited, or abusive messages may result in account restrictions or permanent bans.

Use LiniusNv responsibly.


---
