#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DOMAINS_PATH = path.resolve(__dirname, "..", "src", "data", "domains.json");

function normalizeCandidateDomain(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("://")) return "";
  if (/[/?#@]/.test(trimmed)) return "";

  const lowerNoDot = trimmed.toLowerCase().replace(/\.+$/, "");
  if (!lowerNoDot) return "";

  if (lowerNoDot.startsWith("[") || lowerNoDot.includes(":")) return "";

  let hostname = "";
  try {
    hostname = new URL(`http://${lowerNoDot}`).hostname.toLowerCase().replace(/\.+$/, "");
  } catch {
    return "";
  }

  if (!hostname) return "";
  if (hostname.length > 253) return "";
  if (hostname.includes("..")) return "";

  const labels = hostname.split(".");
  if (labels.length < 2) return "";

  for (const label of labels) {
    if (!label || label.length > 63) return "";
    if (label.startsWith("-") || label.endsWith("-")) return "";
    if (!/^[a-z0-9-]+$/.test(label)) return "";
  }

  return hostname;
}

function readDomainsFile(filePath) {
  let raw = "";
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Could not read file: ${filePath}\n${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}\n${error.message}`);
  }
}

function validateDomainsData(data) {
  const errors = [];

  if (!Array.isArray(data)) {
    errors.push("Root value must be an array.");
    return errors;
  }

  if (data.length === 0) {
    errors.push("Domain list must not be empty.");
    return errors;
  }

  const seen = new Map();

  data.forEach((entry, index) => {
    const prefix = `Entry ${index} (index ${index})`;

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${prefix}: must be an object with "domain" and "description" fields.`);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(entry, "domain")) {
      errors.push(`${prefix}: missing required "domain" field.`);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(entry, "description")) {
      errors.push(`${prefix}: missing required "description" field.`);
      return;
    }

    if (typeof entry.description !== "string" || !entry.description.trim()) {
      errors.push(`${prefix}: "description" must be a non-empty string.`);
    }

    const domainRaw = entry.domain;
    const canonical = normalizeCandidateDomain(domainRaw);
    if (!canonical) {
      errors.push(`${prefix}: invalid domain "${String(domainRaw)}".`);
      return;
    }

    const normalizedInput = String(domainRaw).trim().toLowerCase().replace(/\.+$/, "");
    if (normalizedInput !== canonical) {
      errors.push(
        `${prefix}: domain "${String(domainRaw)}" is not canonical. Use "${canonical}" instead.`
      );
      return;
    }

    if (seen.has(canonical)) {
      errors.push(
        `${prefix}: duplicate domain "${canonical}" (first seen at index ${seen.get(canonical)}).`
      );
      return;
    }

    seen.set(canonical, index);
  });

  return errors;
}

function main() {
  const data = readDomainsFile(DOMAINS_PATH);
  const errors = validateDomainsData(data);

  if (errors.length > 0) {
    console.error(`Domain validation failed for ${DOMAINS_PATH}`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Domain validation passed (${data.length} entries).`);
}

main();
