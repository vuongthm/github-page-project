---
title: "The OSI Model Explained Clearly"
description: "A clear breakdown of the seven-layer OSI model — what each layer does, why the model exists, and how to remember it."
tags: ["networking", "osi", "fundamentals"]
date: "2025-7-1"
lang: "en"
weight: 1
locked: false
---
# The OSI Model Explained Clearly
The OSI (Open Systems Interconnection) model is a conceptual framework that standardizes the functions of a communication system into seven distinct layers.
![Layered network stack](/media/notes/fundamentals/layered-stack.svg)
## Why It Exists
Before the OSI model, different manufacturers built network devices that were incompatible with one another. Devices from one manufacturer couldn't communicate with devices from another. The OSI model solved this by providing a common language and a common set of rules.
### Core mindset
Think of each layer as a contract: it receives a task, adds the necessary information, then passes the result down to the layer below.
## The Seven Layers
| Layer | Name | Function |
|------|-----|-----------|
| 7 | Application | User-facing protocols (HTTP, FTP, DNS) |
| 6 | Presentation | Data formatting, encryption, compression |
| 5 | Session | Managing connections between applications |
| 4 | Transport | End-to-end delivery (TCP, UDP) |
| 3 | Network | Logical addressing and routing (IP) |
| 2 | Data Link | Physical addressing (MAC), error detection |
| 1 | Physical | Raw bits over the medium (cables, radio waves) |
### The path of a packet
Application → Presentation → Session → Transport → Network → Data Link → Physical
#### Example
An HTTP request begins at layer 7, gets encapsulated by TCP at layer 4, and finally becomes bits on the network wire.
## Reality in Practice
In practice, most engineers work with the four-layer TCP/IP model rather than the seven-layer OSI model. But OSI is still useful for:
- **Troubleshooting**: "Is this a layer 3 problem (routing) or a layer 2 problem (switching)?"
- **Communicating with vendors**: A shared vocabulary between teams and companies
- **Learning**: Building intuition for how networks actually work
## Layer 4 vs. Layer 7
A common point of confusion is between "layer 4 load balancing" and "layer 7 load balancing":
- **Layer 4** routes based on IP and TCP/UDP port — fast but less intelligent. It doesn't look at the content.
- **Layer 7** routes based on HTTP headers, URL, or cookies — slower but much smarter. It can send `/api/` to one server and `/static/` to another.
### Why engineers still use OSI
This model isn't a protocol stack. It's a way of describing the fault domain.
#### A practical rule
Once you identify the layer where the behavior changes, debugging time usually drops significantly.