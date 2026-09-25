---
title: "What Is a Network?"
description: "Before talking about IP, TCP, or DNS, you need to understand what problem a network solves, and why everything in it revolves around one word: standardization."
tags: ["basics", "network", "fundamentals"]
date: "2025-7-1"
lang: "en"
weight: 1
locked: false
---

# What Is a Network?

Two computers placed side by side, both plugged in, both running, but unable to talk to each other — until someone connects a cable between them and both agree on the same way to "talk". A network, at its deepest core, isn't cables or Wi-Fi signals. It's a set of rules that lets completely unfamiliar devices understand one another.

![Diagram of devices connected in a network](/media/notes/fundamentals/layered-stack.png)

## When there's no "common rule"

Imagine a company with 50 computers, each from a different manufacturer, each running a different operating system. Without any standard at all, machine A sends data its own way, machine B reads data its own way — the result is that no one understands anyone else, even if the cables are connected correctly and there's enough power. This is exactly the problem networking was created to solve: how can any two devices, made by any two companies, running any operating system, still exchange data reliably.

## What is a network?

A network, simply put, is a collection of devices (called **nodes**) connected to each other by a transmission medium (called a **link**) to share data and resources. A node can be a computer, a phone, a printer, or even networking devices themselves like routers. A link can be copper cable, fiber-optic cable, or radio waves.

But having nodes and links alone isn't enough to call something a network — an invisible component is also needed: **protocol**, the set of rules that governs how nodes "talk" to each other. Without a protocol, a network is just a bundle of wires connecting machines that don't understand each other.

## How a network works, at a general level

Whether small or large, every network revolves around three basic questions that a protocol must answer:

1. **Who is talking to whom?** — a way to identify devices is needed, which is why IP addresses and MAC addresses exist.
2. **Which path does the data travel?** — a routing mechanism is needed so data can find its way from source to destination, even when the destination is thousands of kilometers away.
3. **How do we know the data arrived correctly and completely?** — an error-control, acknowledgment, and recovery mechanism is needed for when something gets lost along the way.

These three questions are exactly the questions every article in this series, from IP addressing to TCP and DNS, is trying to answer in more detail.

## Classification by scale

| Type | Range | Example |
|------|---------|-------|
| PAN (Personal Area Network) | A few meters | Bluetooth between a phone and headphones |
| LAN (Local Area Network) | A building, an office | Home Wi-Fi network, company network |
| MAN (Metropolitan Area Network) | A city | A service provider's cable network within a city |
| WAN (Wide Area Network) | Cross-region, cross-country | The Internet, a multinational company's internal network |

The boundaries between these types aren't absolute — the Internet is actually one enormous WAN made up of countless smaller LANs connected together. This is also a core idea that will come back many times throughout the series: large networks are always built from smaller networks, following the same logic.

### Why standardization matters so much

The reason modern networking runs smoothly is that standards are agreed upon publicly, not dependent on any single company. Organizations like the IETF (Internet Engineering Task Force) publish standards in the form of RFC (Request for Comments) documents — this is exactly why a laptop, a phone, and a server on the other side of the world, despite being different brands and generations, can still speak the same "language" when communicating over the Internet.

## When standardization is missing, or about to be violated

- Two devices using two different standards (for example, one side using IPv4, the other only understanding IPv6 with no bridge) won't be able to communicate, even if both are perfectly healthy in terms of hardware.
- A device misconfigured with the wrong address, or using an address that duplicates another device on the same network, will cause a conflict, disconnecting both sides.
- A physical link that's cut or shorted — data still gets sent out according to the correct protocol, but never reaches its destination.

These problems sound basic, but they're exactly where most real-world networking failures start — most incidents aren't rooted in complex protocols, but in these seemingly simple foundations.

#### Conclusion

A network isn't cables or Wi-Fi signals — it's agreement. Every more complex concept you'll encounter in this series, from IP addresses to TCP or DNS, is just a more detailed layer of standardization built on top of this exact foundational idea: for two unfamiliar devices to understand each other, both must agree to speak the same language.