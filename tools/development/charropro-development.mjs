#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import {
  DEFAULT_LOCAL_PROJECT_ID,
  buildEmulatorSmokePlan,
  buildEmulatorStartPlan,
  buildEnvironmentDescriptor,
  buildToolingReport,
  parseEnvironmentText,
  validateEnvironmentDescriptor,
  validateFirebaseEmulatorConfiguration
} from "./environmentFoundation.mjs";

const ROOT_DIRECTORY = resolve(dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_ENVIRONMENT_FILE = ".env.local";
const DEFAULT_DATA_DIRECTORY = ".local/firebase-emulator-data";
const PID_FILE = resolve(ROOT_DIRECTORY, ".local/charropro-emulators.pid");
const LOG_FILE = resolve(ROOT_DIRECTORY, ".local/charropro-emulators.log");

function usage() {
  return [
    "Usage: node tools/development/charropro-development.mjs <command> [options]",
    "",
    "Commands:",
    "  validate [--env-file <path>]    Validate the selected profile and Firebase emulator config.",
    "  versions                         Report Node, npm, Java, Firebase CLI, Git, and gcloud versions.",
    "  emulators:start [--background]   Start the isolated local Emulator Suite.",
    "  emulators:stop                   Stop a suite previously started with --background.",
    "  emulators:clear --confirm         Clear only ignored local emulator export data.",
    "  emulators:smoke [--env-file <p>] Start a fresh suite and verify all four emulator endpoints.",
    "  local:seed                        Seed only synthetic users and DEMO / LOCAL / NO OFICIAL data.",
    "  local:reset --confirm             Remove and recreate only synthetic Emulator data.",
    "  web:start [--port <port>]         Serve this repository on loopback with no-store responses.",
    "",
    `Local project is fixed to ${DEFAULT_LOCAL_PROJECT_ID}; production is never a default.`
  ].join("\n");
}

function readOption(argv, option) {
  const index = argv.indexOf(option);
  if (index < 0) return "";
  return argv[index + 1] || "";
}

function hasOption(argv, option) {
  return argv.includes(option);
}

function runVersion(command, args = []) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error || result.status !== 0) return "";
  return `${result.stdout || ""}${result.stderr || ""}`.trim().split(/\r?\n/)[0] || "";
}

function loadEnvironment(argv) {
  const requestedPath = readOption(argv, "--env-file") || DEFAULT_ENVIRONMENT_FILE;
  const environmentPath = resolve(ROOT_DIRECTORY, requestedPath);
  const fromFile = existsSync(environmentPath) ? parseEnvironmentText(readFileSync(environmentPath, "utf8")) : { values: {}, errors: [] };
  const source = { ...fromFile.values, ...process.env };
  const descriptor = buildEnvironmentDescriptor(source);
  const validation = validateEnvironmentDescriptor(descriptor);
  return { descriptor, validation, environmentPath, parseErrors: fromFile.errors };
}

