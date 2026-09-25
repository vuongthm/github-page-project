---
title: "The TCP/IP Model: 4 Practical Layers"
description: "OSI has 7 layers to fully describe every concept, but the Internet actually runs on a leaner model — 4 layers. Why did the leaner one win?"
tags: ["tcp-ip", "model", "fundamentals"]
date: "2025-7-1"
lang: "en"
weight: 3
locked: false
---

# The TCP/IP Model: 4 Practical Layers

OSI was born in 1984 with 7 layers, carefully designed and clearly separated — but the Internet everyone uses today doesn't run on OSI. It runs on a different model, one that actually predates OSI, with only 4 layers: TCP/IP. This is one of the most interesting paradoxes in networking history — the "less complete" model turned out to be the one that won in practice.

![Diagram comparing the OSI model and the TCP/IP model](/media/notes/fundamentals/tcp-ip-model.png)

## When two models exist at once, which one is "correct"?

This is a question that confuses many people new to networking: after learning OSI, then hearing during practice that "the Internet uses TCP/IP" — so is OSI useless? Not exactly. The issue isn't about which model is "more correct" — the two models were created for two different purposes, and understanding this difference clearly will keep you from getting confused every time you read technical documentation.

## What is TCP/IP?

TCP/IP (Transmission Control Protocol/Internet Protocol) is the actual protocol suite used to run the Internet, developed by the US Department of Defense (DARPA) starting in the 1970s, before OSI was published by ISO. Unlike OSI — a theoretical reference model — TCP/IP was built alongside the actual implementation of real protocols, which is why it's leaner and more practical.

TCP/IP is divided into 4 layers, 3 fewer than OSI, because some OSI layers were merged since in practice they're often handled together by a single piece of software or a single logical layer.

## How the 4 layers map to the 7 OSI layers

| TCP/IP (4 layers) | OSI equivalent | Role |
|---|---|---|
| Application | Application + Presentation + Session (5,6,7) | Application protocols, data formatting, session management — all merged into one layer |
| Transport | Transport (4) | Ensuring data arrives correctly/completely (TCP) or sending quickly without guarantees (UDP) |
| Internet | Network (3) | Addressing and routing between networks (IP) |
| Link (or Network Access) | Data Link + Physical (1,2) | Data transmission within the local network and physical signaling — merged into one layer |

Looking at this table, you'll see: TCP/IP doesn't "drop" any part of OSI — it just **groups together the layers that usually go hand in hand in real-world implementation**. For example, the Application layer of TCP/IP handles both data formatting (which is Presentation's job in OSI) and session management (which is Session's job) — because in most real applications, these three tasks are written within the same piece of software, with no need to separate them into 3 distinct module layers.

### Why TCP/IP "won" in practice

There are three main reasons, documented in many networking history sources (including the Internet Society and the IETF):

1. **TCP/IP was implemented first, and it worked** — while OSI was still a theoretical design. A protocol that actually runs always has an advantage over a standard that's "perfect on paper".
2. **TCP/IP was simpler to implement** — fewer layers means fewer abstraction layers to handle when writing network software.
3. **The cost of switching was too high** — by the time OSI was finalized, TCP/IP had already been widely deployed across universities and research institutions in the US via ARPANET, making it economically impractical to replace the entire infrastructure with OSI.

## So why learn OSI at all, if the Internet doesn't run on it?

OSI still holds significant value as a **common language for describing and debugging**. When an engineer says "this issue is at Layer 3", every other engineer in the world, regardless of tools or equipment vendor, immediately understands they're talking about a routing/IP issue — because the term "Layer" is standardized according to OSI, not TCP/IP. In other words: **implementing according to TCP/IP, but talking and debugging in the language of OSI** is the most common practice in the industry.

## Common misconceptions

- Thinking that TCP/IP is "newer, so it must be better" than OSI — in fact, TCP/IP came *before* OSI, and the two models serve different purposes (one for implementation, one for description/reference), not an "old version vs. new version" relationship.
- Trying to force a specific protocol to fit "exactly" into a single OSI layer — in reality, some protocols span functions across multiple layers, and this classification should only be seen as a thinking aid, not an absolute rule.
- Confusing the "Internet" layer of TCP/IP with "the Internet" in the everyday sense (the global network) — in the context of the model, the "Internet layer" simply refers to the layer that handles IP addressing and routing, not the entire Internet infrastructure.

#### Conclusion

TCP/IP won not because it was more theoretically complete, but because it ran first and was good enough that no one needed to replace it. This is a lesson that repeats itself over and over in technology: a standard that's "good enough and arrives first" often beats a standard that's "perfect but arrives later".