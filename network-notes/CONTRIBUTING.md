# Contributing Content to network-notes

We welcome your contributions to improve, update, or translate our technical notes and stories. This document explains how you can propose new writing or correct existing ones.

## Guidelines for Writers

### 1. Frontmatter Requirements

Every Markdown file must begin with a standardized metadata block at the top. Here is the template:

---
title: "The Standardized Title"
description: "A short, concise summary of what this document covers."
tags: ["networking", "osi", "fundamentals"]
date: "YYYY-MM-DD"
lang: "en"
weight: 10
---

- Title: Keep it descriptive and clear.
- Description: Ensure it fits beautifully in cards.
- Lang: Specify "en" for English and "vi" for Vietnamese.
- Weight: The progressive sequence order (lower numbers appear first).

### 2. File Structure

Organize files into their respective subfolders and locales:
- `network-notes/category-name/en/your-note.md`
- `network-notes/category-name/vi/your-note.md`

Place any related diagnostic diagrams or SVG drawings inside the `media` subdirectory at the category level:
- `network-notes/category-name/media/your-drawing.svg`

## Submission Process

1. Fork this content repository on GitHub.
2. Add your new markdown files or apply corrections to existing ones.
3. Commit and push your changes to your fork.
4. Submit a Pull Request pointing to our main branch.
5. We will review the content, check formatting alignment, and merge once ready.