function loadFirebaseConfiguration() {
  const filePath = resolve(ROOT_DIRECTORY, "firebase.json");
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function validateCommand(argv) {
  const environment = loadEnvironment(argv);
  const firebaseValidation = validateFirebaseEmulatorConfiguration(loadFirebaseConfiguration());
  const result = {
    environmentFile: environment.environmentPath,
    descriptor: environment.descriptor,
    environmentValidation: environment.validation,
    environmentParseErrors: environment.parseErrors,
    firebaseValidation
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return environment.parseErrors.length === 0 && environment.validation.valid && firebaseValidation.valid ? 0 : 1;
}

function versionsCommand() {
  const javaCommand = process.env.JAVA_HOME ? resolve(process.env.JAVA_HOME, "bin/java") : "java";
  const report = buildToolingReport({
    nodeVersion: process.version,
    npmVersion: runVersion("npm", ["--version"]),
    firebaseVersion: runVersion(process.env.FIREBASE_BIN || "firebase", ["--version"]),
    javaVersion: runVersion(javaCommand, ["-version"]),
    gitVersion: runVersion("git", ["--version"]),
    gcloudVersion: runVersion("gcloud", ["--version"])
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.warnings.some((warning) => ["node-20-lts-required-for-functions-baseline", "java-21-lts-required-by-firebase-emulators", "firebase-cli-required", "git-required"].includes(warning)) ? 1 : 0;
}

function spawnFirebase(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: ROOT_DIRECTORY,
    env: { ...process.env, FIREBASE_PROJECT_ID: DEFAULT_LOCAL_PROJECT_ID },
    detached: Boolean(options.detached),
    stdio: options.stdio || "inherit"
  });
  return child;
}

function emulatorStartCommand(argv) {
  const environment = loadEnvironment(argv);
  if (environment.parseErrors.length || !environment.validation.valid) {
    process.stderr.write(`Invalid local environment: ${[...environment.parseErrors, ...environment.validation.errors].join(", ")}\n`);
    return 1;
  }
  const plan = buildEmulatorStartPlan(environment.descriptor, {
    firebaseCommand: process.env.FIREBASE_BIN || "firebase",
    importDirectory: DEFAULT_DATA_DIRECTORY
  });
  if (!hasOption(argv, "--background")) {
    const child = spawnFirebase(plan.command, plan.args);
    child.on("exit", (code) => process.exitCode = code || 0);
    return 0;
  }
  const child = spawnFirebase(plan.command, plan.args, { detached: true, stdio: "ignore" });
  child.unref();
  mkdirSync(dirname(PID_FILE), { recursive: true });
  writeFileSync(PID_FILE, `${child.pid}\n`, "utf8");
  writeFileSync(LOG_FILE, "Firebase Emulator Suite started in detached mode. Use emulators:stop to stop it.\n", "utf8");
  process.stdout.write(`Started local Emulator Suite with pid ${child.pid}.\n`);
  return 0;
}

function emulatorStopCommand() {
  if (!existsSync(PID_FILE)) {
    process.stdout.write("No detached Emulator Suite process is managed by this repository.\n");
    return 0;
  }
  const pid = Number.parseInt(readFileSync(PID_FILE, "utf8"), 10);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error("invalid-emulator-pid-file");
  try {
    process.kill(-pid, "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
  rmSync(PID_FILE, { force: true });
  process.stdout.write("Stopped the managed local Emulator Suite.\n");
  return 0;
}

function emulatorClearCommand(argv) {
  if (!hasOption(argv, "--confirm")) {
    process.stderr.write("Refusing to clear local emulator data without --confirm.\n");
    return 1;
  }
  const target = resolve(ROOT_DIRECTORY, DEFAULT_DATA_DIRECTORY);
  const allowedRoot = resolve(ROOT_DIRECTORY, ".local");
  if (!target.startsWith(`${allowedRoot}/`)) throw new Error("unsafe-emulator-data-path");
  rmSync(target, { recursive: true, force: true });
  process.stdout.write(`Cleared ${DEFAULT_DATA_DIRECTORY}. No Firebase remote resource was touched.\n`);
  return 0;
}

function emulatorSmokeCommand(argv) {
  const environment = loadEnvironment(argv);
  if (environment.parseErrors.length || !environment.validation.valid) {
    process.stderr.write(`Invalid local environment: ${[...environment.parseErrors, ...environment.validation.errors].join(", ")}\n`);
    return 1;
  }
  const plan = buildEmulatorSmokePlan(environment.descriptor, {
    firebaseCommand: process.env.FIREBASE_BIN || "firebase",
    script: "tools/development/emulatorSmokeTest.mjs"
  });
  const smokeScript = resolve(ROOT_DIRECTORY, plan.script);
  const smokeCommand = `\"${process.execPath}\" \"${smokeScript}\"`;
  const args = ["emulators:exec", "--only", plan.services.join(","), "--project", plan.projectId, smokeCommand];
  const child = spawnFirebase(plan.command, args);
  child.on("exit", (code) => process.exitCode = code || 0);
  return 0;
}

function localSeedCommand(argv, options = {}) {
  if (options.reset && !hasOption(argv, "--confirm")) {
    process.stderr.write("Refusing to reset local runtime data without --confirm.\n");
    return 1;
  }
  const environment = loadEnvironment(argv);
  if (environment.parseErrors.length || !environment.validation.valid || environment.descriptor.projectId !== DEFAULT_LOCAL_PROJECT_ID) {
    process.stderr.write("Local runtime seed requires the isolated demo-charropro-local profile.\n");
    return 1;
  }
  const seedScript = resolve(ROOT_DIRECTORY, "tools/development/localRuntimeSeed.mjs");
  const args = [seedScript];
  if (options.reset) args.push("--reset");
  const child = spawn(process.execPath, args, {
    cwd: ROOT_DIRECTORY,
    env: {
      ...process.env,
      FIREBASE_PROJECT_ID: DEFAULT_LOCAL_PROJECT_ID,
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      FIREBASE_DATABASE_EMULATOR_HOST: "127.0.0.1:9000",
      FIREBASE_FUNCTIONS_EMULATOR_HOST: "127.0.0.1:5001",
      FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199"
    },
    stdio: "inherit"
  });
  child.on("exit", (code) => process.exitCode = code || 0);
  return 0;
}

function webStartCommand(argv) {
  const requestedPort = readOption(argv, "--port");
  if (requestedPort && (!/^\d+$/.test(requestedPort) || Number(requestedPort) < 1024 || Number(requestedPort) > 65535)) {
    process.stderr.write("Local web port must be an integer between 1024 and 65535.\n");
    return 1;
  }
  const webServer = resolve(ROOT_DIRECTORY, "tools/development/localWebServer.mjs");
  const child = spawn(process.execPath, [webServer, requestedPort || "8765"], {
    cwd: ROOT_DIRECTORY,
    env: { ...process.env, CHARROPRO_ENV: "local", FIREBASE_PROJECT_ID: DEFAULT_LOCAL_PROJECT_ID },
    stdio: "inherit"
  });
  child.on("exit", (code) => process.exitCode = code || 0);
  return 0;
}

function main(argv) {
  const [command = "help"] = argv;
  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  if (command === "validate") return validateCommand(argv.slice(1));
  if (command === "versions") return versionsCommand();
  if (command === "emulators:start") return emulatorStartCommand(argv.slice(1));
  if (command === "emulators:stop") return emulatorStopCommand();
  if (command === "emulators:clear") return emulatorClearCommand(argv.slice(1));
  if (command === "emulators:smoke") return emulatorSmokeCommand(argv.slice(1));
  if (command === "local:seed") return localSeedCommand(argv.slice(1));
  if (command === "local:reset") return localSeedCommand(argv.slice(1), { reset: true });
  if (command === "web:start") return webStartCommand(argv.slice(1));
  process.stderr.write(`${usage()}\n`);
  return 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`Development infrastructure command failed: ${error.message}\n`);
  process.exitCode = 1;
}
