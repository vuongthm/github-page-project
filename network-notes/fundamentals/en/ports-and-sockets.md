---
title: "Ports and Sockets: Identifying Applications"
description: "An IP address only gets data to the right machine — but that machine has dozens of applications running at once, so how does the data find the right application?"
tags: ["fundamentals", "transport"]
date: "2026-07-01"
lang: "en"
weight: 7
locked: false
---

# Ports and Sockets: Identifying Applications

In the article on encapsulation, the Transport header was mentioned as holding "the source port, destination port" — but why is another layer of identification needed, when the IP address has already identified exactly which device should receive the data? The answer lies in a simple fact: a computer doesn't just run one application.

![Port and socket diagram](/media/notes/fundamentals/port-socket.png)
*A single IP address but many different ports, each leading to a separate application on the same machine.*

## When there's only an IP address and no port

Imagine a computer with a web browser, an email application, and a video call all open at the same time — all three receive data through the same IP address, since the machine only has one IP address. If data were identified by IP address alone, the operating system wouldn't know whether an incoming packet was meant for the browser, the email app, or the video call app — everything would get mixed together. This is precisely the problem that ports were created to solve.

## What is a port?

A port is a number from 0 to 65535, used to identify a specific application or service running on a device, at the Transport layer (Layer 4 in OSI). If the IP address answers the question "send it to which machine", the port answers the question "send it to which application on that machine".

Since a port is a 16-bit field in the TCP/UDP header, the maximum number of possible ports is 2^16 = 65536 (from 0 to 65535).

## Classifying ports by range

The IANA (Internet Assigned Numbers Authority) manages port allocation into 3 main groups:

| Range | Name | Purpose |
|---|---|---|
| 0 – 1023 | Well-known ports | Reserved for standard services, common worldwide (HTTP, HTTPS, DNS, FTP...) |
| 1024 – 49151 | Registered ports | Registered by companies/organizations for their own applications |
| 49152 – 65535 | Dynamic/Private ports | Temporarily assigned by the operating system for client connections |

### Some commonly seen well-known ports

| Port | Protocol | Service |
|---|---|---|
| 20/21 | TCP | FTP (file transfer) |
| 22 | TCP | SSH (secure remote access) |
| 25 | TCP | SMTP (sending email) |
| 53 | TCP/UDP | DNS (domain name resolution) |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |

These are ports that will reappear many times in later articles of the series, especially the ones on DNS and HTTP/HTTPS.

## What is a socket?

If a port is just a number, then a **socket** is the combination of an IP address and a port, forming a complete and unique identifier for a specific connection. The commonly used notation is: `IP:port`, for example `192.168.1.10:443`.

A socket, in other words, is the "full address" that the operating system uses to distinguish: which machine this data is going to (IP), and which application on that machine (port).

### Why a connection needs 2 sockets

A complete TCP connection between a client and a server is actually identified by **4 values**, collectively called a socket pair (4-tuple):

```
(Source IP, Source Port, Destination IP, Destination Port)
```

For example, when a browser connects to a website:
```
(192.168.1.10:52341, 93.184.216.34:443)
```

Thanks to these full 4 values, the operating system can distinguish between hundreds of TCP connections open at the same time on one machine — even when they're all connecting to the same server on the same destination port (443), as long as the source port differs for each connection.

## How the source port gets assigned

When a client application (for example, a browser) initiates a connection, the operating system automatically picks a random source port within the dynamic port range (usually above 49152, depending on the operating system) — this is called an **ephemeral port**. The destination port, on the other hand, is usually fixed, since it must match the port the server is listening on (for example, 443 for HTTPS).

## Common mistakes

- Assuming an IP address can only open one connection at a time — in reality, thanks to ports and the socket pair mechanism, a single IP can serve thousands of simultaneous connections.
- Misconfiguring a firewall to block the wrong port, which ends up blocking a legitimate service — for example, blocking port 443 will prevent all HTTPS traffic from getting through, even though the destination IP address is completely valid.
- Two applications on the same machine trying to listen on the same port — the operating system will report an "address already in use" error, since each port can only be listened on by one process at a time on the same IP address.

#### Conclusion

An IP address gets data to the right front door of the house, but the port is what leads the data to the right room inside. Without ports, every application on the same machine would have to compete for the same single stream of data — and the Internet as it exists today, where one machine can browse the web, make a video call, and download a file all at once, wouldn't be able to function.