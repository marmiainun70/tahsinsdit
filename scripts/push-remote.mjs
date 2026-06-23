import { execFileSync } from "node:child_process";

const env = { ...process.env };

delete env.GITHUB_TOKEN;
delete env.GH_TOKEN;
delete env.GIT_ASKPASS;
delete env.SSH_ASKPASS;

const git = (args, options = {}) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: "inherit",
    env,
    ...options,
  });

const branch = execFileSync("git", ["branch", "--show-current"], {
  encoding: "utf8",
  env,
}).trim();

if (!branch) {
  throw new Error("Push dibatalkan: HEAD tidak berada pada branch.");
}

console.log(`Push branch ${branch} ke origin menggunakan Git Credential Manager...`);

git([
  "-c",
  "credential.helper=",
  "-c",
  "credential.helper=manager",
  "push",
  "origin",
  branch,
]);

